-- SwapTool Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('agent', 'tl', 'wfm');

-- Shift types enum
CREATE TYPE shift_type AS ENUM ('AM', 'PM', 'BET', 'OFF');

-- Swap request status enum
CREATE TYPE swap_request_status AS ENUM ('pending_acceptance', 'pending_tl', 'pending_wfm', 'approved', 'rejected');

-- Leave request status enum
CREATE TYPE leave_request_status AS ENUM ('pending_tl', 'pending_wfm', 'approved', 'rejected');

-- Leave types enum
CREATE TYPE leave_type AS ENUM ('sick', 'annual', 'casual', 'public_holiday', 'bereavement');

-- Request types enum (for comments)
CREATE TYPE request_type AS ENUM ('swap', 'leave');

-- ============================================
-- TABLES
-- ============================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'agent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shifts table
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_type shift_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Swap requests table
CREATE TABLE swap_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requester_shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    target_shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    status swap_request_status NOT NULL DEFAULT 'pending_acceptance',
    tl_approved_at TIMESTAMPTZ,
    wfm_approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT different_users CHECK (requester_id != target_user_id)
);

-- Leave requests table
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status leave_request_status NOT NULL DEFAULT 'pending_tl',
    tl_approved_at TIMESTAMPTZ,
    wfm_approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Leave balances table
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    balance DECIMAL(5,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, leave_type)
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type request_type NOT NULL,
    request_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_swap_requests_requester ON swap_requests(requester_id);
CREATE INDEX idx_swap_requests_target ON swap_requests(target_user_id);
CREATE INDEX idx_swap_requests_status ON swap_requests(status);
CREATE INDEX idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_balances_user ON leave_balances(user_id);
CREATE INDEX idx_comments_request ON comments(request_type, request_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can read all users (needed for swap targets)
CREATE POLICY "Users can view all users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

-- Users can update only their own profile (except role)
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile during signup
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- WFM can update any user (for role changes)
CREATE POLICY "WFM can update any user"
    ON users FOR UPDATE
    TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm');

-- ============================================
-- SHIFTS POLICIES
-- ============================================

-- Everyone can view all shifts (needed for swap functionality)
CREATE POLICY "Users can view all shifts"
    ON shifts FOR SELECT
    TO authenticated
    USING (true);

-- Users can insert their own shifts
CREATE POLICY "Users can insert own shifts"
    ON shifts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own shifts
CREATE POLICY "Users can update own shifts"
    ON shifts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- WFM can manage all shifts
CREATE POLICY "WFM can manage all shifts"
    ON shifts FOR ALL
    TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm');

-- ============================================
-- SWAP REQUESTS POLICIES
-- ============================================

-- Users can view swap requests they're involved in
CREATE POLICY "Users can view own swap requests"
    ON swap_requests FOR SELECT
    TO authenticated
    USING (
        auth.uid() = requester_id 
        OR auth.uid() = target_user_id
        OR get_user_role(auth.uid()) IN ('tl', 'wfm')
    );

-- Users can create swap requests
CREATE POLICY "Users can create swap requests"
    ON swap_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = requester_id);

-- Target user can accept/reject (update status from pending_acceptance)
CREATE POLICY "Target can accept swap request"
    ON swap_requests FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = target_user_id 
        AND status = 'pending_acceptance'
    );

-- TL can approve (update status from pending_tl)
CREATE POLICY "TL can approve swap request"
    ON swap_requests FOR UPDATE
    TO authenticated
    USING (
        get_user_role(auth.uid()) IN ('tl', 'wfm')
        AND status = 'pending_tl'
    );

-- WFM can approve (update status from pending_wfm)
CREATE POLICY "WFM can approve swap request"
    ON swap_requests FOR UPDATE
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'wfm'
        AND status = 'pending_wfm'
    );

-- Requester can cancel their own request
CREATE POLICY "Requester can cancel swap request"
    ON swap_requests FOR DELETE
    TO authenticated
    USING (
        auth.uid() = requester_id 
        AND status = 'pending_acceptance'
    );

-- ============================================
-- LEAVE REQUESTS POLICIES
-- ============================================

-- Users can view their own leave requests, TL/WFM can view all
CREATE POLICY "Users can view own leave requests"
    ON leave_requests FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR get_user_role(auth.uid()) IN ('tl', 'wfm')
    );

-- Users can create leave requests
CREATE POLICY "Users can create leave requests"
    ON leave_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- TL can approve leave requests (pending_tl status)
CREATE POLICY "TL can approve leave requests"
    ON leave_requests FOR UPDATE
    TO authenticated
    USING (
        get_user_role(auth.uid()) IN ('tl', 'wfm')
        AND status = 'pending_tl'
    );

-- WFM can approve leave requests (pending_wfm status)
CREATE POLICY "WFM can approve leave requests"
    ON leave_requests FOR UPDATE
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'wfm'
        AND status = 'pending_wfm'
    );

-- Users can cancel their pending leave requests
CREATE POLICY "Users can cancel pending leave requests"
    ON leave_requests FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id 
        AND status = 'pending_tl'
    );

-- ============================================
-- LEAVE BALANCES POLICIES
-- ============================================

-- Users can view their own balances, TL/WFM can view all
CREATE POLICY "Users can view own leave balances"
    ON leave_balances FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR get_user_role(auth.uid()) IN ('tl', 'wfm')
    );

-- Only WFM can manage leave balances
CREATE POLICY "WFM can manage leave balances"
    ON leave_balances FOR ALL
    TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm');

-- ============================================
-- COMMENTS POLICIES
-- ============================================

-- Users can view comments on requests they can view
CREATE POLICY "Users can view related comments"
    ON comments FOR SELECT
    TO authenticated
    USING (true);

-- Users can add comments
CREATE POLICY "Users can add comments"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
    ON comments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- SETTINGS POLICIES
-- ============================================

-- Everyone can read settings
CREATE POLICY "Everyone can read settings"
    ON settings FOR SELECT
    TO authenticated
    USING (true);

-- Only WFM can manage settings
CREATE POLICY "WFM can manage settings"
    ON settings FOR ALL
    TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm');

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default settings
INSERT INTO settings (key, value) VALUES
    ('wfm_auto_approve', 'false')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================

-- Function to initialize leave balances for a new user
CREATE OR REPLACE FUNCTION initialize_leave_balances()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO leave_balances (user_id, leave_type, balance)
    VALUES
        (NEW.id, 'annual', 21),
        (NEW.id, 'sick', 15),
        (NEW.id, 'casual', 6),
        (NEW.id, 'public_holiday', 0),
        (NEW.id, 'bereavement', 3);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create leave balances when user is created
CREATE TRIGGER on_user_created
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_leave_balances();

-- Function to update leave balance when leave is approved
CREATE OR REPLACE FUNCTION deduct_leave_balance()
RETURNS TRIGGER AS $$
DECLARE
    days_requested INTEGER;
BEGIN
    -- Only run when status changes to approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        days_requested := NEW.end_date - NEW.start_date + 1;
        
        UPDATE leave_balances
        SET balance = balance - days_requested,
            updated_at = NOW()
        WHERE user_id = NEW.user_id
        AND leave_type = NEW.leave_type;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to deduct leave balance on approval
CREATE TRIGGER on_leave_approved
    AFTER UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION deduct_leave_balance();

-- Function to execute shift swap when approved
CREATE OR REPLACE FUNCTION execute_shift_swap()
RETURNS TRIGGER AS $$
DECLARE
    requester_shift_type shift_type;
    target_shift_type shift_type;
    requester_date DATE;
    target_date DATE;
BEGIN
    -- Only run when status changes to approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Get shift details
        SELECT shift_type, date INTO requester_shift_type, requester_date
        FROM shifts WHERE id = NEW.requester_shift_id;
        
        SELECT shift_type, date INTO target_shift_type, target_date
        FROM shifts WHERE id = NEW.target_shift_id;
        
        -- Swap the shift types
        UPDATE shifts SET shift_type = target_shift_type WHERE id = NEW.requester_shift_id;
        UPDATE shifts SET shift_type = requester_shift_type WHERE id = NEW.target_shift_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute swap on approval
CREATE TRIGGER on_swap_approved
    AFTER UPDATE ON swap_requests
    FOR EACH ROW
    EXECUTE FUNCTION execute_shift_swap();
