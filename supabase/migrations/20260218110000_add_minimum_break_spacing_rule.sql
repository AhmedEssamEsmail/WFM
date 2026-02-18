-- Add minimum_break_spacing rule
-- This rule ensures breaks of the same type are distributed with minimum spacing between agents

INSERT INTO break_schedule_rules (
  rule_name,
  rule_type,
  description,
  is_active,
  is_blocking,
  priority,
  parameters
) VALUES (
  'minimum_break_spacing',
  'coverage',
  'Minimum intervals between agents taking the same break type',
  true,
  false, -- Warning by default, not blocking
  60,
  jsonb_build_object(
    'min_intervals', 10,
    'applies_to', ARRAY['HB1', 'B', 'HB2']
  )
)
ON CONFLICT (rule_name) DO NOTHING;
