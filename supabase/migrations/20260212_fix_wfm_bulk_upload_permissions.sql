-- Fix WFM bulk upload permissions for shifts table
-- Add WITH CHECK clause to allow WFM to insert shifts for any user

DROP POLICY IF EXISTS "WFM can manage all shifts" ON shifts;

CREATE POLICY "WFM can manage all shifts"
    ON shifts FOR ALL TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm')
    WITH CHECK (get_user_role(auth.uid()) = 'wfm');
