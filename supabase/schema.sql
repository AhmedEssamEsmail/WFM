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
    INSERT INTO leave_balances (user_id, leave_type, balance)
    SELECT NEW.id, lt.name, lt.default_balance
    FROM leave_types lt
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
    IF NEW.email NOT LIKE '%@dabdoob.com' THEN
        RAISE EXCEPTION 'Only @dabdoob.com email addresses are allowed'
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
    USING ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

CREATE POLICY "Allow view active users"
    ON users FOR SELECT TO authenticated
    USING (status = ANY (ARRAY['active', 'on_leave']));

CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT TO public
    WITH CHECK ((auth.uid() = id) AND ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com'));

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
    USING ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

CREATE POLICY "Users can view all shifts"
    ON shifts FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can insert shifts"
    ON shifts FOR INSERT TO public
    WITH CHECK ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

CREATE POLICY "Users can insert own shifts"
    ON shifts FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update shifts"
    ON shifts FOR UPDATE TO public
    USING ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

CREATE POLICY "Users can update own shifts"
    ON shifts FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete shifts"
    ON shifts FOR DELETE TO public
    USING ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

CREATE POLICY "WFM can manage all shifts"
    ON shifts FOR ALL TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm');

-- ============================================
-- RLS POLICIES - SWAP REQUESTS
-- ============================================

CREATE POLICY "Users can view swap requests"
    ON swap_requests FOR SELECT TO public
    USING ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

CREATE POLICY "Users can view own swap requests"
    ON swap_requests FOR SELECT TO authenticated
    USING (
        auth.uid() = requester_id OR 
        auth.uid() = target_user_id OR
        get_user_role(auth.uid()) = ANY (ARRAY['tl', 'wfm'])
    );

CREATE POLICY "Users can create swap requests"
    ON swap_requests FOR INSERT TO public
    WITH CHECK ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

CREATE POLICY "Users can update own swap requests"
    ON swap_requests FOR UPDATE TO public
    USING ((requester_id = auth.uid()) AND ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com'));

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
    USING ((requester_id = auth.uid()) AND ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com'));

CREATE POLICY "Requester can cancel swap request"
    ON swap_requests FOR DELETE TO authenticated
    USING ((auth.uid() = requester_id) AND (status = 'pending_acceptance'));

-- ============================================
-- RLS POLICIES - LEAVE REQUESTS
-- ============================================

CREATE POLICY "Users can view leave requests"
    ON leave_requests FOR SELECT TO public
    USING ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

CREATE POLICY "Users can create leave requests"
    ON leave_requests FOR INSERT TO public
    WITH CHECK ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

CREATE POLICY "Users can insert leave requests"
    ON leave_requests FOR INSERT TO authenticated
    WITH CHECK (
        (auth.uid() = user_id) OR 
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ANY (ARRAY['tl', 'wfm'])))
    );

CREATE POLICY "Users can update own leave requests"
    ON leave_requests FOR UPDATE TO public
    USING ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com'));

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
    USING ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com'));

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
    WITH CHECK ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com'));

CREATE POLICY "Users can update own leave balances"
    ON leave_balances FOR UPDATE TO public
    USING ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com'));

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
    USING ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com'));

CREATE POLICY "Users can view own balance history"
    ON leave_balance_history FOR SELECT TO authenticated
    USING (
        (user_id = auth.uid()) OR 
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ANY (ARRAY['tl', 'wfm'])))
    );

CREATE POLICY "System can insert leave balance history"
    ON leave_balance_history FOR INSERT TO public
    WITH CHECK ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

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
    USING ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

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
    WITH CHECK ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com'));

CREATE POLICY "Users can add comments"
    ON comments FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own non-system comments"
    ON comments FOR UPDATE TO public
    USING ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com') AND (is_system = false));

CREATE POLICY "Users can delete own non-system comments"
    ON comments FOR DELETE TO public
    USING ((user_id = auth.uid()) AND ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com') AND (is_system = false));

-- ============================================
-- RLS POLICIES - SETTINGS
-- ============================================

CREATE POLICY "Users can view settings"
    ON settings FOR SELECT TO public
    USING ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

CREATE POLICY "Anyone can read settings"
    ON settings FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Everyone can read settings"
    ON settings FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage settings"
    ON settings FOR ALL TO public
    USING ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

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
    USING ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

CREATE POLICY "Admins can manage leave types"
    ON leave_types FOR ALL TO public
    USING ((auth.jwt() ->> 'email') ~~ '%@dabdoob.com');

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
