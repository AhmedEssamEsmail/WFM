-- Migration: Add distribution settings table for break auto-distribution
-- This table stores configurable parameters for the ladder distribution algorithm

-- Create distribution_settings table
CREATE TABLE IF NOT EXISTS distribution_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_type TEXT NOT NULL CHECK (shift_type IN ('AM', 'PM', 'BET')),
  hb1_start_column INTEGER NOT NULL CHECK (hb1_start_column >= 0 AND hb1_start_column < 48),
  b_offset_minutes INTEGER NOT NULL DEFAULT 150 CHECK (b_offset_minutes >= 90),
  hb2_offset_minutes INTEGER NOT NULL DEFAULT 150 CHECK (hb2_offset_minutes >= 90),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shift_type)
);

-- Add index on shift_type for fast lookups
CREATE INDEX IF NOT EXISTS idx_distribution_settings_shift_type ON distribution_settings(shift_type);

-- Insert default settings for each shift type
INSERT INTO distribution_settings (shift_type, hb1_start_column, b_offset_minutes, hb2_offset_minutes)
VALUES 
  ('AM', 4, 150, 150),   -- AM starts at column 4 (9:45 AM)
  ('PM', 16, 150, 150),  -- PM starts at column 16 (1:00 PM)
  ('BET', 8, 150, 150)   -- BET starts at column 8 (10:45 AM)
ON CONFLICT (shift_type) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE distribution_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read distribution settings
CREATE POLICY "Allow authenticated users to read distribution settings"
  ON distribution_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Only WFM role can insert distribution settings
CREATE POLICY "Allow WFM to insert distribution settings"
  ON distribution_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'wfm'
    )
  );

-- RLS Policy: Only WFM role can update distribution settings
CREATE POLICY "Allow WFM to update distribution settings"
  ON distribution_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'wfm'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'wfm'
    )
  );

-- RLS Policy: Only WFM role can delete distribution settings
CREATE POLICY "Allow WFM to delete distribution settings"
  ON distribution_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'wfm'
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_distribution_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER distribution_settings_updated_at
  BEFORE UPDATE ON distribution_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_distribution_settings_updated_at();

-- Add comment to table
COMMENT ON TABLE distribution_settings IS 'Stores configurable parameters for the ladder-based break distribution algorithm';
COMMENT ON COLUMN distribution_settings.shift_type IS 'The shift type (AM, PM, or BET)';
COMMENT ON COLUMN distribution_settings.hb1_start_column IS 'Starting column index (0-47) for HB1 break assignment';
COMMENT ON COLUMN distribution_settings.b_offset_minutes IS 'Minutes between HB1 and B break (minimum 90)';
COMMENT ON COLUMN distribution_settings.hb2_offset_minutes IS 'Minutes between B and HB2 break (minimum 90)';
