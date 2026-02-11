-- Rollback script for break schedules migration
-- Run this if you need to drop the tables and recreate them

-- Drop triggers first
DROP TRIGGER IF EXISTS shift_change_trigger ON shifts;
DROP TRIGGER IF EXISTS swap_breaks_trigger ON swap_requests;

-- Drop functions
DROP FUNCTION IF EXISTS handle_shift_change();
DROP FUNCTION IF EXISTS swap_break_schedules();

-- Drop tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS break_schedule_warnings CASCADE;
DROP TABLE IF EXISTS break_schedule_rules CASCADE;
DROP TABLE IF EXISTS break_schedules CASCADE;

-- Note: After running this, you can run migration 015 again to recreate the tables
