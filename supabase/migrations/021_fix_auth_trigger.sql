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
