-- Migration: 007_swap_requests_additional_original_shift_types.sql
-- Add columns to store ALL 4 original shift types for complete swap display
-- 
-- We already have:
-- - requester_original_date, requester_original_shift_type (requester's shift on requester_date)
-- - target_original_date, target_original_shift_type (target's shift on target_date)
--
-- We need to add:
-- - requester_original_shift_type_on_target_date (what requester had on target's date)
-- - target_original_shift_type_on_requester_date (what target had on requester's date)

ALTER TABLE swap_requests 
ADD COLUMN IF NOT EXISTS requester_original_shift_type_on_target_date shift_type,
ADD COLUMN IF NOT EXISTS target_original_shift_type_on_requester_date shift_type;

-- Add comments for documentation
COMMENT ON COLUMN swap_requests.requester_original_shift_type_on_target_date IS 'Original shift type of the requester on the target date at time of request creation';
COMMENT ON COLUMN swap_requests.target_original_shift_type_on_requester_date IS 'Original shift type of the target on the requester date at time of request creation';
