-- Add max_agents_per_cycle column to distribution_settings
-- This controls how many agents to assign before resetting to the start column

ALTER TABLE distribution_settings
ADD COLUMN IF NOT EXISTS max_agents_per_cycle INTEGER NOT NULL DEFAULT 5;

-- Update existing records to have default value
UPDATE distribution_settings
SET max_agents_per_cycle = 5
WHERE max_agents_per_cycle IS NULL;

COMMENT ON COLUMN distribution_settings.max_agents_per_cycle IS 'Maximum number of agents to assign before resetting to start column (creates cycles)';
