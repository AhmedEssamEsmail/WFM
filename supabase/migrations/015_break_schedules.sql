-- ============================================
-- Break Schedule Management Migration
-- Creates tables, functions, triggers, and RLS policies
-- ============================================

-- ============================================
-- TABLES
-- ============================================

-- 1. break_schedules table
CREATE TABLE break_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  shift_type TEXT CHECK (shift_type IN ('AM', 'PM', 'BET', 'OFF')), -- Denormalized for quick access
  interval_start TIME NOT NULL, -- e.g., '09:00:00'
  break_type TEXT NOT NULL CHECK (break_type IN ('IN', 'HB1', 'B', 'HB2')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate intervals per user per day
  UNIQUE(user_id, schedule_date, interval_start)
);

-- Indexes for break_schedules
CREATE INDEX idx_break_schedules_date ON break_schedules(schedule_date);
CREATE INDEX idx_break_schedules_user_date ON break_schedules(user_id, schedule_date);
CREATE INDEX idx_break_schedules_date_interval ON break_schedules(schedule_date, interval_start);

-- 2. break_schedule_rules table
CREATE TABLE break_schedule_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name TEXT NOT NULL UNIQUE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('distribution', 'ordering', 'timing', 'coverage')),
  description TEXT,
  parameters JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_blocking BOOLEAN DEFAULT false, -- If true, prevents saving; if false, shows warning
  priority INTEGER DEFAULT 0, -- Lower number = higher priority
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. break_schedule_warnings table
CREATE TABLE break_schedule_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  warning_type TEXT NOT NULL CHECK (warning_type IN ('shift_changed', 'breaks_cleared', 'swap_pending')),
  old_shift_type TEXT CHECK (old_shift_type IN ('AM', 'PM', 'BET', 'OFF')),
  new_shift_type TEXT CHECK (new_shift_type IN ('AM', 'PM', 'BET', 'OFF')),
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, schedule_date, warning_type)
);

-- Index for break_schedule_warnings
CREATE INDEX idx_warnings_unresolved ON break_schedule_warnings(schedule_date, is_resolved);

-- ============================================
-- INITIAL DATA - Example Rules
-- ============================================

INSERT INTO break_schedule_rules (rule_name, rule_type, description, parameters, is_blocking, priority) VALUES
('break_ordering', 'ordering', 'HB1 must come before B, B before HB2',
  '{"sequence": ["HB1", "B", "HB2"], "enforce_strict": true}'::jsonb, true, 1),
  
('minimum_gap', 'timing', 'Minimum time between consecutive breaks',
  '{"min_minutes": 90, "applies_to": ["HB1-B", "B-HB2"]}'::jsonb, true, 2),
  
('maximum_gap', 'timing', 'Maximum time between consecutive breaks',
  '{"max_minutes": 270, "applies_to": ["HB1-B", "B-HB2"]}'::jsonb, false, 3),

('shift_boundary', 'timing', 'Breaks must be within shift hours',
  '{"enforce_strict": true}'::jsonb, true, 4),

('minimum_coverage', 'coverage', 'Minimum agents required per interval',
  '{"min_agents": 3, "alert_threshold": 5}'::jsonb, false, 5);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Clear breaks on shift change
CREATE OR REPLACE FUNCTION handle_shift_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if shift type actually changed
  IF OLD.shift_type IS DISTINCT FROM NEW.shift_type THEN
    -- Delete existing breaks for this user on this date
    DELETE FROM break_schedules
    WHERE user_id = NEW.user_id
      AND schedule_date = NEW.date;
    
    -- Create warning
    INSERT INTO break_schedule_warnings (user_id, schedule_date, warning_type, old_shift_type, new_shift_type)
    VALUES (NEW.user_id, NEW.date, 'shift_changed', OLD.shift_type, NEW.shift_type)
    ON CONFLICT (user_id, schedule_date, warning_type)
    DO UPDATE SET
      old_shift_type = EXCLUDED.old_shift_type,
      new_shift_type = EXCLUDED.new_shift_type,
      is_resolved = false,
      created_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Swap breaks when swap approved
CREATE OR REPLACE FUNCTION swap_break_schedules()
RETURNS TRIGGER AS $$
DECLARE
  requester_date DATE;
  target_date DATE;
BEGIN
  -- Only proceed if swap request just got approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Get dates from shift IDs
    SELECT date INTO requester_date FROM shifts WHERE id = NEW.requester_shift_id;
    SELECT date INTO target_date FROM shifts WHERE id = NEW.target_shift_id;
    
    -- Swap breaks for requester's date
    WITH temp_breaks AS (
      DELETE FROM break_schedules
      WHERE (user_id = NEW.requester_id OR user_id = NEW.target_user_id)
        AND schedule_date = requester_date
      RETURNING *
    )
    INSERT INTO break_schedules (user_id, schedule_date, shift_type, interval_start, break_type, created_by)
    SELECT
      CASE
        WHEN user_id = NEW.requester_id THEN NEW.target_user_id
        ELSE NEW.requester_id
      END,
      schedule_date,
      shift_type,
      interval_start,
      break_type,
      auth.uid() -- Set to current user (approver)
    FROM temp_breaks;
    
    -- Swap breaks for target's date
    WITH temp_breaks AS (
      DELETE FROM break_schedules
      WHERE (user_id = NEW.requester_id OR user_id = NEW.target_user_id)
        AND schedule_date = target_date
      RETURNING *
    )
    INSERT INTO break_schedules (user_id, schedule_date, shift_type, interval_start, break_type, created_by)
    SELECT
      CASE
        WHEN user_id = NEW.requester_id THEN NEW.target_user_id
        ELSE NEW.requester_id
      END,
      schedule_date,
      shift_type,
      interval_start,
      break_type,
      auth.uid() -- Set to current user (approver)
    FROM temp_breaks;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Update updated_at on break_schedules
CREATE TRIGGER update_break_schedules_updated_at
  BEFORE UPDATE ON break_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on break_schedule_rules
CREATE TRIGGER update_break_schedule_rules_updated_at
  BEFORE UPDATE ON break_schedule_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Handle shift changes
CREATE TRIGGER shift_change_trigger
  AFTER UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION handle_shift_change();

-- Trigger: Swap breaks on swap approval
CREATE TRIGGER swap_breaks_trigger
  AFTER UPDATE ON swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION swap_break_schedules();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE break_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_schedule_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_schedule_warnings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - break_schedules
-- ============================================

-- Agents can view their own breaks
CREATE POLICY "Agents can view own breaks"
  ON break_schedules FOR SELECT
  USING (auth.uid() = user_id);

-- TL can view their team's breaks
CREATE POLICY "TL can view team breaks"
  ON break_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'tl'
      AND users.department = (
        SELECT department FROM users WHERE id = break_schedules.user_id
      )
    )
  );

-- WFM can view all breaks
CREATE POLICY "WFM can view all breaks"
  ON break_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- Only WFM can insert/update/delete
CREATE POLICY "WFM can manage breaks"
  ON break_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- ============================================
-- RLS POLICIES - break_schedule_rules
-- ============================================

-- Everyone can view rules
CREATE POLICY "Everyone can view rules"
  ON break_schedule_rules FOR SELECT
  USING (true);

-- Only WFM can modify rules
CREATE POLICY "WFM can manage rules"
  ON break_schedule_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- ============================================
-- RLS POLICIES - break_schedule_warnings
-- ============================================

-- Users can view their own warnings
CREATE POLICY "Users can view own warnings"
  ON break_schedule_warnings FOR SELECT
  USING (auth.uid() = user_id);

-- TL can view their team's warnings
CREATE POLICY "TL can view team warnings"
  ON break_schedule_warnings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'tl'
      AND users.department = (
        SELECT department FROM users WHERE id = break_schedule_warnings.user_id
      )
    )
  );

-- WFM can view all warnings
CREATE POLICY "WFM can view all warnings"
  ON break_schedule_warnings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- Only WFM can update warnings (to dismiss them)
CREATE POLICY "WFM can dismiss warnings"
  ON break_schedule_warnings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE break_schedules IS 'Stores break schedules for agents across 15-minute intervals';
COMMENT ON TABLE break_schedule_rules IS 'Configurable business rules for break scheduling validation';
COMMENT ON TABLE break_schedule_warnings IS 'Warnings when shifts change and breaks are cleared';

COMMENT ON COLUMN break_schedules.shift_type IS 'Denormalized shift type for quick access';
COMMENT ON COLUMN break_schedules.interval_start IS '15-minute interval start time (e.g., 09:00:00)';
COMMENT ON COLUMN break_schedules.break_type IS 'Break status: IN (working), HB1 (half-break 1), B (full break), HB2 (half-break 2)';
COMMENT ON COLUMN break_schedule_rules.is_blocking IS 'If true, violations prevent saving; if false, show warning only';
COMMENT ON COLUMN break_schedule_rules.priority IS 'Lower number = higher priority for conflict resolution';

-- ============================================
-- END OF MIGRATION
-- ============================================
