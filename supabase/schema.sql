-- ============================================
-- WFM (Workforce Management) Database Schema
-- Complete schema matching production database state
-- Run this SQL in your Supabase SQL Editor
-- Last Updated: 2026-02-11
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('agent', 'tl', 'wfm');
CREATE TYPE shift_type AS ENUM ('AM', 'PM', 'BET', 'OFF');
CREATE TYPE swap_request_status AS ENUM ('pending_acceptance', 'pending_tl', 'pending_wfm', 'approved', 'rejected');
CREATE TYPE leave_request_status AS ENUM ('pending_tl', 'pending_wfm', 'approved', 'rejected', 'denied');
CREATE TYPE leave_type AS ENUM ('sick', 'annual', 'casual', 'public_holiday', 'bereavement');
CREATE TYPE request_type AS ENUM ('swap', 'leave');

-- ============================================
-- TABLES
-- ============================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'agent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    employee_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    department TEXT,
    hire_date DATE,
    manager_id UUID REFERENCES users(id),
    CONSTRAINT users_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'on_leave'::text, 'terminated'::text, 'suspended'::text]))
);

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    parent_department_id UUID REFERENCES departments(id),
    head_id UUID REFERENCES users(id),
    cost_center TEXT,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Headcount profiles table
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT headcount_profiles_employment_type_check CHECK (employment_type = ANY (ARRAY['full_time'::text, 'part_time'::text, 'contractor'::text, 'intern'::text])),
    CONSTRAINT headcount_profiles_job_level_check CHECK (job_level = ANY (ARRAY['intern'::text, 'junior'::text, 'mid'::text, 'senior'::text, 'lead'::text, 'manager'::text, 'director'::text])),
    CONSTRAINT headcount_profiles_onboarding_status_check CHECK (onboarding_status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'n/a'::text]))
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
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT headcount_audit_log_action_check CHECK (action = ANY (ARRAY['hired'::text, 'terminated'::text, 'transferred'::text, 'promoted'::text, 'role_changed'::text, 'status_changed'::text, 'leave_started'::text, 'leave_ended'::text, 'manager_changed'::text, 'department_changed'::text, 'profile_updated'::text]))
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
    requester_original_date DATE,
    requester_original_shift_type shift_type,
    target_original_date DATE,
    target_original_shift_type shift_type,
    requester_original_shift_type_on_target_date shift_type,
    target_original_shift_type_on_requester_date shift_type,
    CONSTRAINT different_users CHECK (requester_id <> target_user_id)
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
    notes TEXT,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Leave balances table
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    balance NUMERIC(5,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, leave_type)
);

-- Leave balance history table
CREATE TABLE leave_balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    previous_balance NUMERIC(10,2) NOT NULL,
    new_balance NUMERIC(10,2) NOT NULL,
    change_reason TEXT,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave types table
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    color TEXT NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    label TEXT,
    code leave_type NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type request_type NOT NULL,
    request_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_system BOOLEAN DEFAULT FALSE
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

CREATE INDEX idx_comments_request ON comments(request_type, request_id);
CREATE INDEX idx_comments_request_composite ON comments(request_id, request_type);
CREATE INDEX idx_audit_log_action ON headcount_audit_log(action);
CREATE INDEX idx_audit_log_date ON headcount_audit_log(performed_at);
CREATE INDEX idx_audit_log_user ON headcount_audit_log(user_id);
CREATE INDEX idx_headcount_profiles_job_title ON headcount_profiles(job_title);
CREATE INDEX idx_headcount_profiles_level ON headcount_profiles(job_level);
CREATE INDEX idx_headcount_profiles_location ON headcount_profiles(location);
CREATE INDEX idx_leave_balances_user ON leave_balances(user_id);
CREATE INDEX idx_leave_balances_user_type ON leave_balances(user_id, leave_type);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_status_created ON leave_requests(status, created_at DESC);
CREATE INDEX idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_user_status ON leave_requests(user_id, status);
CREATE INDEX idx_leave_types_active ON leave_types(is_active);
CREATE INDEX idx_leave_types_code ON leave_types(code);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_user_date_composite ON shifts(user_id, date);
CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_swap_requests_requester ON swap_requests(requester_id);
CREATE INDEX idx_swap_requests_requester_created ON swap_requests(requester_id, created_at DESC);
CREATE INDEX idx_swap_requests_status ON swap_requests(status);
CREATE INDEX idx_swap_requests_status_created ON swap_requests(status, created_at DESC);
CREATE INDEX idx_swap_requests_target ON swap_requests(target_user_id);
CREATE INDEX idx_swap_requests_target_created ON swap_requests(target_user_id, created_at DESC);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_hire_date ON users(hire_date);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_users_status ON users(status);

-- ============================================
-- VIEWS
-- ============================================

CREATE VIEW v_department_summary
WITH (security_invoker = true)
AS
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

CREATE VIEW v_headcount_active
WITH (security_invoker = true)
AS
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
LEFT JOIN users m ON u.manager_id = m.id
WHERE u.status IN ('active', 'on_leave');

CREATE VIEW v_management_chain
WITH (security_invoker = true)
AS
WITH RECURSIVE management_tree AS (
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
    JOIN management_tree mt ON u.manager_id = mt.id
)
SELECT * FROM management_tree;

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT role FROM users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'agent'::user_role
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION initialize_leave_balances()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    -- Initialize leave balances for all active leave types
    -- Default balance is 0, can be updated by WFM later
    INSERT INTO leave_balances (user_id, leave_type, balance)
    SELECT NEW.id, lt.code, 0
    FROM leave_types lt
    WHERE lt.is_active = true
    ON CONFLICT (user_id, leave_type) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION create_headcount_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.headcount_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_user_role_to_app_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    action_type TEXT;
    old_vals JSONB;
    new_vals JSONB;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        action_type := 'status_changed';
    ELSIF OLD.department IS DISTINCT FROM NEW.department THEN
        action_type := 'department_changed';
    ELSIF OLD.role IS DISTINCT FROM NEW.role THEN
        action_type := 'promoted';
    ELSIF OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN
        action_type := 'manager_changed';
    ELSE
        action_type := 'profile_updated';
    END IF;

    old_vals := jsonb_build_object(
        'status', OLD.status,
        'department', OLD.department,
        'role', OLD.role,
        'manager_id', OLD.manager_id
    );
    
    new_vals := jsonb_build_object(
        'status', NEW.status,
        'department', NEW.department,
        'role', NEW.role,
        'manager_id', NEW.manager_id
    );

    IF old_vals IS DISTINCT FROM new_vals THEN
        INSERT INTO public.headcount_audit_log (
            user_id, action, previous_values, new_values, performed_by, effective_date
        ) VALUES (
            NEW.id,
            action_type,
            old_vals,
            new_vals,
            COALESCE(current_setting('app.current_user_id', true)::uuid, NEW.id),
            CURRENT_DATE
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION deduct_leave_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    days_requested INTEGER;
BEGIN
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
$$;

CREATE OR REPLACE FUNCTION execute_shift_swap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    requester_shift_type shift_type;
    target_shift_type shift_type;
    requester_date DATE;
    target_date DATE;
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        SELECT shift_type, date INTO requester_shift_type, requester_date
        FROM shifts WHERE id = NEW.requester_shift_id;
        
        SELECT shift_type, date INTO target_shift_type, target_date
        FROM shifts WHERE id = NEW.target_shift_id;
        
        UPDATE shifts SET shift_type = target_shift_type WHERE id = NEW.requester_shift_id;
        UPDATE shifts SET shift_type = requester_shift_type WHERE id = NEW.target_shift_id;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION check_email_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NOT public.is_allowed_email_domain(NEW.email) THEN
        RAISE EXCEPTION 'Only % email addresses are allowed', public.get_allowed_email_domain()
            USING HINT = 'Please use your company email address';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION accrue_leave_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.leave_balances
    SET balance = balance + 1.25
    WHERE leave_type = 'annual';

    UPDATE public.leave_balances
    SET balance = balance + 0.5
    WHERE leave_type = 'casual';
END;
$$;

CREATE OR REPLACE FUNCTION accrue_monthly_leave_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE leave_balances
    SET balance = balance + 1.25, updated_at = NOW()
    WHERE leave_type = 'annual';
    
    UPDATE leave_balances
    SET balance = balance + 0.5, updated_at = NOW()
    WHERE leave_type = 'casual';
END;
$$;

CREATE OR REPLACE FUNCTION get_direct_reports(manager_uuid UUID)
RETURNS TABLE(id UUID, name TEXT, email TEXT, role user_role, department TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u.role, u.department, u.status
    FROM public.users u
    WHERE u.manager_id = manager_uuid
    AND u.status IN ('active', 'on_leave')
    ORDER BY u.name;
END;
$$;

CREATE OR REPLACE FUNCTION get_headcount_metrics()
RETURNS TABLE(metric_name TEXT, metric_value BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 'total_active'::TEXT, COUNT(*)::BIGINT
    FROM public.users WHERE status = 'active'
    
    UNION ALL
    
    SELECT 'total_on_leave'::TEXT, COUNT(*)::BIGINT
    FROM public.users WHERE status = 'on_leave'
    
    UNION ALL
    
    SELECT 'total_fte'::TEXT, COALESCE(SUM(fte_percentage), 0)::BIGINT
    FROM public.users WHERE status IN ('active', 'on_leave');
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auth trigger: Create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- User trigger: Create headcount profile when user is created
CREATE TRIGGER on_user_headcount_created
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_headcount_profile();

CREATE TRIGGER update_headcount_profiles_updated_at
    BEFORE UPDATE ON headcount_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_leave_approved
    AFTER UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION deduct_leave_balance();

CREATE TRIGGER on_swap_approved
    AFTER UPDATE ON swap_requests
    FOR EACH ROW
    EXECUTE FUNCTION execute_shift_swap();

CREATE TRIGGER on_user_created
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_leave_balances();

CREATE TRIGGER sync_role_to_app_metadata
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_role_to_app_metadata();

CREATE TRIGGER trg_audit_user_changes
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_changes();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE headcount_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE headcount_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - USERS
-- ============================================

CREATE POLICY "Users can view all users"
    ON users FOR SELECT TO public
    USING (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "Allow view active users"
    ON users FOR SELECT TO authenticated
    USING (status = ANY (ARRAY['active', 'on_leave']));

CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT TO public
    WITH CHECK ((auth.uid() = id) AND (public.is_allowed_email_domain(auth.jwt() ->> 'email')));

CREATE POLICY "Service role can insert users"
    ON users FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY "WFM and users can update"
    ON users FOR UPDATE TO authenticated
    USING ((get_user_role(auth.uid()) = 'wfm') OR (auth.uid() = id))
    WITH CHECK ((get_user_role(auth.uid()) = 'wfm') OR (auth.uid() = id));

-- ============================================
-- RLS POLICIES - DEPARTMENTS
-- ============================================

CREATE POLICY "All view departments"
    ON departments FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "WFM edit departments"
    ON departments FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'wfm'));

-- ============================================
-- RLS POLICIES - HEADCOUNT PROFILES
-- ============================================

CREATE POLICY "Users view own profile"
    ON headcount_profiles FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "TL view department profiles"
    ON headcount_profiles FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'tl' 
        AND users.department = (SELECT department FROM users WHERE id = headcount_profiles.user_id)
    ));

CREATE POLICY "WFM full access profiles"
    ON headcount_profiles FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'wfm'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'wfm'));

-- ============================================
-- RLS POLICIES - HEADCOUNT AUDIT LOG
-- ============================================

CREATE POLICY "Users view own audit"
    ON headcount_audit_log FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "WFM view all audit"
    ON headcount_audit_log FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'wfm'));

CREATE POLICY "WFM can insert audit logs"
    ON headcount_audit_log FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'wfm'));

-- ============================================
-- RLS POLICIES - SHIFTS
-- ============================================

CREATE POLICY "Users can view shifts"
    ON shifts FOR SELECT TO public
    USING (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "Users can view all shifts"
    ON shifts FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can insert shifts"
    ON shifts FOR INSERT TO public
    WITH CHECK (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "Users can insert own shifts"
    ON shifts FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update shifts"
    ON shifts FOR UPDATE TO public
    USING (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "Users can update own shifts"
    ON shifts FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete shifts"
    ON shifts FOR DELETE TO public
    USING (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "WFM can manage all shifts"
    ON shifts FOR ALL TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm')
    WITH CHECK (get_user_role(auth.uid()) = 'wfm');

-- ============================================
-- RLS POLICIES - SWAP REQUESTS
-- ============================================

CREATE POLICY "Users can view swap requests"
    ON swap_requests FOR SELECT TO public
    USING (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "Users can view own swap requests"
    ON swap_requests FOR SELECT TO authenticated
    USING (
        auth.uid() = requester_id OR 
        auth.uid() = target_user_id OR
        get_user_role(auth.uid()) = ANY (ARRAY['tl', 'wfm'])
    );

CREATE POLICY "Users can create swap requests"
    ON swap_requests FOR INSERT TO public
    WITH CHECK (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "Users can update own swap requests"
    ON swap_requests FOR UPDATE TO public
    USING ((requester_id = auth.uid()) AND (public.is_allowed_email_domain(auth.jwt() ->> 'email')));

CREATE POLICY "Users can update swap requests they're involved in"
    ON swap_requests FOR UPDATE TO public
    USING (
        (auth.uid() = requester_id) OR 
        (auth.uid() = target_user_id) OR 
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ANY (ARRAY['wfm', 'tl'])))
    );

CREATE POLICY "Target can accept swap request"
    ON swap_requests FOR UPDATE TO authenticated
    USING ((auth.uid() = target_user_id) AND (status = 'pending_acceptance'));

CREATE POLICY "TL can approve swap request"
    ON swap_requests FOR UPDATE TO authenticated
    USING ((get_user_role(auth.uid()) = ANY (ARRAY['tl', 'wfm'])) AND (status = 'pending_tl'));

CREATE POLICY "WFM can approve swap request"
    ON swap_requests FOR UPDATE TO authenticated
    USING ((get_user_role(auth.uid()) = 'wfm') AND (status = 'pending_wfm'));

CREATE POLICY "Users can delete own swap requests"
    ON swap_requests FOR DELETE TO public
    USING ((requester_id = auth.uid()) AND (public.is_allowed_email_domain(auth.jwt() ->> 'email')));

CREATE POLICY "Requester can cancel swap request"
    ON swap_requests FOR DELETE TO authenticated
    USING ((auth.uid() = requester_id) AND (status = 'pending_acceptance'));

-- ============================================
-- RLS POLICIES - LEAVE REQUESTS
-- ============================================

CREATE POLICY "Users can view leave requests"
    ON leave_requests FOR SELECT TO public
    USING (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "Users can create leave requests"
    ON leave_requests FOR INSERT TO public
    WITH CHECK (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "Users can insert leave requests"
    ON leave_requests FOR INSERT TO authenticated
    WITH CHECK (
        (auth.uid() = user_id) OR 
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ANY (ARRAY['tl', 'wfm'])))
    );

CREATE POLICY "Users can update own leave requests"
    ON leave_requests FOR UPDATE TO public
    USING ((user_id = auth.uid()) AND (public.is_allowed_email_domain(auth.jwt() ->> 'email')));

CREATE POLICY "Users can update leave requests"
    ON leave_requests FOR UPDATE TO authenticated
    USING (
        ((auth.uid() = user_id) AND (status <> 'approved')) OR 
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ANY (ARRAY['tl', 'wfm'])))
    )
    WITH CHECK (
        ((auth.uid() = user_id) AND (status <> 'approved')) OR 
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ANY (ARRAY['tl', 'wfm'])))
    );

CREATE POLICY "TL can approve leave requests"
    ON leave_requests FOR UPDATE TO authenticated
    USING ((get_user_role(auth.uid()) = ANY (ARRAY['tl', 'wfm'])) AND (status = 'pending_tl'));

CREATE POLICY "WFM can approve leave requests"
    ON leave_requests FOR UPDATE TO authenticated
    USING ((get_user_role(auth.uid()) = 'wfm') AND (status = 'pending_wfm'));

CREATE POLICY "TL/WFM can modify approved leaves"
    ON leave_requests FOR UPDATE TO public
    USING (
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ANY (ARRAY['wfm', 'tl']))) AND 
        (status = 'approved')
    );

CREATE POLICY "Users can delete own leave requests"
    ON leave_requests FOR DELETE TO public
    USING ((user_id = auth.uid()) AND (public.is_allowed_email_domain(auth.jwt() ->> 'email')));

CREATE POLICY "Users can cancel pending leave requests"
    ON leave_requests FOR DELETE TO authenticated
    USING ((auth.uid() = user_id) AND (status = 'pending_tl'));

CREATE POLICY "Users can delete leave requests"
    ON leave_requests FOR DELETE TO authenticated
    USING (
        ((auth.uid() = user_id) AND (status <> 'approved')) OR 
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ANY (ARRAY['tl', 'wfm'])))
    );

CREATE POLICY "TL/WFM can delete leave requests"
    ON leave_requests FOR DELETE TO public
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ANY (ARRAY['wfm', 'tl'])));

-- ============================================
-- RLS POLICIES - LEAVE BALANCES
-- ============================================

CREATE POLICY "Users can insert own leave balances"
    ON leave_balances FOR INSERT TO public
    WITH CHECK ((user_id = auth.uid()) AND (public.is_allowed_email_domain(auth.jwt() ->> 'email')));

CREATE POLICY "Users can update own leave balances"
    ON leave_balances FOR UPDATE TO public
    USING ((user_id = auth.uid()) AND (public.is_allowed_email_domain(auth.jwt() ->> 'email')));

CREATE POLICY "Users and TL can view leave balances"
    ON leave_balances FOR SELECT TO authenticated
    USING (
        (user_id = auth.uid()) OR 
        (EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'tl' 
            AND (SELECT role FROM users WHERE id = leave_balances.user_id) = 'agent'
        ))
    );

CREATE POLICY "WFM can manage leave balances"
    ON leave_balances FOR ALL TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm');

-- ============================================
-- RLS POLICIES - LEAVE BALANCE HISTORY
-- ============================================

CREATE POLICY "Users can view own leave balance history"
    ON leave_balance_history FOR SELECT TO public
    USING ((user_id = auth.uid()) AND (public.is_allowed_email_domain(auth.jwt() ->> 'email')));

CREATE POLICY "Users can view own balance history"
    ON leave_balance_history FOR SELECT TO authenticated
    USING (
        (user_id = auth.uid()) OR 
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ANY (ARRAY['tl', 'wfm'])))
    );

CREATE POLICY "System can insert leave balance history"
    ON leave_balance_history FOR INSERT TO public
    WITH CHECK (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "WFM can insert balance history"
    ON leave_balance_history FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'wfm'));

CREATE POLICY "WFM can view all history"
    ON leave_balance_history FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'wfm'));

-- ============================================
-- RLS POLICIES - COMMENTS
-- ============================================

CREATE POLICY "Users can view comments"
    ON comments FOR SELECT TO public
    USING (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "Users can view comments on their requests"
    ON comments FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can view related comments"
    ON comments FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "WFM can view all comments for audit"
    ON comments FOR SELECT TO authenticated
    USING (((auth.jwt() -> 'app_metadata') ->> 'role') = 'wfm');

CREATE POLICY "Users can create comments"
    ON comments FOR INSERT TO public
    WITH CHECK ((user_id = auth.uid()) AND (public.is_allowed_email_domain(auth.jwt() ->> 'email')));

CREATE POLICY "Users can add comments"
    ON comments FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own non-system comments"
    ON comments FOR UPDATE TO public
    USING ((user_id = auth.uid()) AND (public.is_allowed_email_domain(auth.jwt() ->> 'email')) AND (is_system = false));

CREATE POLICY "Users can delete own non-system comments"
    ON comments FOR DELETE TO public
    USING ((user_id = auth.uid()) AND (public.is_allowed_email_domain(auth.jwt() ->> 'email')) AND (is_system = false));

-- ============================================
-- RLS POLICIES - SETTINGS
-- ============================================

CREATE POLICY "Users can view settings"
    ON settings FOR SELECT TO public
    USING (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "Anyone can read settings"
    ON settings FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Everyone can read settings"
    ON settings FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage settings"
    ON settings FOR ALL TO public
    USING (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "WFM can update settings"
    ON settings FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'wfm'));

CREATE POLICY "WFM can manage settings"
    ON settings FOR ALL TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm');

-- ============================================
-- RLS POLICIES - LEAVE TYPES
-- ============================================

CREATE POLICY "Users can view leave types"
    ON leave_types FOR SELECT TO public
    USING (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can manage leave types"
    ON leave_types FOR ALL TO public
    USING (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "Allow WFM to manage leave_types"
    ON leave_types FOR ALL TO public
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'wfm'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'wfm'));

-- ============================================
-- INITIAL DATA
-- ============================================

INSERT INTO settings (key, value) VALUES
    ('wfm_auto_approve', 'false'),
    ('allow_leave_exceptions', 'true')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'User profiles with role-based access control and headcount fields';
COMMENT ON TABLE departments IS 'Department hierarchy and structure';
COMMENT ON TABLE headcount_profiles IS 'Extended employee information and profiles';
COMMENT ON TABLE headcount_audit_log IS 'Audit trail for headcount changes';
COMMENT ON TABLE shifts IS 'Daily shift assignments for users';
COMMENT ON TABLE swap_requests IS 'Shift swap requests with multi-level approval workflow';
COMMENT ON TABLE leave_requests IS 'Leave/time-off requests with approval workflow';
COMMENT ON TABLE leave_balances IS 'Per-user leave entitlement balances by type';
COMMENT ON TABLE leave_balance_history IS 'Audit trail for leave balance changes';
COMMENT ON TABLE leave_types IS 'Configurable leave type definitions';
COMMENT ON TABLE comments IS 'Comments and discussions on swap/leave requests';
COMMENT ON TABLE settings IS 'Application-wide WFM configuration';

COMMENT ON COLUMN swap_requests.requester_original_date IS 'Original date of the requester shift at time of request creation';
COMMENT ON COLUMN swap_requests.requester_original_shift_type IS 'Original shift type of the requester at time of request creation';
COMMENT ON COLUMN swap_requests.target_original_date IS 'Original date of the target shift at time of request creation';
COMMENT ON COLUMN swap_requests.target_original_shift_type IS 'Original shift type of the target at time of request creation';
COMMENT ON COLUMN headcount_profiles.employment_type IS 'Employment classification: full_time, part_time, contractor, intern';
COMMENT ON COLUMN headcount_profiles.job_level IS 'Career level: intern, junior, mid, senior, lead, manager, director';
COMMENT ON COLUMN headcount_profiles.onboarding_status IS 'Onboarding progress: pending, in_progress, completed, n/a';
COMMENT ON COLUMN users.status IS 'User status: active, inactive, on_leave, terminated, suspended';

-- ============================================
-- END OF SCHEMA
-- ============================================


-- ============================================
-- FLATTENED MIGRATIONS SNAPSHOT
-- This section replaces supabase/migrations/*.sql history
-- ============================================
-- >>> BEGIN FLATTENED MIGRATIONS SNAPSHOT

-- --------------------------------------------
-- MIGRATION: 015_break_schedules.sql
-- --------------------------------------------
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

-- --------------------------------------------
-- MIGRATION: 020_make_maximum_gap_blocking.sql
-- --------------------------------------------
-- Make maximum_gap rule blocking
-- This ensures that breaks cannot be scheduled with gaps exceeding the maximum allowed time

UPDATE break_schedule_rules
SET is_blocking = true
WHERE rule_name = 'maximum_gap';

-- --------------------------------------------
-- MIGRATION: 020_shift_configurations.sql
-- --------------------------------------------
-- Shift Configurations Table
-- Stores configurable shift times for break schedule management

CREATE TABLE IF NOT EXISTS shift_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_code TEXT NOT NULL UNIQUE,
  shift_label TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE shift_configurations ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read shift configurations
CREATE POLICY "Anyone can view shift configurations"
  ON shift_configurations
  FOR SELECT
  TO authenticated
  USING (true);

-- Only WFM can insert/update/delete shift configurations
CREATE POLICY "WFM can manage shift configurations"
  ON shift_configurations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'wfm'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'wfm'
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_shift_configurations_active ON shift_configurations(is_active);
CREATE INDEX idx_shift_configurations_code ON shift_configurations(shift_code);

-- Insert default shift configurations
INSERT INTO shift_configurations (shift_code, shift_label, start_time, end_time, display_order, description) VALUES
  ('AM', 'Morning Shift', '09:00:00', '17:00:00', 1, 'Standard morning shift from 9 AM to 5 PM'),
  ('PM', 'Evening Shift', '13:00:00', '21:00:00', 2, 'Evening shift from 1 PM to 9 PM'),
  ('BET', 'Between Shift', '11:00:00', '19:00:00', 3, 'Mid-day shift from 11 AM to 7 PM'),
  ('OFF', 'Off Day', '00:00:00', '00:00:00', 4, 'Day off - no shift hours')
ON CONFLICT (shift_code) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_shift_configurations_updated_at
  BEFORE UPDATE ON shift_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE shift_configurations IS 'Configurable shift times for break schedule management';

-- --------------------------------------------
-- MIGRATION: 021_fix_auth_trigger.sql
-- --------------------------------------------
-- Fix missing auth.users trigger for handle_new_user function
-- This trigger should fire when a new user signs up via Supabase Auth

-- Drop the trigger if it exists (in case it was partially created)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users to call handle_new_user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also ensure the headcount profile trigger exists
DROP TRIGGER IF EXISTS on_user_headcount_created ON public.users;

CREATE TRIGGER on_user_headcount_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_headcount_profile();

-- Fix the initialize_leave_balances function to use correct column names
CREATE OR REPLACE FUNCTION initialize_leave_balances()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    -- Initialize leave balances for all active leave types
    -- Default balance is 0, can be updated by WFM later
    INSERT INTO leave_balances (user_id, leave_type, balance)
    SELECT NEW.id, lt.code, 0
    FROM leave_types lt
    WHERE lt.is_active = true
    ON CONFLICT (user_id, leave_type) DO NOTHING;
    RETURN NEW;
END;
$$;

-- --------------------------------------------
-- MIGRATION: 022_verify_and_fix_signup.sql
-- --------------------------------------------
-- Verify and fix signup issues
-- This migration checks and fixes all components needed for user signup

-- First, let's check if the trigger exists and recreate it
DO $$
BEGIN
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS on_user_headcount_created ON public.users;
    
    RAISE NOTICE 'Triggers dropped successfully';
END $$;

-- Recreate handle_new_user function with better error handling and RLS bypass
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Insert into public.users table
    -- Using SECURITY DEFINER allows bypassing RLS
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'agent'::user_role
    );
    
    RAISE NOTICE 'User created: %', NEW.email;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RAISE; -- Re-raise the error so signup fails with proper error message
END;
$$;

-- Grant execute permission to service_role (used by auth triggers)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Recreate initialize_leave_balances with better error handling
CREATE OR REPLACE FUNCTION public.initialize_leave_balances()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    -- Initialize leave balances for all active leave types
    INSERT INTO leave_balances (user_id, leave_type, balance)
    SELECT NEW.id, lt.code, 0
    FROM leave_types lt
    WHERE lt.is_active = true
    ON CONFLICT (user_id, leave_type) DO NOTHING;
    
    RAISE NOTICE 'Leave balances initialized for user: %', NEW.id;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in initialize_leave_balances: %', SQLERRM;
        RETURN NEW; -- Don't block user creation even if this fails
END;
$$;

-- Recreate create_headcount_profile with better error handling
CREATE OR REPLACE FUNCTION public.create_headcount_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.headcount_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Headcount profile created for user: %', NEW.id;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in create_headcount_profile: %', SQLERRM;
        RETURN NEW; -- Don't block user creation even if this fails
END;
$$;

-- Now create the triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_user_headcount_created
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_headcount_profile();

-- Verify the triggers were created
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created';
    
    IF trigger_count > 0 THEN
        RAISE NOTICE 'on_auth_user_created trigger created successfully';
    ELSE
        RAISE WARNING 'on_auth_user_created trigger was NOT created';
    END IF;
    
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'on_user_headcount_created';
    
    IF trigger_count > 0 THEN
        RAISE NOTICE 'on_user_headcount_created trigger created successfully';
    ELSE
        RAISE WARNING 'on_user_headcount_created trigger was NOT created';
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Add RLS policy to allow service_role to insert users (for auth triggers)
-- This is needed because the trigger runs as service_role
DO $$
BEGIN
    -- Drop the policy if it exists
    DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
    
    -- Create policy for service_role to insert users
    CREATE POLICY "Service role can insert users"
        ON public.users
        FOR INSERT
        TO service_role
        WITH CHECK (true);
    
    RAISE NOTICE 'Service role insert policy created';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating service role policy: %', SQLERRM;
END $$;

-- --------------------------------------------
-- MIGRATION: 023_fix_leave_types_and_signup.sql
-- --------------------------------------------
-- Fix leave types and signup process
-- Ensure default leave types exist and signup works properly

-- First, ensure we have some default leave types
INSERT INTO leave_types (code, label, description, color, display_order, is_active)
VALUES 
    ('annual', 'Annual Leave', 'Regular annual leave', '#3B82F6', 1, true),
    ('sick', 'Sick Leave', 'Medical leave', '#EF4444', 2, true),
    ('emergency', 'Emergency Leave', 'Emergency situations', '#F59E0B', 3, true)
ON CONFLICT (code) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    display_order = EXCLUDED.display_order;

-- Update the initialize_leave_balances function to be more robust
CREATE OR REPLACE FUNCTION public.initialize_leave_balances()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    leave_type_count INTEGER;
BEGIN
    -- Check if there are any active leave types
    SELECT COUNT(*) INTO leave_type_count
    FROM leave_types
    WHERE is_active = true;
    
    -- Only initialize if there are active leave types
    IF leave_type_count > 0 THEN
        INSERT INTO leave_balances (user_id, leave_type, balance)
        SELECT NEW.id, lt.code, 0
        FROM leave_types lt
        WHERE lt.is_active = true
        ON CONFLICT (user_id, leave_type) DO NOTHING;
        
        RAISE NOTICE 'Initialized % leave balance(s) for user: %', leave_type_count, NEW.id;
    ELSE
        RAISE NOTICE 'No active leave types found, skipping leave balance initialization for user: %', NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't block user creation
        RAISE WARNING 'Error in initialize_leave_balances for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Update the create_headcount_profile function to be more robust
CREATE OR REPLACE FUNCTION public.create_headcount_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.headcount_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Headcount profile created for user: %', NEW.id;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't block user creation
        RAISE WARNING 'Error in create_headcount_profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Update handle_new_user to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Insert into public.users table
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'agent'::user_role
    );
    
    RAISE NOTICE 'User created successfully: % (id: %)', NEW.email, NEW.id;
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- User already exists, this is okay
        RAISE NOTICE 'User already exists: %', NEW.email;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log detailed error information
        RAISE WARNING 'Error in handle_new_user for email %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
        -- Re-raise to prevent signup from completing with partial data
        RAISE;
END;
$$;

-- Verify the setup
DO $$
DECLARE
    leave_type_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Check leave types
    SELECT COUNT(*) INTO leave_type_count
    FROM leave_types
    WHERE is_active = true;
    
    RAISE NOTICE 'Active leave types: %', leave_type_count;
    
    -- Check triggers
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created';
    
    IF trigger_count > 0 THEN
        RAISE NOTICE 'Auth trigger exists: on_auth_user_created';
    ELSE
        RAISE WARNING 'Auth trigger MISSING: on_auth_user_created';
    END IF;
    
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'on_user_created';
    
    IF trigger_count > 0 THEN
        RAISE NOTICE 'User trigger exists: on_user_created';
    ELSE
        RAISE WARNING 'User trigger MISSING: on_user_created';
    END IF;
    
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'on_user_headcount_created';
    
    IF trigger_count > 0 THEN
        RAISE NOTICE 'Headcount trigger exists: on_user_headcount_created';
    ELSE
        RAISE WARNING 'Headcount trigger MISSING: on_user_headcount_created';
    END IF;
END $$;

-- --------------------------------------------
-- MIGRATION: 024_overtime_management.sql
-- --------------------------------------------
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

-- --------------------------------------------
-- MIGRATION: 025_employee_skills_management.sql
-- --------------------------------------------
-- ============================================
-- EMPLOYEE SKILLS MANAGEMENT SYSTEM
-- Migration: 025_employee_skills_management.sql
-- Description: Creates tables, indexes, and view updates for the employee skills management system
-- ============================================

-- ============================================
-- TABLES
-- ============================================

-- Skills catalog table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) NOT NULL, -- Hex color code (e.g., #FF5733)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User skills junction table (many-to-many relationship)
CREATE TABLE user_skills (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Indexes for skills table
CREATE INDEX idx_skills_active ON skills(is_active);
CREATE INDEX idx_skills_name ON skills(name);

-- Indexes for user_skills table (for performance optimization)
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp on skills table
CREATE OR REPLACE FUNCTION update_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_skills_updated_at();

-- ============================================
-- VIEW UPDATES
-- ============================================

-- Update v_headcount_active view to include skills as JSON array
CREATE OR REPLACE VIEW v_headcount_active
WITH (security_invoker = true)
AS
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
    m.email AS manager_email,
    COALESCE(
      json_agg(
        json_build_object(
          'id', s.id,
          'name', s.name,
          'description', s.description,
          'color', s.color,
          'is_active', s.is_active
        ) ORDER BY s.name
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'::json
    ) as assigned_skills
FROM users u
LEFT JOIN headcount_profiles hp ON u.id = hp.user_id
LEFT JOIN users m ON u.manager_id = m.id
LEFT JOIN user_skills us ON u.id = us.user_id
LEFT JOIN skills s ON us.skill_id = s.id
WHERE u.status IN ('active', 'on_leave')
GROUP BY u.id, hp.user_id, m.id;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on skills table
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active skills
CREATE POLICY "All users can view skills"
  ON skills FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only WFM users can create skills
CREATE POLICY "WFM can create skills"
  ON skills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- Only WFM users can update skills
CREATE POLICY "WFM can update skills"
  ON skills FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- Only WFM users can delete skills
CREATE POLICY "WFM can delete skills"
  ON skills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- Enable RLS on user_skills table
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view user skills
CREATE POLICY "All users can view user skills"
  ON user_skills FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only WFM users can assign skills to users
CREATE POLICY "WFM can assign skills"
  ON user_skills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- Only WFM users can remove skill assignments
CREATE POLICY "WFM can remove skills"
  ON user_skills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE skills IS 'Catalog of skills that can be assigned to employees';
COMMENT ON TABLE user_skills IS 'Junction table linking users to their assigned skills';
COMMENT ON COLUMN skills.name IS 'Unique skill name (case-insensitive uniqueness enforced)';
COMMENT ON COLUMN skills.color IS 'Hex color code for visual identification (e.g., #FF5733)';
COMMENT ON COLUMN skills.is_active IS 'Active skills appear in assignment and filter dropdowns';

-- --------------------------------------------
-- MIGRATION: 20260212_fix_wfm_bulk_upload_permissions.sql
-- --------------------------------------------
-- Fix WFM bulk upload permissions for shifts table
-- Add WITH CHECK clause to allow WFM to insert shifts for any user

DROP POLICY IF EXISTS "WFM can manage all shifts" ON shifts;

CREATE POLICY "WFM can manage all shifts"
    ON shifts FOR ALL TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm')
    WITH CHECK (get_user_role(auth.uid()) = 'wfm');

-- --------------------------------------------
-- MIGRATION: 20260217_phase1_domain_policy_alignment.sql
-- --------------------------------------------
-- Phase 1: Align domain access policy with configurable settings
-- - Adds allowed_email_domain setting (if missing)
-- - Normalizes and centralizes domain checks in helper functions
-- - Enforces domain on users.email writes
-- - Updates core users policies to use the helper

INSERT INTO public.settings (key, value)
VALUES ('allowed_email_domain', '@dabdoob.com')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.normalize_email_domain(domain_input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN domain_input IS NULL OR btrim(domain_input) = '' THEN ''
    WHEN left(lower(btrim(domain_input)), 1) = '@' THEN lower(btrim(domain_input))
    ELSE '@' || lower(btrim(domain_input))
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_allowed_email_domain()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  configured_domain TEXT;
BEGIN
  SELECT value
  INTO configured_domain
  FROM public.settings
  WHERE key = 'allowed_email_domain'
  LIMIT 1;

  IF configured_domain IS NULL OR btrim(configured_domain) = '' THEN
    RETURN '@dabdoob.com';
  END IF;

  RETURN public.normalize_email_domain(configured_domain);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_allowed_email_domain(email_input TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN email_input IS NULL OR btrim(email_input) = '' THEN false
    ELSE lower(btrim(email_input)) LIKE '%' || public.get_allowed_email_domain()
  END;
$$;

CREATE OR REPLACE FUNCTION public.check_email_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_allowed_email_domain(NEW.email) THEN
    RAISE EXCEPTION 'Only % email addresses are allowed', public.get_allowed_email_domain()
      USING HINT = 'Please use your company email address';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_email_domain_on_users ON public.users;

CREATE TRIGGER enforce_email_domain_on_users
  BEFORE INSERT OR UPDATE OF email ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_email_domain();

DROP POLICY IF EXISTS "Users can view all users" ON public.users;

CREATE POLICY "Users can view all users"
  ON public.users
  FOR SELECT
  TO public
  USING (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO public
  WITH CHECK (
    (auth.uid() = id)
    AND public.is_allowed_email_domain(auth.jwt() ->> 'email')
  );

-- --------------------------------------------
-- MIGRATION: 20260217_phase2_domain_policy_hardening.sql
-- --------------------------------------------
-- Phase 2: Harden domain policy enforcement and settings governance
-- - Validates and normalizes allowed_email_domain writes
-- - Uses strict suffix checks for email-domain matching
-- - Enforces domain at auth.users boundary
-- - Tightens settings/users RLS policies to avoid policy bypass

INSERT INTO public.settings (key, value)
VALUES ('allowed_email_domain', '@dabdoob.com')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_valid_email_domain(domain_input TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.normalize_email_domain(domain_input)
    ~ '^@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$';
$$;

CREATE OR REPLACE FUNCTION public.get_allowed_email_domain()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  configured_domain TEXT;
BEGIN
  SELECT value
  INTO configured_domain
  FROM public.settings
  WHERE key = 'allowed_email_domain'
  LIMIT 1;

  IF configured_domain IS NULL OR btrim(configured_domain) = '' THEN
    RETURN '@dabdoob.com';
  END IF;

  configured_domain := public.normalize_email_domain(configured_domain);

  IF NOT public.is_valid_email_domain(configured_domain) THEN
    RETURN '@dabdoob.com';
  END IF;

  RETURN configured_domain;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_allowed_email_domain(email_input TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN email_input IS NULL OR btrim(email_input) = '' THEN false
    WHEN char_length(public.get_allowed_email_domain()) = 0 THEN false
    ELSE right(lower(btrim(email_input)), char_length(public.get_allowed_email_domain()))
      = public.get_allowed_email_domain()
  END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_allowed_email_domain_setting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.key = 'allowed_email_domain' THEN
    NEW.value := public.normalize_email_domain(NEW.value);

    IF NOT public.is_valid_email_domain(NEW.value) THEN
      RAISE EXCEPTION 'Invalid allowed_email_domain value: %', NEW.value
        USING HINT = 'Use a valid domain such as @example.com';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_allowed_email_domain_setting ON public.settings;

CREATE TRIGGER enforce_allowed_email_domain_setting
  BEFORE INSERT OR UPDATE OF key, value ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_allowed_email_domain_setting();

UPDATE public.settings
SET value = public.normalize_email_domain(value)
WHERE key = 'allowed_email_domain';

UPDATE public.settings
SET value = '@dabdoob.com'
WHERE key = 'allowed_email_domain'
  AND NOT public.is_valid_email_domain(value);

CREATE OR REPLACE FUNCTION public.check_auth_user_email_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR NOT public.is_allowed_email_domain(NEW.email) THEN
    RAISE EXCEPTION 'Only % email addresses are allowed', public.get_allowed_email_domain()
      USING HINT = 'Please use your company email address';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_email_domain_on_auth_users ON auth.users;

CREATE TRIGGER enforce_email_domain_on_auth_users
  BEFORE INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_auth_user_email_domain();

DROP POLICY IF EXISTS "Users can view settings" ON public.settings;
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;
DROP POLICY IF EXISTS "Everyone can read settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
DROP POLICY IF EXISTS "WFM can update settings" ON public.settings;
DROP POLICY IF EXISTS "WFM can manage settings" ON public.settings;

CREATE POLICY "Allowed-domain users can view settings"
  ON public.settings
  FOR SELECT
  TO authenticated
  USING (public.is_allowed_email_domain(auth.jwt() ->> 'email'));

CREATE POLICY "WFM can insert settings"
  ON public.settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_allowed_email_domain(auth.jwt() ->> 'email')
    AND public.get_user_role(auth.uid()) = 'wfm'
  );

CREATE POLICY "WFM can update settings"
  ON public.settings
  FOR UPDATE
  TO authenticated
  USING (
    public.is_allowed_email_domain(auth.jwt() ->> 'email')
    AND public.get_user_role(auth.uid()) = 'wfm'
  )
  WITH CHECK (
    public.is_allowed_email_domain(auth.jwt() ->> 'email')
    AND public.get_user_role(auth.uid()) = 'wfm'
  );

CREATE POLICY "WFM can delete settings"
  ON public.settings
  FOR DELETE
  TO authenticated
  USING (
    public.is_allowed_email_domain(auth.jwt() ->> 'email')
    AND public.get_user_role(auth.uid()) = 'wfm'
  );

DROP POLICY IF EXISTS "Allow view active users" ON public.users;

CREATE POLICY "Allow view active users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    status = ANY (ARRAY['active', 'on_leave'])
    AND public.is_allowed_email_domain(auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS "WFM and users can update" ON public.users;

CREATE POLICY "WFM and users can update"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    public.is_allowed_email_domain(auth.jwt() ->> 'email')
    AND (
      public.get_user_role(auth.uid()) = 'wfm'
      OR auth.uid() = id
    )
  )
  WITH CHECK (
    public.is_allowed_email_domain(auth.jwt() ->> 'email')
    AND (
      public.get_user_role(auth.uid()) = 'wfm'
      OR auth.uid() = id
    )
  );

-- <<< END FLATTENED MIGRATIONS SNAPSHOT

