# Security Warnings Fix

This document explains how to fix the security warnings from Supabase database linter.

## 1. Function Search Path Warnings (FIXED)

The following functions have been updated with `SET search_path = public` to prevent security vulnerabilities:

- `handle_shift_change()`
- `swap_break_schedules()`
- `update_skills_updated_at()`
- `normalize_email_domain()`
- `is_valid_email_domain()`

### Apply the fix:

```bash
# Run the migration
supabase db push

# Or if using migrations
supabase migration up
```

## 2. Leaked Password Protection (MANUAL FIX REQUIRED)

Supabase Auth can prevent the use of compromised passwords by checking against HaveIBeenPwned.org.

### Enable via Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Policies**
3. Find **Password Security** settings
4. Enable **Leaked Password Protection**

### Enable via CLI (if available):

```bash
supabase auth update --enable-leaked-password-protection
```

### Benefits:

- Prevents users from using passwords that have been exposed in data breaches
- Enhances overall account security
- Checks passwords against HaveIBeenPwned.org database

## Verification

After applying these fixes, run the database linter again:

```bash
supabase db lint
```

All warnings should be resolved.
