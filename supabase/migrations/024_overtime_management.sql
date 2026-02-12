-- ============================================
-- OVERTIME MANAGEMENT SYSTEM
-- Migration: 024_overtime_management.sql
-- Description: Creates tables, indexes, RLS policies, and triggers for the overtime management system
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

-- Add 'overtime_request' to the request_type enum for comments integration
ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'overtime_request';

-- ============================================
-- TABLES
-- ============================================

-- Overtime requests table
CREATE TABLE overtime_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_hours NUMERIC(4, 2) NOT NULL CHECK (total_hours > 0 AND total_hours <= 24),
  overtime_type TEXT NOT NULL CHECK (overtime_type IN ('regular', 'double')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_tl', 'pending_wfm', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending_tl',
  
  -- Approval tracking
  tl_reviewed_by UUID REFERENCES auth.users(id),
  tl_reviewed_at TIMESTAMPTZ,
  tl_decision TEXT CHECK (tl_decision IN ('approved', 'rejected')),
  tl_notes TEXT,
  
  wfm_reviewed_by UUID REFERENCES auth.users(id),
  wfm_reviewed_at TIMESTAMPTZ,
  wfm_decision TEXT CHECK (wfm_decision IN ('approved', 'rejected')),
  wfm_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate requests for same time period
  CONSTRAINT no_duplicate_overtime UNIQUE(requester_id, request_date, start_time, end_time)
);

-- Overtime settings table
CREATE TABLE overtime_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Indexes for performance optimization
CREATE INDEX idx_overtime_requests_requester ON overtime_requests(requester_id);
CREATE INDEX idx_overtime_requests_status ON overtime_requests(status);
CREATE INDEX idx_overtime_requests_date ON overtime_requests(request_date);
CREATE INDEX idx_overtime_requests_status_date ON overtime_requests(status, request_date);
CREATE INDEX idx_overtime_requests_date_range ON overtime_requests(request_date) WHERE status = 'approved';

-- ============================================
-- DEFAULT SETTINGS
-- ============================================

-- Insert default overtime settings
INSERT INTO overtime_settings (setting_key, setting_value, description) VALUES
('auto_approve', '{"enabled": false}'::jsonb, 'Auto-approve overtime after TL approval (skip WFM)'),
('max_daily_hours', '{"regular": 4, "double": 2}'::jsonb, 'Maximum overtime hours per day by type'),
('max_weekly_hours', '{"regular": 12, "double": 4}'::jsonb, 'Maximum overtime hours per week by type'),
('require_shift_verification', '{"enabled": true}'::jsonb, 'Verify overtime against scheduled shift'),
('approval_deadline_days', '{"days": 7}'::jsonb, 'Number of days from work date to submit overtime'),
('pay_multipliers', '{"regular": 1.5, "double": 2.0}'::jsonb, 'Pay rate multipliers for reporting');

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on overtime_requests table
ALTER TABLE overtime_requests ENABLE ROW LEVEL SECURITY;

-- Agents can view their own requests
CREATE POLICY "Agents can view own overtime"
  ON overtime_requests FOR SELECT
  USING (auth.uid() = requester_id);

-- Agents can insert their own requests
CREATE POLICY "Agents can create overtime"
  ON overtime_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Agents can cancel their own pending requests
CREATE POLICY "Agents can cancel own overtime"
  ON overtime_requests FOR UPDATE
  USING (
    auth.uid() = requester_id
    AND status IN ('pending_tl', 'pending_wfm')
  )
  WITH CHECK (status = 'cancelled');

-- TL can view their team's requests
CREATE POLICY "TL can view team overtime"
  ON overtime_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1, users u2
      WHERE u1.id = auth.uid()
      AND u1.role = 'tl'
      AND u2.id = overtime_requests.requester_id
      AND u1.department = u2.department
    )
  );

-- TL can approve/reject team requests
CREATE POLICY "TL can manage team overtime"
  ON overtime_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u1, users u2
      WHERE u1.id = auth.uid()
      AND u1.role = 'tl'
      AND u2.id = overtime_requests.requester_id
      AND u1.department = u2.department
    )
    AND status = 'pending_tl'
  );

-- WFM can view all requests
CREATE POLICY "WFM can view all overtime"
  ON overtime_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- WFM can approve/reject all requests
CREATE POLICY "WFM can manage all overtime"
  ON overtime_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
    AND status IN ('pending_tl', 'pending_wfm')
  );

-- WFM can delete requests (admin cleanup)
CREATE POLICY "WFM can delete overtime"
  ON overtime_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- Enable RLS on overtime_settings table
ALTER TABLE overtime_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view settings
CREATE POLICY "All users can view overtime settings"
  ON overtime_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only WFM can update settings
CREATE POLICY "WFM can update overtime settings"
  ON overtime_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Database trigger for auto-approve logic
CREATE OR REPLACE FUNCTION handle_overtime_approval()
RETURNS TRIGGER AS $$
DECLARE
  auto_approve_enabled BOOLEAN;
BEGIN
  -- Check if auto-approve is enabled
  SELECT (setting_value->>'enabled')::boolean INTO auto_approve_enabled
  FROM overtime_settings
  WHERE setting_key = 'auto_approve';
  
  -- If TL just approved and auto-approve is on, skip to approved
  IF NEW.status = 'pending_wfm' AND OLD.status = 'pending_tl' AND auto_approve_enabled THEN
    NEW.status := 'approved';
    NEW.wfm_reviewed_by := NEW.tl_reviewed_by;
    NEW.wfm_reviewed_at := NOW();
    NEW.wfm_decision := 'approved';
    NEW.wfm_notes := 'Auto-approved (setting enabled)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER overtime_auto_approve_trigger
  BEFORE UPDATE ON overtime_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_overtime_approval();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_overtime_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER overtime_requests_updated_at
  BEFORE UPDATE ON overtime_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_overtime_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

-- Comments table already exists and supports overtime_request type via the enum update above
-- No additional changes needed to the comments table structure
