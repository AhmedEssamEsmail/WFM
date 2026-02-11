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
