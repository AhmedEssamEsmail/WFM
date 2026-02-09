-- Migration: Allow TL to view all agent leave balances
-- Description: TL role can now see leave balances for all agents, not just their own
-- Date: 2026-02-09

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own leave balances" ON leave_balances;

-- Create new policy that allows:
-- 1. Users to view their own balances
-- 2. TLs to view all agent balances
-- 3. WFM already has full access via separate policy
CREATE POLICY "Users and TL can view leave balances"
    ON leave_balances FOR SELECT
    TO authenticated
    USING (
        (user_id = auth.uid()) OR 
        (EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'tl'::user_role 
            AND (SELECT role FROM users WHERE id = leave_balances.user_id) = 'agent'::user_role
        ))
    );
