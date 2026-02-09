-- ============================================
-- CENTRALIZED LEAVE TYPE MANAGEMENT
-- ============================================
-- This migration populates the leave_types table and adds a code field
-- for mapping to the existing leave_type enum

-- Add code field to leave_types table to map to enum values
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS code leave_type NOT NULL;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Make code unique
ALTER TABLE leave_types ADD CONSTRAINT leave_types_code_unique UNIQUE (code);

-- Populate leave_types table with existing types
INSERT INTO leave_types (code, label, description, color, display_order, is_active) VALUES
    ('sick', 'Sick', 'Sick Leave', '#FEE2E2', 1, true),
    ('annual', 'Annual', 'Annual Leave', '#D1FAE5', 2, true),
    ('casual', 'Casual', 'Casual Leave', '#FEF3C7', 3, true),
    ('public_holiday', 'Holiday', 'Public Holiday', '#E0E7FF', 4, true),
    ('bereavement', 'Bereav.', 'Bereavement Leave', '#D1D5DB', 5, true)
ON CONFLICT (code) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leave_types_code ON leave_types(code);
CREATE INDEX IF NOT EXISTS idx_leave_types_active ON leave_types(is_active);

-- Add comment
COMMENT ON COLUMN leave_types.code IS 'Maps to leave_type enum for backward compatibility';
COMMENT ON COLUMN leave_types.display_order IS 'Order in which leave types should be displayed in UI';
