-- Make maximum_gap rule blocking
-- This ensures that breaks cannot be scheduled with gaps exceeding the maximum allowed time

UPDATE break_schedule_rules
SET is_blocking = true
WHERE rule_name = 'maximum_gap';
