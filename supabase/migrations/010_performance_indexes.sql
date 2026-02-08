-- Migration: Performance Indexes
-- Description: Add strategic composite indexes for query optimization
-- Date: 2026-02-08
-- Note: Using CONCURRENTLY to avoid table locking during index creation

-- ============================================
-- SHIFTS TABLE INDEXES
-- ============================================

-- Composite index for user shifts queries (most common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shifts_user_date_composite 
    ON shifts(user_id, date);

-- ============================================
-- LEAVE REQUESTS TABLE INDEXES
-- ============================================

-- Composite index for user leave requests queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_requests_user_status 
    ON leave_requests(user_id, status);

-- Composite index for pending leave requests ordered by creation time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_requests_status_created 
    ON leave_requests(status, created_at DESC);

-- ============================================
-- SWAP REQUESTS TABLE INDEXES
-- ============================================

-- Composite index for pending swap requests ordered by creation time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_swap_requests_status_created 
    ON swap_requests(status, created_at DESC);

-- Index for requester's swap requests ordered by creation time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_swap_requests_requester_created 
    ON swap_requests(requester_id, created_at DESC);

-- Index for target user's swap requests ordered by creation time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_swap_requests_target_created 
    ON swap_requests(target_user_id, created_at DESC);

-- ============================================
-- COMMENTS TABLE INDEXES
-- ============================================

-- Composite index for comments by request (most common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_request_composite 
    ON comments(request_id, request_type);

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

-- Index for email lookups (authentication and user search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
    ON users(email);

-- ============================================
-- LEAVE BALANCES TABLE INDEXES
-- ============================================

-- Composite index for user leave balance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_balances_user_type 
    ON leave_balances(user_id, leave_type);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON INDEX idx_shifts_user_date_composite IS 
    'Optimizes queries for user shifts by date range';

COMMENT ON INDEX idx_leave_requests_user_status IS 
    'Optimizes queries for user leave requests filtered by status';

COMMENT ON INDEX idx_leave_requests_status_created IS 
    'Optimizes queries for pending leave requests ordered by creation time';

COMMENT ON INDEX idx_swap_requests_status_created IS 
    'Optimizes queries for pending swap requests ordered by creation time';

COMMENT ON INDEX idx_swap_requests_requester_created IS 
    'Optimizes queries for requester swap requests ordered by creation time';

COMMENT ON INDEX idx_swap_requests_target_created IS 
    'Optimizes queries for target user swap requests ordered by creation time';

COMMENT ON INDEX idx_comments_request_composite IS 
    'Optimizes queries for comments by request ID and type';

COMMENT ON INDEX idx_users_email IS 
    'Optimizes email lookups for authentication and user search';

COMMENT ON INDEX idx_leave_balances_user_type IS 
    'Optimizes queries for user leave balances by type';
