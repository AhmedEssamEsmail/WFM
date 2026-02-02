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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leave requests table
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status leave_request_status NOT NULL DEFAULT 'pending_tl',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leave balances table
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    UNIQUE(user_id, leave_type, year)
);

-- Comments/Notes table for requests
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type request_type NOT NULL,
    request_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings table for WFM configuration
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_shifts_user_date ON shifts(user_id, date);
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

-- Swap requests policies
CREATE POLICY "Users can view swap requests they're involved in" ON swap_requests
FOR SELECT USING (
  auth.uid() = requester_id 
  OR auth.uid() = target_user_id
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('wfm', 'tl'))
);

CREATE POLICY "Users can create swap requests" ON swap_requests
FOR INSERT WITH CHECK (
  auth.uid() = requester_id
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('wfm', 'tl'))
);

CREATE POLICY "Users can update swap requests they're involved in" ON swap_requests
FOR UPDATE USING (
  auth.uid() = requester_id 
  OR auth.uid() = target_user_id
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('wfm', 'tl'))
);

CREATE POLICY "Users can delete their own swap requests" ON swap_requests
FOR DELETE USING (
  auth.uid() = requester_id
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('wfm', 'tl'))
);
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
-- AUTO-CREATE USER PROFILE ON SIGNUP (Bug Fix)
-- ============================================
-- This trigger automatically creates a user profile in public.users
-- when a new user signs up in auth.users. Uses SECURITY DEFINER to
-- bypass RLS policies during the insert.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'agent'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- WFM can update any user (for role changes)
CREATE POLICY "WFM can update any user"
    ON users FOR UPDATE
    TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm');

-- Note: INSERT policy removed - user creation is handled by trigger

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
        auth.uid() = requester_id OR 
        auth.uid() = target_user_id OR
        get_user_role(auth.uid()) IN ('tl', 'wfm')
    );

-- Users can create swap requests
CREATE POLICY "Users can create swap requests"
    ON swap_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = requester_id);

-- Users can update swap requests they're involved in (for acceptance)
CREATE POLICY "Users can update swap requests"
    ON swap_requests FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = requester_id OR 
        auth.uid() = target_user_id OR
        get_user_role(auth.uid()) IN ('tl', 'wfm')
    );

-- TL/WFM can view all swap requests
CREATE POLICY "TL and WFM can view all swap requests"
    ON swap_requests FOR SELECT
    TO authenticated
    USING (get_user_role(auth.uid()) IN ('tl', 'wfm'));

-- ============================================
-- LEAVE REQUESTS POLICIES
-- ============================================

-- Users can view their own leave requests
CREATE POLICY "Users can view own leave requests"
    ON leave_requests FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR
        get_user_role(auth.uid()) IN ('tl', 'wfm')
    );

-- Users can create leave requests
CREATE POLICY "Users can create leave requests"
    ON leave_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- TL/WFM can update leave requests
CREATE POLICY "TL and WFM can update leave requests"
    ON leave_requests FOR UPDATE
    TO authenticated
    USING (get_user_role(auth.uid()) IN ('tl', 'wfm'));

-- ============================================
-- LEAVE BALANCES POLICIES
-- ============================================

-- Users can view their own balances
CREATE POLICY "Users can view own leave balances"
    ON leave_balances FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR
        get_user_role(auth.uid()) IN ('tl', 'wfm')
    );

-- WFM can manage all balances
CREATE POLICY "WFM can manage leave balances"
    ON leave_balances FOR ALL
    TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm');

-- ============================================
-- COMMENTS POLICIES
-- ============================================

-- Users can view comments on their requests
CREATE POLICY "Users can view comments"
    ON comments FOR SELECT
    TO authenticated
    USING (true);

-- Users can create comments
CREATE POLICY "Users can create comments"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SETTINGS POLICIES
-- ============================================

-- Everyone can view settings
CREATE POLICY "Users can view settings"
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
    ('max_swaps_per_month', '4'::jsonb),
    ('advance_notice_days', '3'::jsonb),
    ('approval_workflow', '"tl_then_wfm"'::jsonb)
ON CONFLICT (key) DO NOTHING;
