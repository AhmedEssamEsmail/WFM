-- ============================================
-- CENTRALIZED LEAVE TYPE MANAGEMENT
-- ============================================
-- This migration populates the leave_types table and adds a code field
-- for mapping to the existing leave_type enum

-- First, check if the table exists and has data
DO $$
BEGIN
  -- Add code field as nullable first
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_types' AND column_name = 'code'
  ) THEN
    ALTER TABLE leave_types ADD COLUMN code leave_type;
  END IF;

  -- Add description field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_types' AND column_name = 'description'
  ) THEN
    ALTER TABLE leave_types ADD COLUMN description TEXT;
  END IF;

  -- Add display_order field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_types' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE leave_types ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Delete any existing rows that we can't map (safer to start fresh)
-- This is safe because leave_types is just configuration, not transactional data
DELETE FROM leave_types;

-- Insert all default leave types
INSERT INTO leave_types (code, label, description, color, display_order, is_active) VALUES
    ('sick', 'Sick', 'Sick Leave', '#FEE2E2', 1, true),
    ('annual', 'Annual', 'Annual Leave', '#D1FAE5', 2, true),
    ('casual', 'Casual', 'Casual Leave', '#FEF3C7', 3, true),
    ('public_holiday', 'Holiday', 'Public Holiday', '#E0E7FF', 4, true),
    ('bereavement', 'Bereav.', 'Bereavement Leave', '#D1D5DB', 5, true);

-- Now make code NOT NULL and UNIQUE
ALTER TABLE leave_types ALTER COLUMN code SET NOT NULL;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leave_types_code_unique'
  ) THEN
    ALTER TABLE leave_types ADD CONSTRAINT leave_types_code_unique UNIQUE (code);
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_leave_types_code ON leave_types(code);
CREATE INDEX IF NOT EXISTS idx_leave_types_active ON leave_types(is_active);

-- Add comments
COMMENT ON COLUMN leave_types.code IS 'Maps to leave_type enum for backward compatibility';
COMMENT ON COLUMN leave_types.display_order IS 'Order in which leave types should be displayed in UI';
