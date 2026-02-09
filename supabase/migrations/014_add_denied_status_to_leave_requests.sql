-- Migration: 007_add_denied_status_to_leave_requests.sql
-- Add 'denied' status to leave_request_status enum for auto-denial feature
-- Also add 'allow_leave_exceptions' setting for the exception request feature

-- Add 'denied' to leave_request_status enum
ALTER TYPE leave_request_status ADD VALUE IF NOT EXISTS 'denied';

-- Insert the allow_leave_exceptions setting (default to true)
INSERT INTO settings (key, value, updated_at)
VALUES ('allow_leave_exceptions', 'true', NOW())
ON CONFLICT (key) DO NOTHING;
