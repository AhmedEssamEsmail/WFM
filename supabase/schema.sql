-- =============================================================================
-- schema.sql — Swap Tool v2
-- Full rebuild: extensions, types, tables, indexes, functions, triggers,
--               views, RLS policies.
-- Run against a fresh Supabase project (postgres / service role).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Custom Types (Enums)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('agent', 'tl', 'wfm');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.shift_type AS ENUM ('AM', 'PM', 'BET', 'OFF');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.leave_type AS ENUM ('sick', 'annual', 'casual', 'public_holiday', 'bereavement');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.leave_request_status AS ENUM ('pending_tl', 'pending_wfm', 'approved', 'rejected', 'denied');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.swap_request_status AS ENUM ('pending_acceptance', 'pending_tl', 'pending_wfm', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.request_type AS ENUM ('swap', 'leave');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- users (must come first — most tables FK to it)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  role        public.user_role NOT NULL DEFAULT 'agent',
  status      TEXT NOT NULL DEFAULT 'active',
  employee_id TEXT UNIQUE,
  department  TEXT,
  hire_date   DATE,
  manager_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- departments
CREATE TABLE IF NOT EXISTS public.departments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL UNIQUE,
  code                 TEXT UNIQUE,
  parent_department_id UUID REFERENCES public.departments(id),
  head_id              UUID REFERENCES public.users(id),
  cost_center          TEXT,
  description          TEXT,
  active               BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- settings
CREATE TABLE IF NOT EXISTS public.settings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT NOT NULL UNIQUE,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- shift_configurations
CREATE TABLE IF NOT EXISTS public.shift_configurations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_code    TEXT NOT NULL UNIQUE,
  shift_label   TEXT NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- skills
CREATE TABLE IF NOT EXISTS public.skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color       VARCHAR(7) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_skills
CREATE TABLE IF NOT EXISTS public.user_skills (
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_id   UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
);

-- shifts
CREATE TABLE IF NOT EXISTS public.shifts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  shift_type public.shift_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- leave_types
CREATE TABLE IF NOT EXISTS public.leave_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          public.leave_type NOT NULL UNIQUE,
  label         TEXT,
  color         TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL,
  description   TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- leave_balances
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type public.leave_type NOT NULL,
  balance    NUMERIC(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, leave_type)
);

-- leave_requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type     public.leave_type NOT NULL,
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  status         public.leave_request_status NOT NULL DEFAULT 'pending_tl',
  tl_approved_at TIMESTAMPTZ,
  wfm_approved_at TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- leave_balance_history
CREATE TABLE IF NOT EXISTS public.leave_balance_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type       public.leave_type NOT NULL,
  previous_balance NUMERIC(10,2) NOT NULL,
  new_balance      NUMERIC(10,2) NOT NULL,
  change_reason    TEXT,
  changed_by       UUID REFERENCES public.users(id),
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- swap_requests
CREATE TABLE IF NOT EXISTS public.swap_requests (
  id                                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id                            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id                          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requester_shift_id                      UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  target_shift_id                         UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  status                                  public.swap_request_status NOT NULL DEFAULT 'pending_acceptance',
  tl_approved_at                          TIMESTAMPTZ,
  wfm_approved_at                         TIMESTAMPTZ,
  requester_original_date                 DATE,
  requester_original_shift_type           public.shift_type,
  target_original_date                    DATE,
  target_original_shift_type              public.shift_type,
  requester_original_shift_type_on_target_date public.shift_type,
  target_original_shift_type_on_requester_date public.shift_type,
  created_at                              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- comments
CREATE TABLE IF NOT EXISTS public.comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_type public.request_type NOT NULL,
  request_id   UUID NOT NULL,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  is_system    BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- headcount_profiles
CREATE TABLE IF NOT EXISTS public.headcount_profiles (
  user_id          UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  job_title        TEXT,
  job_level        TEXT,
  employment_type  TEXT NOT NULL DEFAULT 'full_time',
  location         TEXT,
  time_zone        TEXT DEFAULT 'UTC',
  phone            TEXT,
  skills           TEXT[] DEFAULT '{}',
  certifications   TEXT[] DEFAULT '{}',
  max_weekly_hours INTEGER DEFAULT 40,
  cost_center      TEXT,
  budget_code      TEXT,
  termination_date DATE,
  onboarding_status TEXT DEFAULT 'completed',
  last_active_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- headcount_audit_log
CREATE TABLE IF NOT EXISTS public.headcount_audit_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id),
  action           TEXT NOT NULL,
  previous_values  JSONB,
  new_values       JSONB,
  performed_by     UUID REFERENCES public.users(id),
  reason           TEXT,
  effective_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  performed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- break_schedule_rules
CREATE TABLE IF NOT EXISTS public.break_schedule_rules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name   TEXT NOT NULL UNIQUE,
  rule_type   TEXT NOT NULL,
  description TEXT,
  parameters  JSONB NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  is_blocking BOOLEAN DEFAULT false,
  priority    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- break_schedules
CREATE TABLE IF NOT EXISTS public.break_schedules (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  schedule_date  DATE NOT NULL,
  shift_type     TEXT,
  interval_start TIME NOT NULL,
  break_type     TEXT NOT NULL,
  created_by     UUID REFERENCES public.users(id),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, schedule_date, interval_start)
);

-- break_schedule_warnings
CREATE TABLE IF NOT EXISTS public.break_schedule_warnings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  schedule_date  DATE NOT NULL,
  warning_type   TEXT NOT NULL,
  old_shift_type TEXT,
  new_shift_type TEXT,
  is_resolved    BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, schedule_date, warning_type)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- FK indexes (prevent seq scans on joins)
CREATE INDEX IF NOT EXISTS idx_users_manager_id                   ON public.users(manager_id);
CREATE INDEX IF NOT EXISTS idx_departments_head_id                ON public.departments(head_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent_department_id   ON public.departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id               ON public.user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id                   ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_requester_shift_id   ON public.swap_requests(requester_shift_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_target_shift_id      ON public.swap_requests(target_shift_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_history_user_id      ON public.leave_balance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_history_changed_by   ON public.leave_balance_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_headcount_audit_log_user_id        ON public.headcount_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_headcount_audit_log_performed_by   ON public.headcount_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_break_schedules_created_by         ON public.break_schedules(created_by);

-- Query performance indexes
CREATE INDEX IF NOT EXISTS idx_shifts_user_id       ON public.shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date          ON public.shifts(date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user  ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_created_at ON public.swap_requests(created_at);

-- ---------------------------------------------------------------------------
-- Helper Functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.normalize_email_domain(domain_input TEXT)
RETURNS TEXT LANGUAGE SQL AS $$
  SELECT CASE
    WHEN domain_input IS NULL OR btrim(domain_input) = '' THEN ''
    WHEN left(lower(btrim(domain_input)), 1) = '@' THEN lower(btrim(domain_input))
    ELSE '@' || lower(btrim(domain_input))
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_valid_email_domain(domain_input TEXT)
RETURNS BOOLEAN LANGUAGE SQL AS $$
  SELECT public.normalize_email_domain(domain_input)
    ~ '^@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$';
$$;

CREATE OR REPLACE FUNCTION public.get_allowed_email_domain()
RETURNS TEXT LANGUAGE PLPGSQL SECURITY DEFINER AS $$
DECLARE
  configured_domain TEXT;
BEGIN
  SELECT value INTO configured_domain
  FROM public.settings WHERE key = 'allowed_email_domain' LIMIT 1;

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
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT CASE
    WHEN email_input IS NULL OR btrim(email_input) = '' THEN false
    WHEN char_length(public.get_allowed_email_domain()) = 0 THEN false
    ELSE right(lower(btrim(email_input)), char_length(public.get_allowed_email_domain()))
      = public.get_allowed_email_domain()
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_direct_reports(manager_uuid UUID)
RETURNS TABLE(id UUID, name TEXT, email TEXT, role public.user_role, department TEXT, status TEXT)
LANGUAGE PLPGSQL SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.role, u.department, u.status
  FROM public.users u
  WHERE u.manager_id = manager_uuid
    AND u.status IN ('active', 'on_leave')
  ORDER BY u.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_headcount_metrics()
RETURNS TABLE(metric_name TEXT, metric_value BIGINT)
LANGUAGE PLPGSQL SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 'total_active'::TEXT, COUNT(*)::BIGINT FROM public.users WHERE status = 'active'
  UNION ALL
  SELECT 'total_on_leave'::TEXT, COUNT(*)::BIGINT FROM public.users WHERE status = 'on_leave'
  UNION ALL
  SELECT 'total_fte'::TEXT, COALESCE(COUNT(*), 0)::BIGINT FROM public.users WHERE status IN ('active', 'on_leave');
END;
$$;

CREATE OR REPLACE FUNCTION public.accrue_leave_balances()
RETURNS VOID LANGUAGE PLPGSQL SECURITY DEFINER AS $$
BEGIN
  UPDATE public.leave_balances SET balance = balance + 1.25 WHERE leave_type = 'annual';
  UPDATE public.leave_balances SET balance = balance + 0.5  WHERE leave_type = 'casual';
END;
$$;

CREATE OR REPLACE FUNCTION public.accrue_monthly_leave_balances()
RETURNS VOID LANGUAGE PLPGSQL SECURITY DEFINER AS $$
BEGIN
  UPDATE leave_balances SET balance = balance + 1.25, updated_at = NOW() WHERE leave_type = 'annual';
  UPDATE leave_balances SET balance = balance + 0.5,  updated_at = NOW() WHERE leave_type = 'casual';
END;
$$;

-- RPC: execute swap by shift IDs (legacy)
CREATE OR REPLACE FUNCTION public.execute_shift_swap(
  p_requester_id      UUID,
  p_target_user_id    UUID,
  p_requester_shift_id UUID,
  p_target_shift_id   UUID,
  p_swap_request_id   UUID
) RETURNS JSONB LANGUAGE PLPGSQL AS $$
DECLARE
  v_requester_shift shifts%ROWTYPE;
  v_target_shift    shifts%ROWTYPE;
  v_result JSONB;
BEGIN
  SELECT * INTO v_requester_shift FROM shifts WHERE id = p_requester_shift_id FOR UPDATE;
  SELECT * INTO v_target_shift    FROM shifts WHERE id = p_target_shift_id    FOR UPDATE;

  IF v_requester_shift.id IS NULL OR v_target_shift.id IS NULL THEN
    RAISE EXCEPTION 'One or both shifts not found';
  END IF;

  IF v_requester_shift.user_id != p_requester_id OR v_target_shift.user_id != p_target_user_id THEN
    RAISE EXCEPTION 'Shift ownership mismatch';
  END IF;

  UPDATE shifts SET user_id = p_target_user_id WHERE id = p_requester_shift_id;
  UPDATE shifts SET user_id = p_requester_id    WHERE id = p_target_shift_id;
  UPDATE swap_requests SET status = 'approved' WHERE id = p_swap_request_id;

  v_result := jsonb_build_object(
    'success', true,
    'requester_shift_id', p_requester_shift_id,
    'target_shift_id',    p_target_shift_id
  );
  RETURN v_result;
END;
$$;

-- RPC: execute swap by dates (current)
CREATE OR REPLACE FUNCTION public.execute_shift_swap(
  p_requester_id   UUID,
  p_target_user_id UUID,
  p_requester_date DATE,
  p_target_date    DATE
) RETURNS JSON LANGUAGE PLPGSQL AS $$
DECLARE
  v_req_on_req  shifts%ROWTYPE;
  v_tgt_on_req  shifts%ROWTYPE;
  v_req_on_tgt  shifts%ROWTYPE;
  v_tgt_on_tgt  shifts%ROWTYPE;
  v_result JSON;
BEGIN
  SELECT * INTO v_req_on_req FROM shifts WHERE user_id = p_requester_id   AND date = p_requester_date FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shift not found for requester on requester date'; END IF;

  SELECT * INTO v_tgt_on_req FROM shifts WHERE user_id = p_target_user_id AND date = p_requester_date FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shift not found for target on requester date'; END IF;

  SELECT * INTO v_req_on_tgt FROM shifts WHERE user_id = p_requester_id   AND date = p_target_date    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shift not found for requester on target date'; END IF;

  SELECT * INTO v_tgt_on_tgt FROM shifts WHERE user_id = p_target_user_id AND date = p_target_date    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shift not found for target on target date'; END IF;

  UPDATE shifts SET shift_type = v_tgt_on_req.shift_type, updated_at = NOW() WHERE user_id = p_requester_id   AND date = p_requester_date;
  UPDATE shifts SET shift_type = v_req_on_req.shift_type, updated_at = NOW() WHERE user_id = p_target_user_id AND date = p_requester_date;
  UPDATE shifts SET shift_type = v_tgt_on_tgt.shift_type, updated_at = NOW() WHERE user_id = p_requester_id   AND date = p_target_date;
  UPDATE shifts SET shift_type = v_req_on_tgt.shift_type, updated_at = NOW() WHERE user_id = p_target_user_id AND date = p_target_date;

  v_result := json_build_object('success', true, 'message', 'Shift swap executed successfully');
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM, 'error_code', SQLSTATE);
END;
$$;

-- ---------------------------------------------------------------------------
-- Trigger Functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.update_skills_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_email_domain(domain_input TEXT)
RETURNS TEXT LANGUAGE SQL AS $$
  SELECT CASE
    WHEN domain_input IS NULL OR btrim(domain_input) = '' THEN ''
    WHEN left(lower(btrim(domain_input)), 1) = '@' THEN lower(btrim(domain_input))
    ELSE '@' || lower(btrim(domain_input))
  END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_allowed_email_domain_setting()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.check_email_domain()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_allowed_email_domain(NEW.email) THEN
    RAISE EXCEPTION 'Only % email addresses are allowed', public.get_allowed_email_domain()
      USING HINT = 'Please use your company email address';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_auth_user_email_domain()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.email IS NULL OR NOT public.is_allowed_email_domain(NEW.email) THEN
    RAISE EXCEPTION 'Only % email addresses are allowed', public.get_allowed_email_domain()
      USING HINT = 'Please use your company email address';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'agent'::public.user_role
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_user_role_to_app_metadata()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.initialize_leave_balances()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SET search_path = ''
AS $$
BEGIN
  INSERT INTO leave_balances (user_id, leave_type, balance)
  SELECT NEW.id, lt.code, 0
  FROM leave_types lt WHERE lt.is_active = true
  ON CONFLICT (user_id, leave_type) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in initialize_leave_balances: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_headcount_profile()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.headcount_profiles (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in create_headcount_profile: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_leave_balance()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE days_requested INTEGER;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    days_requested := NEW.end_date - NEW.start_date + 1;
    UPDATE leave_balances
    SET balance = balance - days_requested, updated_at = NOW()
    WHERE user_id = NEW.user_id AND leave_type = NEW.leave_type;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger-based swap (fires on swap_requests update to approved)
CREATE OR REPLACE FUNCTION public.execute_shift_swap()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requester_shift_type public.shift_type;
  target_shift_type    public.shift_type;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    SELECT shift_type INTO requester_shift_type FROM shifts WHERE id = NEW.requester_shift_id;
    SELECT shift_type INTO target_shift_type    FROM shifts WHERE id = NEW.target_shift_id;
    UPDATE shifts SET shift_type = target_shift_type    WHERE id = NEW.requester_shift_id;
    UPDATE shifts SET shift_type = requester_shift_type WHERE id = NEW.target_shift_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.swap_break_schedules()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requester_date DATE;
  target_date    DATE;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    SELECT date INTO requester_date FROM shifts WHERE id = NEW.requester_shift_id;
    SELECT date INTO target_date    FROM shifts WHERE id = NEW.target_shift_id;

    -- Swap breaks on requester's date
    WITH temp_breaks AS (
      DELETE FROM break_schedules
      WHERE (user_id = NEW.requester_id OR user_id = NEW.target_user_id)
        AND schedule_date = requester_date
      RETURNING *
    )
    INSERT INTO break_schedules (user_id, schedule_date, shift_type, interval_start, break_type, created_by)
    SELECT CASE WHEN user_id = NEW.requester_id THEN NEW.target_user_id ELSE NEW.requester_id END,
      schedule_date, shift_type, interval_start, break_type, created_by
    FROM temp_breaks;

    -- Swap breaks on target's date
    WITH temp_breaks AS (
      DELETE FROM break_schedules
      WHERE (user_id = NEW.requester_id OR user_id = NEW.target_user_id)
        AND schedule_date = target_date
      RETURNING *
    )
    INSERT INTO break_schedules (user_id, schedule_date, shift_type, interval_start, break_type, created_by)
    SELECT CASE WHEN user_id = NEW.requester_id THEN NEW.target_user_id ELSE NEW.requester_id END,
      schedule_date, shift_type, interval_start, break_type, created_by
    FROM temp_breaks;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_shift_change()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.shift_type IS DISTINCT FROM NEW.shift_type THEN
    DELETE FROM break_schedules WHERE user_id = NEW.user_id AND schedule_date = NEW.date;
    INSERT INTO break_schedule_warnings (user_id, schedule_date, warning_type, old_shift_type, new_shift_type)
    VALUES (NEW.user_id, NEW.date, 'shift_changed', OLD.shift_type::TEXT, NEW.shift_type::TEXT)
    ON CONFLICT (user_id, schedule_date, warning_type)
    DO UPDATE SET old_shift_type = EXCLUDED.old_shift_type, new_shift_type = EXCLUDED.new_shift_type, created_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_user_changes()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SET search_path = ''
AS $$
DECLARE
  action_type TEXT;
  old_vals JSONB;
  new_vals JSONB;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN action_type := 'status_changed';
  ELSIF OLD.department IS DISTINCT FROM NEW.department THEN action_type := 'department_changed';
  ELSIF OLD.role IS DISTINCT FROM NEW.role THEN action_type := 'promoted';
  ELSIF OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN action_type := 'manager_changed';
  ELSE action_type := 'profile_updated';
  END IF;

  old_vals := jsonb_build_object('status', OLD.status, 'department', OLD.department, 'role', OLD.role, 'manager_id', OLD.manager_id);
  new_vals := jsonb_build_object('status', NEW.status, 'department', NEW.department, 'role', NEW.role, 'manager_id', NEW.manager_id);

  IF old_vals IS DISTINCT FROM new_vals THEN
    INSERT INTO public.headcount_audit_log (user_id, action, previous_values, new_values, performed_by, effective_date)
    VALUES (NEW.id, action_type, old_vals, new_vals,
      COALESCE(current_setting('app.current_user_id', true)::uuid, NEW.id), CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- updated_at maintenance
CREATE OR REPLACE TRIGGER update_break_schedule_rules_updated_at
  BEFORE UPDATE ON public.break_schedule_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_break_schedules_updated_at
  BEFORE UPDATE ON public.break_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_headcount_profiles_updated_at
  BEFORE UPDATE ON public.headcount_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_shift_configurations_updated_at
  BEFORE UPDATE ON public.shift_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.update_skills_updated_at();

-- settings domain validation
CREATE OR REPLACE TRIGGER enforce_allowed_email_domain_setting
  BEFORE INSERT OR UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_allowed_email_domain_setting();

-- users
CREATE OR REPLACE TRIGGER enforce_email_domain_on_users
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.check_email_domain();

CREATE OR REPLACE TRIGGER sync_role_to_app_metadata
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_app_metadata();

CREATE OR REPLACE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_leave_balances();

CREATE OR REPLACE TRIGGER on_user_headcount_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_headcount_profile();

CREATE OR REPLACE TRIGGER trg_audit_user_changes
  AFTER UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.log_user_changes();

-- leave_requests
CREATE OR REPLACE TRIGGER on_leave_approved
  AFTER UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.deduct_leave_balance();

-- swap_requests
CREATE OR REPLACE TRIGGER on_swap_approved
  AFTER UPDATE ON public.swap_requests
  FOR EACH ROW EXECUTE FUNCTION public.execute_shift_swap();

CREATE OR REPLACE TRIGGER swap_breaks_trigger
  AFTER UPDATE ON public.swap_requests
  FOR EACH ROW EXECUTE FUNCTION public.swap_break_schedules();

-- shifts
CREATE OR REPLACE TRIGGER shift_change_trigger
  AFTER UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.handle_shift_change();

-- Auth hook: enforce email domain on auth.users
CREATE OR REPLACE TRIGGER enforce_email_domain_on_auth_users
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_auth_user_email_domain();

-- Auth hook: create public.users row on auth signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_configurations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_requests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.headcount_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.headcount_audit_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_schedule_rules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_schedules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_schedule_warnings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------

-- *** users ***
CREATE POLICY "Authenticated domain users can view users" ON public.users
  FOR SELECT USING (is_allowed_email_domain((select auth.jwt()) ->> 'email'));

CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK ((select auth.uid()) = id AND is_allowed_email_domain((select auth.jwt()) ->> 'email'));

CREATE POLICY "WFM and users can update" ON public.users
  FOR UPDATE
  USING (is_allowed_email_domain((select auth.jwt()) ->> 'email')
    AND (get_user_role((select auth.uid())) = 'wfm'::user_role OR (select auth.uid()) = id))
  WITH CHECK (is_allowed_email_domain((select auth.jwt()) ->> 'email')
    AND (get_user_role((select auth.uid())) = 'wfm'::user_role OR (select auth.uid()) = id));

-- *** departments ***
CREATE POLICY "All authenticated users can view departments" ON public.departments
  FOR SELECT USING (true);

CREATE POLICY "WFM can insert departments" ON public.departments
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

CREATE POLICY "WFM can update departments" ON public.departments
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

CREATE POLICY "WFM can delete departments" ON public.departments
  FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

-- *** settings ***
CREATE POLICY "Allowed-domain users can view settings" ON public.settings
  FOR SELECT USING (is_allowed_email_domain((select auth.jwt()) ->> 'email'));

CREATE POLICY "WFM can insert settings" ON public.settings
  FOR INSERT WITH CHECK (is_allowed_email_domain((select auth.jwt()) ->> 'email') AND get_user_role((select auth.uid())) = 'wfm'::user_role);

CREATE POLICY "WFM can update settings" ON public.settings
  FOR UPDATE
  USING (is_allowed_email_domain((select auth.jwt()) ->> 'email') AND get_user_role((select auth.uid())) = 'wfm'::user_role)
  WITH CHECK (is_allowed_email_domain((select auth.jwt()) ->> 'email') AND get_user_role((select auth.uid())) = 'wfm'::user_role);

CREATE POLICY "WFM can delete settings" ON public.settings
  FOR DELETE USING (is_allowed_email_domain((select auth.jwt()) ->> 'email') AND get_user_role((select auth.uid())) = 'wfm'::user_role);

-- *** shift_configurations ***
CREATE POLICY "Anyone can view shift configurations" ON public.shift_configurations
  FOR SELECT USING (true);

CREATE POLICY "WFM can insert shift configurations" ON public.shift_configurations
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

CREATE POLICY "WFM can update shift configurations" ON public.shift_configurations
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

CREATE POLICY "WFM can delete shift configurations" ON public.shift_configurations
  FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

-- *** skills ***
CREATE POLICY "All users can view skills" ON public.skills
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "WFM can create skills" ON public.skills
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

CREATE POLICY "WFM can update skills" ON public.skills
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

CREATE POLICY "WFM can delete skills" ON public.skills
  FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

-- *** user_skills ***
CREATE POLICY "All users can view user skills" ON public.user_skills
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "WFM can assign skills" ON public.user_skills
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

CREATE POLICY "WFM can remove skills" ON public.user_skills
  FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

-- *** shifts ***
CREATE POLICY "Users can view all shifts" ON public.shifts
  FOR SELECT USING (true);

CREATE POLICY "TL and WFM can insert shifts" ON public.shifts
  FOR INSERT WITH CHECK (get_user_role((select auth.uid())) = ANY (ARRAY['tl'::user_role, 'wfm'::user_role]));

CREATE POLICY "TL and WFM can update shifts" ON public.shifts
  FOR UPDATE USING (get_user_role((select auth.uid())) = ANY (ARRAY['tl'::user_role, 'wfm'::user_role]));

CREATE POLICY "TL and WFM can delete shifts" ON public.shifts
  FOR DELETE USING (get_user_role((select auth.uid())) = ANY (ARRAY['tl'::user_role, 'wfm'::user_role]));

-- *** leave_types ***
CREATE POLICY "Users can view leave types" ON public.leave_types
  FOR SELECT USING ((select auth.jwt()) ->> 'email' LIKE '%@dabdoob.com');

CREATE POLICY "TL and WFM can insert leave types" ON public.leave_types
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = ANY (ARRAY['wfm'::user_role, 'tl'::user_role])));

CREATE POLICY "TL and WFM can update leave types" ON public.leave_types
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = ANY (ARRAY['wfm'::user_role, 'tl'::user_role])))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = ANY (ARRAY['wfm'::user_role, 'tl'::user_role])));

CREATE POLICY "TL and WFM can delete leave types" ON public.leave_types
  FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = ANY (ARRAY['wfm'::user_role, 'tl'::user_role])));

-- *** leave_balances ***
CREATE POLICY "Select leave balances" ON public.leave_balances
  FOR SELECT USING (
    get_user_role((select auth.uid())) = 'wfm'::user_role
    OR user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'tl'::user_role
        AND (SELECT u2.role FROM users u2 WHERE u2.id = leave_balances.user_id) = 'agent'::user_role
    )
  );

CREATE POLICY "Insert leave balances" ON public.leave_balances
  FOR INSERT WITH CHECK (
    get_user_role((select auth.uid())) = 'wfm'::user_role
    OR (user_id = (select auth.uid()) AND (select auth.jwt()) ->> 'email' LIKE '%@dabdoob.com')
  );

CREATE POLICY "Update leave balances" ON public.leave_balances
  FOR UPDATE USING (
    get_user_role((select auth.uid())) = 'wfm'::user_role
    OR (user_id = (select auth.uid()) AND (select auth.jwt()) ->> 'email' LIKE '%@dabdoob.com')
  );

CREATE POLICY "Delete leave balances" ON public.leave_balances
  FOR DELETE USING (get_user_role((select auth.uid())) = 'wfm'::user_role);

-- *** leave_requests ***
CREATE POLICY "Users can view leave requests" ON public.leave_requests
  FOR SELECT USING ((select auth.jwt()) ->> 'email' LIKE '%@dabdoob.com');

CREATE POLICY "Users can insert leave requests" ON public.leave_requests
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = ANY (ARRAY['tl'::user_role, 'wfm'::user_role]))
  );

CREATE POLICY "Users can update leave requests" ON public.leave_requests
  FOR UPDATE
  USING (
    ((select auth.uid()) = user_id AND status != 'approved'::leave_request_status)
    OR EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = ANY (ARRAY['tl'::user_role, 'wfm'::user_role]))
  )
  WITH CHECK (
    ((select auth.uid()) = user_id AND status != 'approved'::leave_request_status)
    OR EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = ANY (ARRAY['tl'::user_role, 'wfm'::user_role]))
  );

CREATE POLICY "Users can delete leave requests" ON public.leave_requests
  FOR DELETE USING (
    ((select auth.uid()) = user_id AND status != 'approved'::leave_request_status)
    OR EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = ANY (ARRAY['tl'::user_role, 'wfm'::user_role]))
  );

-- *** leave_balance_history ***
CREATE POLICY "View leave_balance_history by role" ON public.leave_balance_history
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = ANY (ARRAY['tl'::user_role, 'wfm'::user_role]))
  );

CREATE POLICY "WFM can insert balance history" ON public.leave_balance_history
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

-- *** swap_requests ***
CREATE POLICY "Users can view own swap requests" ON public.swap_requests
  FOR SELECT USING (
    (select auth.uid()) = requester_id
    OR (select auth.uid()) = target_user_id
    OR get_user_role((select auth.uid())) = ANY (ARRAY['tl'::user_role, 'wfm'::user_role])
  );

CREATE POLICY "Users can create swap requests" ON public.swap_requests
  FOR INSERT WITH CHECK ((select auth.jwt()) ->> 'email' LIKE '%@dabdoob.com');

CREATE POLICY "Users can update swap requests they're involved in" ON public.swap_requests
  FOR UPDATE USING (
    (select auth.uid()) = requester_id
    OR (select auth.uid()) = target_user_id
    OR EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = ANY (ARRAY['wfm'::user_role, 'tl'::user_role]))
  );

CREATE POLICY "Users can delete own swap requests" ON public.swap_requests
  FOR DELETE USING (requester_id = (select auth.uid()) AND (select auth.jwt()) ->> 'email' LIKE '%@dabdoob.com');

-- *** comments ***
CREATE POLICY "All authenticated users can view comments" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (user_id = (select auth.uid()) AND (select auth.jwt()) ->> 'email' LIKE '%@dabdoob.com');

CREATE POLICY "Users can update own non-system comments" ON public.comments
  FOR UPDATE USING (user_id = (select auth.uid()) AND (select auth.jwt()) ->> 'email' LIKE '%@dabdoob.com' AND is_system = false);

CREATE POLICY "Users can delete own non-system comments" ON public.comments
  FOR DELETE USING (user_id = (select auth.uid()) AND (select auth.jwt()) ->> 'email' LIKE '%@dabdoob.com' AND is_system = false);

-- *** headcount_profiles ***
CREATE POLICY "View headcount_profiles by role" ON public.headcount_profiles
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
        AND (users.role = 'wfm'::user_role
          OR (users.role = 'tl'::user_role AND users.department = (
            SELECT u2.department FROM users u2 WHERE u2.id = headcount_profiles.user_id
          )))
    )
  );

CREATE POLICY "WFM can insert profiles" ON public.headcount_profiles
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

CREATE POLICY "WFM can update profiles" ON public.headcount_profiles
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

CREATE POLICY "WFM can delete profiles" ON public.headcount_profiles
  FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

-- *** headcount_audit_log ***
CREATE POLICY "View headcount_audit_log by role" ON public.headcount_audit_log
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role)
  );

CREATE POLICY "WFM can insert audit logs" ON public.headcount_audit_log
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

-- *** break_schedule_rules ***
CREATE POLICY "Everyone can view rules" ON public.break_schedule_rules
  FOR SELECT USING (true);

CREATE POLICY "WFM can insert rules" ON public.break_schedule_rules
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

CREATE POLICY "WFM can update rules" ON public.break_schedule_rules
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

CREATE POLICY "WFM can delete rules" ON public.break_schedule_rules
  FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

-- *** break_schedules ***
CREATE POLICY "View break_schedules by role" ON public.break_schedules
  FOR SELECT USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
        AND (users.role = 'wfm'::user_role
          OR (users.role = 'tl'::user_role AND users.department = (
            SELECT u2.department FROM users u2 WHERE u2.id = break_schedules.user_id
          )))
    )
  );

CREATE POLICY "WFM can insert breaks" ON public.break_schedules
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

CREATE POLICY "WFM can update breaks" ON public.break_schedules
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

CREATE POLICY "WFM can delete breaks" ON public.break_schedules
  FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

-- *** break_schedule_warnings ***
CREATE POLICY "View break_schedule_warnings by role" ON public.break_schedule_warnings
  FOR SELECT USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
        AND (users.role = 'wfm'::user_role
          OR (users.role = 'tl'::user_role AND users.department = (
            SELECT u2.department FROM users u2 WHERE u2.id = break_schedule_warnings.user_id
          )))
    )
  );

CREATE POLICY "WFM can dismiss warnings" ON public.break_schedule_warnings
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'wfm'::user_role));

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_headcount_active AS
SELECT
  u.id, u.employee_id, u.email, u.name, u.role, u.status,
  u.department, u.hire_date, u.manager_id, u.created_at,
  hp.job_title, hp.job_level, hp.employment_type, hp.location,
  hp.time_zone, hp.phone, hp.skills, hp.max_weekly_hours,
  hp.cost_center, hp.onboarding_status, hp.last_active_at,
  m.name  AS manager_name,
  m.email AS manager_email,
  COALESCE(
    json_agg(json_build_object(
      'id', s.id, 'name', s.name, 'description', s.description,
      'color', s.color, 'is_active', s.is_active
    ) ORDER BY s.name) FILTER (WHERE s.id IS NOT NULL),
    '[]'::json
  ) AS assigned_skills
FROM users u
LEFT JOIN headcount_profiles hp ON u.id = hp.user_id
LEFT JOIN users m ON u.manager_id = m.id
LEFT JOIN user_skills us ON u.id = us.user_id
LEFT JOIN skills s ON us.skill_id = s.id
WHERE u.status = ANY (ARRAY['active', 'on_leave'])
GROUP BY u.id, hp.user_id, m.id;

CREATE OR REPLACE VIEW public.v_department_summary AS
SELECT
  u.department,
  count(*) AS total_headcount,
  count(*) FILTER (WHERE u.status = 'active')       AS active_count,
  count(*) FILTER (WHERE u.status = 'on_leave')      AS on_leave_count,
  count(*) FILTER (WHERE u.role = 'agent')            AS agents_count,
  count(*) FILTER (WHERE u.role = 'tl')               AS tls_count,
  count(*) FILTER (WHERE u.role = 'wfm')              AS wfm_count,
  count(*) FILTER (WHERE hp.employment_type = 'contractor') AS contractors_count
FROM users u
LEFT JOIN headcount_profiles hp ON u.id = hp.user_id
WHERE u.status = ANY (ARRAY['active', 'on_leave'])
GROUP BY u.department;

CREATE OR REPLACE VIEW public.v_management_chain AS
WITH RECURSIVE management_tree AS (
  SELECT id, name, email, manager_id, role, department, 1 AS level, ARRAY[id] AS path
  FROM users WHERE manager_id IS NULL
  UNION ALL
  SELECT u.id, u.name, u.email, u.manager_id, u.role, u.department, mt.level + 1, mt.path || u.id
  FROM users u
  JOIN management_tree mt ON u.manager_id = mt.id
)
SELECT id, name, email, manager_id, role, department, level, path FROM management_tree;

-- =============================================================================
-- End of schema.sql
-- =============================================================================
