# Supabase Security Warnings - Fix Guide

## Summary

Your Supabase database has 4 security warnings that need immediate attention:

1. **3x Security Definer Views** - Views with elevated privileges that bypass RLS
2. **1x RLS Policy Using user_metadata** - Authentication check using user-editable data

## What's the Risk?

### Security Definer Views
- Views run with the permissions of the view creator (usually superuser)
- Bypass Row Level Security (RLS) policies
- Can expose data that should be restricted
- **Impact**: Medium - Views expose data but don't allow modifications

### user_metadata in RLS Policies
- `user_metadata` is editable by end users via the Supabase client
- Users can change their own role to 'wfm' and gain unauthorized access
- **Impact**: HIGH - Critical security vulnerability allowing privilege escalation

## The Fix

### Step 1: Apply the Migration

Run the migration that removes these issues:

```bash
# If using Supabase CLI locally
supabase db push

# Or apply directly in Supabase Dashboard
# Go to SQL Editor and run: supabase/migrations/012_fix_security_warnings.sql
```

### Step 2: Update Role Assignment (CRITICAL)

The `app_metadata` field can only be set server-side. You have two options:

#### Option A: Database Trigger (Recommended)
Create a trigger that automatically sets app_metadata based on the users table:

```sql
-- Add this to a new migration file
CREATE OR REPLACE FUNCTION sync_user_role_to_app_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Update auth.users app_metadata when users.role changes
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_role_to_app_metadata
    AFTER INSERT OR UPDATE OF role ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_role_to_app_metadata();
```

#### Option B: Supabase Edge Function
Create an edge function that sets app_metadata during signup:

```typescript
// supabase/functions/signup/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { email, password, name, role } = await req.json()
  
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
    app_metadata: { role: role || 'agent' } // Secure, server-side only
  })
  
  if (error) throw error
  return new Response(JSON.stringify(data), { status: 200 })
})
```

### Step 3: Verify the Fix

After applying the migration:

1. Go to Supabase Dashboard → Database → Linter
2. Run the linter again
3. All 4 warnings should be resolved

## Why These Changes Are Safe

### Views Without SECURITY DEFINER
- Views now respect RLS policies on underlying tables (users, headcount_profiles)
- Users can only see data they're authorized to see
- No functionality is lost, just proper security enforcement

### app_metadata vs user_metadata
- `app_metadata`: Server-side only, secure for authorization
- `user_metadata`: Client-editable, only for display preferences
- Role checks now use secure, tamper-proof data

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Role sync trigger/function deployed
- [ ] Existing users have roles in app_metadata
- [ ] New signups set app_metadata correctly
- [ ] WFM users can still view all comments
- [ ] Regular users cannot escalate privileges
- [ ] Supabase linter shows 0 security warnings
- [ ] All existing functionality works as expected

## Rollback Plan

If issues occur, you can temporarily rollback:

```sql
-- Restore SECURITY DEFINER (temporary only!)
ALTER VIEW v_headcount_active SET (security_invoker = false);
ALTER VIEW v_management_chain SET (security_invoker = false);
ALTER VIEW v_department_summary SET (security_invoker = false);

-- Restore user_metadata policy (temporary only!)
DROP POLICY IF EXISTS "WFM can view all comments for audit" ON comments;
CREATE POLICY "WFM can view all comments for audit"
    ON comments FOR SELECT
    TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role'::text) = 'wfm');
```

**Note**: This rollback is for emergency only. The security vulnerabilities will remain until properly fixed.
