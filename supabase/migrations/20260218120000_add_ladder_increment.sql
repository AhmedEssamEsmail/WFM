-- Add ladder_increment column to distribution_settings
-- This controls how many columns (15-min intervals) to skip between agents

ALTER TABLE distribution_settings
ADD COLUMN IF NOT EXISTS ladder_increment INTEGER NOT NULL DEFAULT 1;

-- Update existing records to have default value
UPDATE distribution_settings
SET ladder_increment = 1
WHERE ladder_increment IS NULL;

COMMENT ON COLUMN distribution_settings.ladder_increment IS 'Number of columns (15-min intervals) to increment per agent in ladder distribution';
