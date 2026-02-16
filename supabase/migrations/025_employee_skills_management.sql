-- ============================================
-- EMPLOYEE SKILLS MANAGEMENT SYSTEM
-- Migration: 025_employee_skills_management.sql
-- Description: Creates tables, indexes, and view updates for the employee skills management system
-- ============================================

-- ============================================
-- TABLES
-- ============================================

-- Skills catalog table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) NOT NULL, -- Hex color code (e.g., #FF5733)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User skills junction table (many-to-many relationship)
CREATE TABLE user_skills (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Indexes for skills table
CREATE INDEX idx_skills_active ON skills(is_active);
CREATE INDEX idx_skills_name ON skills(name);

-- Indexes for user_skills table (for performance optimization)
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp on skills table
CREATE OR REPLACE FUNCTION update_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_skills_updated_at();

-- ============================================
-- VIEW UPDATES
-- ============================================

-- Update v_headcount_active view to include skills as JSON array
CREATE OR REPLACE VIEW v_headcount_active
WITH (security_invoker = true)
AS
SELECT 
    u.id,
    u.employee_id,
    u.email,
    u.name,
    u.role,
    u.status,
    u.department,
    u.hire_date,
    u.manager_id,
    u.created_at,
    hp.job_title,
    hp.job_level,
    hp.employment_type,
    hp.location,
    hp.time_zone,
    hp.phone,
    hp.skills,
    hp.max_weekly_hours,
    hp.cost_center,
    hp.onboarding_status,
    hp.last_active_at,
    m.name AS manager_name,
    m.email AS manager_email,
    COALESCE(
      json_agg(
        json_build_object(
          'id', s.id,
          'name', s.name,
          'description', s.description,
          'color', s.color,
          'is_active', s.is_active
        ) ORDER BY s.name
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'::json
    ) as assigned_skills
FROM users u
LEFT JOIN headcount_profiles hp ON u.id = hp.user_id
LEFT JOIN users m ON u.manager_id = m.id
LEFT JOIN user_skills us ON u.id = us.user_id
LEFT JOIN skills s ON us.skill_id = s.id
WHERE u.status IN ('active', 'on_leave')
GROUP BY u.id, hp.user_id, m.id;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on skills table
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active skills
CREATE POLICY "All users can view skills"
  ON skills FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only WFM users can create skills
CREATE POLICY "WFM can create skills"
  ON skills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- Only WFM users can update skills
CREATE POLICY "WFM can update skills"
  ON skills FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- Only WFM users can delete skills
CREATE POLICY "WFM can delete skills"
  ON skills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- Enable RLS on user_skills table
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view user skills
CREATE POLICY "All users can view user skills"
  ON user_skills FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only WFM users can assign skills to users
CREATE POLICY "WFM can assign skills"
  ON user_skills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- Only WFM users can remove skill assignments
CREATE POLICY "WFM can remove skills"
  ON user_skills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'wfm'
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE skills IS 'Catalog of skills that can be assigned to employees';
COMMENT ON TABLE user_skills IS 'Junction table linking users to their assigned skills';
COMMENT ON COLUMN skills.name IS 'Unique skill name (case-insensitive uniqueness enforced)';
COMMENT ON COLUMN skills.color IS 'Hex color code for visual identification (e.g., #FF5733)';
COMMENT ON COLUMN skills.is_active IS 'Active skills appear in assignment and filter dropdowns';
