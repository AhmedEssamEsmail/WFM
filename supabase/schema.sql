-- WFM (Workforce Management) Database Schema
-- Complete schema matching production database
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('agent', 'tl', 'wfm');

-- Shift types enum
CREATE TYPE shift_type AS ENUM ('AM', 'PM', 'BET', 'OFF');

-- Swap request status enum
CREATE TYPE swap_request_status AS ENUM ('pending_acceptance', 'pending_tl', 'pending_wfm', 'approved', 'rejected');

-- Leave request status enum (includes 'denied' for auto-denial)
CREATE TYPE leave_request_status AS ENUM ('pending_tl', 'pending_wfm', 'approved', 'rejected', 'denied');

-- Leave types enum
CREATE TYPE leave_type AS ENUM ('sick', 'annual', 'casual', 'public_holiday', 'bereavement');

-- Request types enum (for comments)
CREATE TYPE request_type AS ENUM ('swap', 'leave');

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (extended with headcount fields)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'agent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Headcount fields
    employee_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive, on_leave, terminated, suspended
    department TEXT,
    hire_date DATE,
    manager_id UUID REFERENCES users(id)
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

-- Swap requests table (with original shift tracking)
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
    -- Original shift tracking (for display after swap execution)
    requester_original_date DATE,
    requester_original_shift_type shift_type,
    target_original_date DATE,
    target_original_shift_type shift_type,
    requester_original_shift_type_on_target_date shift_type,
    target_original_shift_type_on_requester_date shift_type
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
    notes TEXT
);

-- Leave balances table
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    balance NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, leave_type)
);

-- Leave balance history table (audit trail)
CREATE TABLE leave_balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    previous_balance NUMERIC NOT NULL,
    new_balance NUMERIC NOT NULL,
    change_reason TEXT,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table (for swap and leave requests)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type request_type NOT NULL,
    request_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_system BOOLEAN DEFAULT FALSE
);

-- Settings table (WFM configuration)
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leave types table (configurable leave types)
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT,
    color TEXT NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- HEADCOUNT TABLES
-- ============================================

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    parent_department_id UUID REFERENCES departments(id),
    head_id UUID REFERENCES users(id),
    cost_center TEXT,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Headcount profiles table (extended employee information)
CREATE TABLE headcount_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    job_title TEXT,
    job_level TEXT,
    employment_type TEXT NOT NULL DEFAULT 'full_time',
    location TEXT,
    time_zone TEXT DEFAULT 'UTC',
    phone TEXT,
    skills TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    max_weekly_hours INTEGER DEFAULT 40,
    cost_center TEXT,
    budget_code TEXT,
    termination_date DATE,
    onboarding_status TEXT DEFAULT 'completed',
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Headcount audit log table
CREATE TABLE headcount_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    previous_values JSONB,
    new_values JSONB,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ============================================
-- VIEWS
-- ============================================

-- Active headcount view (joins users with profiles and manager info)
CREATE OR REPLACE VIEW v_headcount_active AS
SELECT 
    u.id,
    u.employee_id,
    u.email,
    u.name,
    u.role,
    u.status,
    u.department,
    u.hire_date,
    u.manager_id,
    u.created_at,
    hp.job_title,
    hp.job_level,
    hp.employment_type,
    hp.location,
    hp.time_zone,
    hp.phone,
    hp.skills,
    hp.max_weekly_hours,
    hp.cost_center,
    hp.onboarding_status,
    hp.last_active_at,
    m.name AS manager_name,
    m.email AS manager_email
FROM users u
LEFT JOIN headcount_profiles hp ON u.id = hp.user_id
LEFT JOIN users m ON u.manager_id = m.id;

-- Department summary view
CREATE OR REPLACE VIEW v_department_summary AS
SELECT 
    u.department,
    COUNT(*) AS total_headcount,
    COUNT(*) FILTER (WHERE u.status = 'active') AS active_count,
    COUNT(*) FILTER (WHERE u.status = 'on_leave') AS on_leave_count,
    COUNT(*) FILTER (WHERE u.role = 'agent') AS agents_count,
    COUNT(*) FILTER (WHERE u.role = 'tl') AS tls_count,
    COUNT(*) FILTER (WHERE u.role = 'wfm') AS wfm_count,
    COUNT(*) FILTER (WHERE hp.employment_type = 'contractor') AS contractors_count
FROM users u
LEFT JOIN headcount_profiles hp ON u.id = hp.user_id
WHERE u.status IN ('active', 'on_leave')
GROUP BY u.department;

-- Management chain view (hierarchical structure)
CREATE OR REPLACE VIEW v_management_chain AS
WITH RECURSIVE management_tree AS (
    -- Base case: employees without managers (top level)
    SELECT 
        id,
        name,
        email,
        manager_id,
        role,
        department,
        1 AS level,
        ARRAY[id] AS path
    FROM users
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive case: employees with managers
    SELECT 
        u.id,
        u.name,
        u.email,
        u.manager_id,
        u.role,
        u.department,
        mt.level + 1,
        mt.path || u.id
    FROM users u
    INNER JOIN management_tree mt ON u.manager_id = mt.id
)
SELECT * FROM management_tree;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_shifts_user_date ON shifts(user_id, date);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_swap_requests_requester ON swap_requests(requester_id);
CREATE INDEX idx_swap_requests_target ON swap_requests(target_user_id);
CREATE INDEX idx_swap_requests_status ON swap_requests(status);
CREATE INDEX idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_balances_user ON leave_balances(user_id);
CREATE INDEX idx_leave_balances_user_id ON leave_balances(user_id);
CREATE INDEX idx_leave_balance_history_user_id ON leave_balance_history(user_id);
CREATE INDEX idx_comments_request ON comments(request_type, request_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_settings_key ON settings(key);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Auto-create user profile on signup
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

-- Initialize leave balances for new users
CREATE OR REPLACE FUNCTION initialize_user_leave_balances()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO leave_balances (user_id, leave_type, balance)
    VALUES 
        (NEW.id, 'annual', 0),
        (NEW.id, 'casual', 0),
        (NEW.id, 'sick', 0),
        (NEW.id, 'public_holiday', 0),
        (NEW.id, 'bereavement', 0)
    ON CONFLICT (user_id, leave_type) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Drop existing triggers if they exist (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_init_leave_balances ON users;

-- Create trigger to auto-create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger to auto-initialize leave balances for new users
CREATE TRIGGER trigger_init_leave_balances
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_leave_balances();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE headcount_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE headcount_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================

CREATE POLICY "Users can view all users"
    ON users FOR SELECT
    TO public
    USING ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "Allow view active users"
    ON users FOR SELECT
    TO authenticated
    USING (status = ANY (ARRAY['active'::text, 'on_leave'::text]));

CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    TO public
    WITH CHECK ((auth.uid() = id) AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text));

CREATE POLICY "WFM and users can update"
    ON users FOR UPDATE
    TO authenticated
    USING ((get_user_role(auth.uid()) = 'wfm'::user_role) OR (auth.uid() = id))
    WITH CHECK ((get_user_role(auth.uid()) = 'wfm'::user_role) OR (auth.uid() = id));

-- ============================================
-- SHIFTS POLICIES
-- ============================================

CREATE POLICY "Users can view shifts"
    ON shifts FOR SELECT
    TO public
    USING ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "Users can view all shifts"
    ON shifts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert shifts"
    ON shifts FOR INSERT
    TO public
    WITH CHECK ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "Users can insert own shifts"
    ON shifts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update shifts"
    ON shifts FOR UPDATE
    TO public
    USING ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "Users can update own shifts"
    ON shifts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete shifts"
    ON shifts FOR DELETE
    TO public
    USING ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "WFM can manage all shifts"
    ON shifts FOR ALL
    TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm');

-- ============================================
-- SWAP REQUESTS POLICIES
-- ============================================

CREATE POLICY "Users can view swap requests"
    ON swap_requests FOR SELECT
    TO public
    USING ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "Users can view own swap requests"
    ON swap_requests FOR SELECT
    TO authenticated
    USING (
        auth.uid() = requester_id OR 
        auth.uid() = target_user_id OR
        get_user_role(auth.uid()) = ANY (ARRAY['tl'::user_role, 'wfm'::user_role])
    );

CREATE POLICY "Users can create swap requests"
    ON swap_requests FOR INSERT
    TO public
    WITH CHECK ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "Users can update own swap requests"
    ON swap_requests FOR UPDATE
    TO public
    USING ((requester_id = auth.uid()) AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text));

CREATE POLICY "Users can update swap requests they're involved in"
    ON swap_requests FOR UPDATE
    TO public
    USING (
        (auth.uid() = requester_id) OR 
        (auth.uid() = target_user_id) OR 
        (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['wfm'::user_role, 'tl'::user_role])))))
    );

CREATE POLICY "Target can accept swap request"
    ON swap_requests FOR UPDATE
    TO authenticated
    USING ((auth.uid() = target_user_id) AND (status = 'pending_acceptance'::swap_request_status));

CREATE POLICY "TL can approve swap request"
    ON swap_requests FOR UPDATE
    TO authenticated
    USING ((get_user_role(auth.uid()) = ANY (ARRAY['tl'::user_role, 'wfm'::user_role])) AND (status = 'pending_tl'::swap_request_status));

CREATE POLICY "WFM can approve swap request"
    ON swap_requests FOR UPDATE
    TO authenticated
    USING ((get_user_role(auth.uid()) = 'wfm'::user_role) AND (status = 'pending_wfm'::swap_request_status));

CREATE POLICY "Users can delete own swap requests"
    ON swap_requests FOR DELETE
    TO public
    USING ((requester_id = auth.uid()) AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text));

CREATE POLICY "Requester can cancel swap request"
    ON swap_requests FOR DELETE
    TO authenticated
    USING ((auth.uid() = requester_id) AND (status = 'pending_acceptance'::swap_request_status));

-- ============================================
-- LEAVE REQUESTS POLICIES
-- ============================================

CREATE POLICY "Users can view leave requests"
    ON leave_requests FOR SELECT
    TO public
    USING ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "Users can create leave requests"
    ON leave_requests FOR INSERT
    TO public
    WITH CHECK ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "Users can insert leave requests"
    ON leave_requests FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.uid() = user_id) OR 
        (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['tl'::user_role, 'wfm'::user_role])))))
    );

CREATE POLICY "Users can update own leave requests"
    ON leave_requests FOR UPDATE
    TO public
    USING ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text));

CREATE POLICY "Users can update leave requests"
    ON leave_requests FOR UPDATE
    TO authenticated
    USING (
        ((auth.uid() = user_id) AND (status <> 'approved'::leave_request_status)) OR 
        (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['tl'::user_role, 'wfm'::user_role])))))
    )
    WITH CHECK (
        ((auth.uid() = user_id) AND (status <> 'approved'::leave_request_status)) OR 
        (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['tl'::user_role, 'wfm'::user_role])))))
    );

CREATE POLICY "TL can approve leave requests"
    ON leave_requests FOR UPDATE
    TO authenticated
    USING ((get_user_role(auth.uid()) = ANY (ARRAY['tl'::user_role, 'wfm'::user_role])) AND (status = 'pending_tl'::leave_request_status));

CREATE POLICY "WFM can approve leave requests"
    ON leave_requests FOR UPDATE
    TO authenticated
    USING ((get_user_role(auth.uid()) = 'wfm'::user_role) AND (status = 'pending_wfm'::leave_request_status));

CREATE POLICY "TL/WFM can modify approved leaves"
    ON leave_requests FOR UPDATE
    TO public
    USING (
        (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['wfm'::user_role, 'tl'::user_role]))))) AND 
        (status = 'approved'::leave_request_status)
    );

CREATE POLICY "Users can delete own leave requests"
    ON leave_requests FOR DELETE
    TO public
    USING ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text));

CREATE POLICY "Users can cancel pending leave requests"
    ON leave_requests FOR DELETE
    TO authenticated
    USING ((auth.uid() = user_id) AND (status = 'pending_tl'::leave_request_status));

CREATE POLICY "Users can delete leave requests"
    ON leave_requests FOR DELETE
    TO authenticated
    USING (
        ((auth.uid() = user_id) AND (status <> 'approved'::leave_request_status)) OR 
        (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['tl'::user_role, 'wfm'::user_role])))))
    );

CREATE POLICY "TL/WFM can delete leave requests"
    ON leave_requests FOR DELETE
    TO public
    USING (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['wfm'::user_role, 'tl'::user_role])))));

-- ============================================
-- LEAVE BALANCES POLICIES
-- ============================================

CREATE POLICY "Users can view own leave balances"
    ON leave_balances FOR SELECT
    TO public
    USING ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text));

CREATE POLICY "Users can insert own leave balances"
    ON leave_balances FOR INSERT
    TO public
    WITH CHECK ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text));

CREATE POLICY "Users can update own leave balances"
    ON leave_balances FOR UPDATE
    TO public
    USING ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text));

CREATE POLICY "TL can view all agent leave balances"
    ON leave_balances FOR SELECT
    TO authenticated
    USING (
        (user_id = auth.uid()) OR 
        (EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'tl'::user_role 
            AND (SELECT role FROM users WHERE id = leave_balances.user_id) = 'agent'::user_role
        ))
    );

CREATE POLICY "WFM can manage leave balances"
    ON leave_balances FOR ALL
    TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm'::user_role);

-- ============================================
-- LEAVE BALANCE HISTORY POLICIES
-- ============================================

CREATE POLICY "Users can view own leave balance history"
    ON leave_balance_history FOR SELECT
    TO public
    USING ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text));

CREATE POLICY "Users can view own balance history"
    ON leave_balance_history FOR SELECT
    TO authenticated
    USING (
        (user_id = auth.uid()) OR 
        (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['tl'::user_role, 'wfm'::user_role])))))
    );

CREATE POLICY "System can insert leave balance history"
    ON leave_balance_history FOR INSERT
    TO public
    WITH CHECK ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "WFM can insert balance history"
    ON leave_balance_history FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'wfm'::user_role))));

CREATE POLICY "WFM can view all history"
    ON leave_balance_history FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'wfm'::user_role))));

-- ============================================
-- COMMENTS POLICIES
-- ============================================

CREATE POLICY "Users can view comments"
    ON comments FOR SELECT
    TO public
    USING ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "Users can view comments on their requests"
    ON comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can view related comments"
    ON comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create comments"
    ON comments FOR INSERT
    TO public
    WITH CHECK ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text));

CREATE POLICY "Users can add comments"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
    ON comments FOR UPDATE
    TO public
    USING ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text));

CREATE POLICY "Users can delete own comments"
    ON comments FOR DELETE
    TO public
    USING ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text));

-- ============================================
-- SETTINGS POLICIES
-- ============================================

CREATE POLICY "Users can view settings"
    ON settings FOR SELECT
    TO public
    USING ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "Anyone can read settings"
    ON settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Everyone can read settings"
    ON settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage settings"
    ON settings FOR ALL
    TO public
    USING ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "WFM can update settings"
    ON settings FOR UPDATE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'wfm'::user_role))));

CREATE POLICY "WFM can manage settings"
    ON settings FOR ALL
    TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm'::user_role);

-- ============================================
-- LEAVE TYPES POLICIES
-- ============================================

CREATE POLICY "Users can view leave types"
    ON leave_types FOR SELECT
    TO public
    USING ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "Admins can manage leave types"
    ON leave_types FOR ALL
    TO public
    USING ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "Allow WFM to manage leave_types"
    ON leave_types FOR ALL
    TO public
    USING (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'wfm'::user_role))))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'wfm'::user_role))));

-- ============================================
-- DEPARTMENTS POLICIES
-- ============================================

CREATE POLICY "All view departments"
    ON departments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "WFM edit departments"
    ON departments FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'wfm'::user_role))));

-- ============================================
-- HEADCOUNT PROFILES POLICIES
-- ============================================

CREATE POLICY "Users view own profile"
    ON headcount_profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "TL view department profiles"
    ON headcount_profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE ((users.id = auth.uid()) AND 
                   (users.role = 'tl'::user_role) AND 
                   (users.department = (SELECT users_1.department FROM users users_1 WHERE (users_1.id = headcount_profiles.user_id))))
        )
    );

CREATE POLICY "WFM full access profiles"
    ON headcount_profiles FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'wfm'::user_role))))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'wfm'::user_role))));

-- ============================================
-- HEADCOUNT AUDIT LOG POLICIES
-- ============================================

CREATE POLICY "Users view own audit"
    ON headcount_audit_log FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "WFM view all audit"
    ON headcount_audit_log FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'wfm'::user_role))));

CREATE POLICY "WFM can insert audit logs"
    ON headcount_audit_log FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'wfm'::user_role))));

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default settings
INSERT INTO settings (key, value) VALUES
    ('wfm_auto_approve', 'false'),
    ('allow_leave_exceptions', 'true')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'User profiles with role-based access control and headcount fields';
COMMENT ON TABLE shifts IS 'Daily shift assignments for users';
COMMENT ON TABLE swap_requests IS 'Shift swap requests with multi-level approval workflow';
COMMENT ON TABLE leave_requests IS 'Leave/time-off requests with approval workflow';
COMMENT ON TABLE leave_balances IS 'Per-user leave entitlement balances by type';
COMMENT ON TABLE leave_balance_history IS 'Audit trail for leave balance changes';
COMMENT ON TABLE comments IS 'Comments and discussions on swap/leave requests';
COMMENT ON TABLE settings IS 'Application-wide WFM configuration';
COMMENT ON TABLE leave_types IS 'Configurable leave type definitions';
COMMENT ON TABLE departments IS 'Department hierarchy and structure';
COMMENT ON TABLE headcount_profiles IS 'Extended employee information and profiles';
COMMENT ON TABLE headcount_audit_log IS 'Audit trail for headcount changes';

COMMENT ON COLUMN swap_requests.requester_original_date IS 'Original date of the requester shift at time of request creation';
COMMENT ON COLUMN swap_requests.requester_original_shift_type IS 'Original shift type of the requester shift at time of request creation';
COMMENT ON COLUMN swap_requests.target_original_date IS 'Original date of the target shift at time of request creation';
COMMENT ON COLUMN swap_requests.target_original_shift_type IS 'Original shift type of the target shift at time of request creation';
COMMENT ON COLUMN swap_requests.requester_original_shift_type_on_target_date IS 'Original shift type of the requester on the target date at time of request creation';
COMMENT ON COLUMN swap_requests.target_original_shift_type_on_requester_date IS 'Original shift type of the target on the requester date at time of request creation';
