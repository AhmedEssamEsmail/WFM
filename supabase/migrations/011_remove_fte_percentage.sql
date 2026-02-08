-- Migration: Remove FTE Percentage
-- Description: Remove fte_percentage column from users table and update related views
-- Date: 2026-02-09

-- Drop views that reference fte_percentage
DROP VIEW IF EXISTS v_department_summary;
DROP VIEW IF EXISTS v_headcount_active;

-- Remove fte_percentage column from users table
ALTER TABLE users DROP COLUMN IF EXISTS fte_percentage;

-- Recreate v_headcount_active view without fte_percentage
CREATE OR REPLACE VIEW v_headcount_active AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.employee_id,
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
    hp.certifications,
    hp.max_weekly_hours,
    hp.cost_center,
    hp.budget_code,
    hp.termination_date,
    hp.onboarding_status,
    m.name AS manager_name,
    m.email AS manager_email
FROM users u
LEFT JOIN headcount_profiles hp ON u.id = hp.user_id
LEFT JOIN users m ON u.manager_id = m.id
WHERE u.status IN ('active', 'on_leave');

-- Recreate v_department_summary view without fte_percentage
CREATE OR REPLACE VIEW v_department_summary AS
SELECT 
    u.department,
    COUNT(*) AS total_headcount,
    COUNT(*) FILTER (WHERE u.status = 'active') AS active_count,
    COUNT(*) FILTER (WHERE u.status = 'on_leave') AS on_leave_count,
    COUNT(*) FILTER (WHERE u.role = 'agent') AS agent_count,
    COUNT(*) FILTER (WHERE u.role = 'tl') AS tl_count,
    COUNT(*) FILTER (WHERE u.role = 'wfm') AS wfm_count
FROM users u
WHERE u.status IN ('active', 'on_leave')
GROUP BY u.department;

-- Add comments
COMMENT ON VIEW v_headcount_active IS 'Active and on-leave employees with headcount profile data';
COMMENT ON VIEW v_department_summary IS 'Department-level headcount metrics';
