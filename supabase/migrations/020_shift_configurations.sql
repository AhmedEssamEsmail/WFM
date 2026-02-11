-- Shift Configurations Table
-- Stores configurable shift times for break schedule management

CREATE TABLE IF NOT EXISTS shift_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_code TEXT NOT NULL UNIQUE,
  shift_label TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE shift_configurations ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read shift configurations
CREATE POLICY "Anyone can view shift configurations"
  ON shift_configurations
  FOR SELECT
  TO authenticated
  USING (true);

-- Only WFM can insert/update/delete shift configurations
CREATE POLICY "WFM can manage shift configurations"
  ON shift_configurations
  FOR ALL
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

-- Create index for faster lookups
CREATE INDEX idx_shift_configurations_active ON shift_configurations(is_active);
CREATE INDEX idx_shift_configurations_code ON shift_configurations(shift_code);

-- Insert default shift configurations
INSERT INTO shift_configurations (shift_code, shift_label, start_time, end_time, display_order, description) VALUES
  ('AM', 'Morning Shift', '09:00:00', '17:00:00', 1, 'Standard morning shift from 9 AM to 5 PM'),
  ('PM', 'Evening Shift', '13:00:00', '21:00:00', 2, 'Evening shift from 1 PM to 9 PM'),
  ('BET', 'Between Shift', '11:00:00', '19:00:00', 3, 'Mid-day shift from 11 AM to 7 PM'),
  ('OFF', 'Off Day', '00:00:00', '00:00:00', 4, 'Day off - no shift hours')
ON CONFLICT (shift_code) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_shift_configurations_updated_at
  BEFORE UPDATE ON shift_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE shift_configurations IS 'Configurable shift times for break schedule management';
