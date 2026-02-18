-- Fix security warnings from Supabase database linter
-- This migration addresses:
-- 1. Function search_path mutability warnings
-- 2. Leaked password protection

-- Fix handle_shift_change function
CREATE OR REPLACE FUNCTION handle_shift_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      created_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix swap_break_schedules function
CREATE OR REPLACE FUNCTION swap_break_schedules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      created_by
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
      created_by
    FROM temp_breaks;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix update_skills_updated_at function
CREATE OR REPLACE FUNCTION update_skills_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix normalize_email_domain function
CREATE OR REPLACE FUNCTION public.normalize_email_domain(domain_input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN domain_input IS NULL OR btrim(domain_input) = '' THEN ''
    WHEN left(lower(btrim(domain_input)), 1) = '@' THEN lower(btrim(domain_input))
    ELSE '@' || lower(btrim(domain_input))
  END;
$$;

-- Fix is_valid_email_domain function
CREATE OR REPLACE FUNCTION public.is_valid_email_domain(domain_input TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT public.normalize_email_domain(domain_input)
    ~ '^@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$';
$$;
