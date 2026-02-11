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
