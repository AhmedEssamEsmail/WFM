-- Migration: System Comment Protection
-- Description: Add RLS policies to prevent modification of system-generated comments
-- Date: 2026-02-08

-- Drop existing overly permissive UPDATE and DELETE policies on comments
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- Create new policies that prevent modification of system comments
-- Users can only update their own non-system comments
CREATE POLICY "Users can update own non-system comments"
    ON comments FOR UPDATE
    TO public
    USING (
        user_id = auth.uid() 
        AND (auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text
        AND is_system = false
    );

-- Users can only delete their own non-system comments
CREATE POLICY "Users can delete own non-system comments"
    ON comments FOR DELETE
    TO public
    USING (
        user_id = auth.uid() 
        AND (auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text
        AND is_system = false
    );

-- WFM role can view all comments for audit purposes (read-only)
-- This policy is additive to existing SELECT policies
CREATE POLICY "WFM can view all comments for audit"
    ON comments FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role'::text) = 'wfm'
    );

-- Add comment explaining the protection
COMMENT ON POLICY "Users can update own non-system comments" ON comments IS 
    'Prevents users from modifying system-generated comments. Only non-system comments can be updated by their owners.';

COMMENT ON POLICY "Users can delete own non-system comments" ON comments IS 
    'Prevents users from deleting system-generated comments. Only non-system comments can be deleted by their owners.';

COMMENT ON POLICY "WFM can view all comments for audit" ON comments IS 
    'Allows WFM role to view all comments including system comments for audit and monitoring purposes.';
