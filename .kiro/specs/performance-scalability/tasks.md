# Implementation Plan: Performance & Scalability

## Overview

This implementation plan addresses five critical performance and scalability improvements for the WFM application:

1. **Pagination** - Implement cursor-based pagination for all list endpoints
2. **Error Tracking** - Integrate Sentry for production error monitoring
3. **Database Indexes** - Add strategic composite indexes for query optimization
4. **Caching Strategy** - Configure React Query with differentiated stale times
5. **Code Splitting** - Enhance route-based lazy loading and bundle optimization

The implementation follows an incremental approach, starting with foundational changes (database indexes, error tracking setup) and building up to user-facing features (pagination UI, performance monitoring).

## Tasks

- [ ] 1. Set up Sentry integration and error tracking
  - Install @sentry/react and @sentry/vite-plugin packages
  - Create Sentry configuration file with environment-specific settings
  - Update errorHandler.ts to integrate with Sentry
  - Add Sentry initialization to main.tsx
  - Configure source maps for production error tracking
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ]* 1.1 Write property test for error tracking with context
  - **Property 4: Error tracking with context**
  - **Validates: Requirements 2.1, 2.2, 2.5**

- [ ]* 1.2 Write property test for non-Error value handling
  - **Property 5: Non-Error value handling**
  - **Validates: Requirements 2.3**

- [ ]* 1.3 Write property test for error tracking resilience
  - **Property 6: Error tracking resilience**
  - **Validates: Requirements 2.6**

- [ ]* 1.4 Write unit test for Sentry initialization
  - Test that Sentry.init is called with correct environment
  - _Requirements: 2.4_

- [x] 2. Create database migration for performance indexes
  - Create new migration file with CONCURRENTLY index creation
  - Add composite index on shifts(user_id, date)
  - Add composite index on leave_requests(user_id, status)
  - Add composite index on leave_requests(status, created_at DESC)
  - Add composite index on swap_requests(status, created_at DESC)
  - Add composite index on comments(request_id, request_type)
  - Add index on users(email)
  - Add composite index on leave_balances(user_id, leave_type)
  - Add index on swap_requests(requester_id, created_at DESC)
  - Add index on swap_requests(target_user_id, created_at DESC)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ]* 2.1 Write unit tests for database index existence
  - Verify all required indexes exist in database schema
  - Verify indexes use CONCURRENTLY flag
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 3. Checkpoint - Verify indexes and error tracking
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement pagination types and utilities
  - Create pagination types (PaginationParams, PaginationMeta, PaginatedResponse)
  - Implement cursor encoding/decoding utilities
  - Create pagination helper functions
  - _Requirements: 1.1, 1.2_

- [ ]* 4.1 Write unit tests for cursor encoding/decoding
  - Test cursor round-trip (encode then decode)
  - Test invalid cursor handling
  - _Requirements: 1.2_

- [ ] 5. Update shiftsService with pagination support
  - [x] 5.1 Add pagination to getShifts method
    - Implement cursor-based query logic
    - Return PaginatedResponse with metadata
    - Maintain backward compatibility (pagination optional)
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ] 5.2 Add pagination to getUserShifts method
    - Implement cursor-based query logic
    - Return PaginatedResponse with metadata
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ]* 5.3 Write property test for paginated shifts response structure
    - **Property 1: Paginated response structure**
    - **Validates: Requirements 1.1, 1.2, 1.4**

- [ ] 6. Update leaveRequestsService with pagination support
  - [ ] 6.1 Add pagination to getLeaveRequests method
    - Implement cursor-based query logic
    - Return PaginatedResponse with metadata
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ] 6.2 Add pagination to getUserLeaveRequests method
    - Implement cursor-based query logic
    - Return PaginatedResponse with metadata
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ] 6.3 Add pagination to getPendingLeaveRequests method
    - Implement cursor-based query logic
    - Return PaginatedResponse with metadata
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ]* 6.4 Write property test for paginated leave requests response structure
    - **Property 1: Paginated response structure**
    - **Validates: Requirements 1.1, 1.2, 1.4**

- [ ] 7. Update swapRequestsService with pagination support
  - [ ] 7.1 Add pagination to getSwapRequests method
    - Implement cursor-based query logic
    - Return PaginatedResponse with metadata
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ] 7.2 Add pagination to getUserSwapRequests method
    - Implement cursor-based query logic
    - Return PaginatedResponse with metadata
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ] 7.3 Add pagination to getPendingSwapRequests method
    - Implement cursor-based query logic
    - Return PaginatedResponse with metadata
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ]* 7.4 Write property test for paginated swap requests response structure
    - **Property 1: Paginated response structure**
    - **Validates: Requirements 1.1, 1.2, 1.4**

- [ ]* 7.5 Write unit test for comments not paginated
  - Verify comments endpoint returns all comments without pagination
  - _Requirements: 1.6_

- [ ] 8. Checkpoint - Verify pagination services
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Create React Query hooks with pagination
  - [ ] 9.1 Create useInfiniteShifts hook
    - Implement useInfiniteQuery with pagination
    - Configure stale time (2 minutes)
    - _Requirements: 1.1, 1.3, 4.3_
  
  - [ ] 9.2 Create useInfiniteLeaveRequests hook
    - Implement useInfiniteQuery with pagination
    - Configure stale time (1 minute)
    - _Requirements: 1.1, 1.3, 4.4_
  
  - [ ] 9.3 Create useInfiniteSwapRequests hook
    - Implement useInfiniteQuery with pagination
    - Configure stale time (1 minute)
    - _Requirements: 1.1, 1.3, 4.4_
  
  - [ ]* 9.4 Write property test for infinite scroll loading
    - **Property 3: Infinite scroll loading**
    - **Validates: Requirements 1.3**

- [x] 10. Update React Query configuration with differentiated stale times
  - Create STALE_TIMES constant with values for each data type
  - Update useSettings hook with 10-minute stale time
  - Update useUserProfile hook with 5-minute stale time
  - Update useLeaveBalances hook with 5-minute stale time
  - Update useEmployees hook with 5-minute stale time
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 10.1 Write unit tests for cache stale times
  - Verify settings cache has 10-minute stale time
  - Verify user profile cache has 5-minute stale time
  - Verify shifts cache has 2-minute stale time
  - Verify requests cache has 1-minute stale time
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 11. Implement cache invalidation strategy
  - [ ] 11.1 Update mutation hooks to invalidate related caches
    - Update createLeaveRequest mutation to invalidate list and balance caches
    - Update updateLeaveRequestStatus mutation to invalidate specific and list caches
    - Update createSwapRequest mutation to invalidate list caches
    - Update updateSwapRequestStatus mutation to invalidate specific and list caches
    - Update createShift mutation to invalidate shifts caches
    - Update updateShift mutation to invalidate specific and list caches
    - _Requirements: 4.5, 4.6_
  
  - [ ]* 11.2 Write property test for cache invalidation cascade
    - **Property 7: Cache invalidation cascade**
    - **Validates: Requirements 4.5, 4.6**
  
  - [ ]* 11.3 Write property test for cache persistence across navigation
    - **Property 8: Cache persistence across navigation**
    - **Validates: Requirements 4.7**

- [ ] 12. Update UI components with pagination
  - [ ] 12.1 Update LeaveRequests.tsx with infinite scroll
    - Replace useLeaveRequests with useInfiniteLeaveRequests
    - Implement "Load More" button or infinite scroll
    - Add loading states for pagination
    - Reset pagination on filter changes
    - _Requirements: 1.1, 1.3, 1.5_
  
  - [ ] 12.2 Update SwapRequests.tsx with infinite scroll
    - Replace useSwapRequests with useInfiniteSwapRequests
    - Implement "Load More" button or infinite scroll
    - Add loading states for pagination
    - Reset pagination on filter changes
    - _Requirements: 1.1, 1.3, 1.5_
  
  - [ ] 12.3 Update Schedule.tsx with infinite scroll
    - Replace useShifts with useInfiniteShifts
    - Implement "Load More" button or infinite scroll
    - Add loading states for pagination
    - Reset pagination on date range changes
    - _Requirements: 1.1, 1.3, 1.5_
  
  - [ ]* 12.4 Write property test for pagination reset on filter change
    - **Property 2: Pagination reset on filter change**
    - **Validates: Requirements 1.5**

- [ ] 13. Checkpoint - Verify pagination UI
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Enhance route-based code splitting
  - [x] 14.1 Update App.tsx with lazy-loaded routes
    - Convert all route components to lazy imports
    - Add Suspense boundaries with loading fallbacks
    - Keep Login component eagerly loaded
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 14.2 Write property test for lazy route loading
    - **Property 9: Lazy route loading**
    - **Validates: Requirements 5.2, 5.3**
  
  - [ ]* 14.3 Write unit test for lazy route loading
    - Verify routes are lazy loaded with React.lazy
    - _Requirements: 5.2_

- [x] 15. Update Vite configuration for bundle optimization
  - Add rollup-plugin-visualizer for bundle analysis
  - Update manualChunks to include Sentry
  - Enable sourcemaps for production
  - Configure bundle size warning limit
  - Add bundle size check to build process
  - _Requirements: 5.4, 5.5, 6.4_

- [ ]* 15.1 Write unit test for bundle size limit
  - Verify main bundle size is under 200 KB gzipped
  - _Requirements: 6.4_

- [ ]* 15.2 Write unit test for vendor chunk splitting
  - Verify build output contains separate chunks for React, Supabase, etc.
  - _Requirements: 5.4_

- [ ] 16. Implement route prefetching
  - [ ] 16.1 Create route prefetching utility
    - Implement prefetch logic based on navigation patterns
    - Add prefetch hints to likely next routes
    - _Requirements: 5.6_
  
  - [ ]* 16.2 Write property test for route prefetching
    - **Property 10: Route prefetching**
    - **Validates: Requirements 5.6**

- [ ] 17. Implement performance monitoring
  - [ ] 17.1 Create PerformanceMonitor class
    - Implement page load time measurement
    - Implement FCP, LCP, TTI measurement
    - Implement slow query detection
    - Implement excessive re-render detection
    - _Requirements: 6.1, 6.2, 6.3, 6.6_
  
  - [ ] 17.2 Integrate performance monitoring with Sentry
    - Send performance metrics to Sentry
    - Configure performance sampling rate
    - _Requirements: 6.5_
  
  - [ ]* 17.3 Write property test for performance metrics capture
    - **Property 11: Performance metrics capture**
    - **Validates: Requirements 6.1, 6.5**
  
  - [ ]* 17.4 Write property test for slow query detection
    - **Property 12: Slow query detection**
    - **Validates: Requirements 6.2, 6.6**
  
  - [ ]* 17.5 Write property test for excessive re-render detection
    - **Property 13: Excessive re-render detection**
    - **Validates: Requirements 6.3, 6.6**

- [ ] 18. Add performance monitoring to critical pages
  - Add performance measurement to Dashboard
  - Add performance measurement to Schedule
  - Add performance measurement to LeaveRequests
  - Add performance measurement to SwapRequests
  - _Requirements: 6.1_

- [ ] 19. Update error boundaries with Sentry integration
  - Update ErrorBoundary component to send errors to Sentry
  - Add error boundaries for pagination components
  - Add error recovery strategies
  - _Requirements: 2.1, 2.2_

- [x] 20. Create environment configuration for Sentry
  - Add VITE_SENTRY_DSN to .env.example
  - Add VITE_SENTRY_ENVIRONMENT to .env.example
  - Update README with Sentry setup instructions
  - _Requirements: 2.4_

- [ ] 21. Deferred tasks from Phase 1 (Critical Data Integrity)
  - [ ] 21.1 Checkpoint - Ensure all tests pass (from Phase 1 Task 4)
    - Ensure all tests pass, ask the user if questions arise.
  
  - [ ] 21.2 Implement swap revoke with atomicity (from Phase 1 Task 7)
    - [ ] 21.2.1 Create revoke stored procedure
      - Add revoke_shift_swap() function to migration
      - Restore all 4 shifts atomically within transaction
      - Validate all 4 shifts exist before restoration
      - _Requirements: Phase 1 - 1.5_
    
    - [ ] 21.2.2 Update handleRevoke in SwapRequestDetail
      - Replace sequential updates with call to revoke stored procedure
      - Handle errors appropriately
      - _Requirements: Phase 1 - 1.5_
    
    - [ ]* 21.2.3 Write property tests for swap revoke
      - **Property 3: Swap Revoke Atomicity**
      - **Validates: Phase 1 Requirements 1.5**
  
  - [ ]* 21.3 Add error message consistency validation (from Phase 1 Task 9)
    - [ ]* 21.3.1 Write property test for error message format
      - **Property 15: Error Message Consistency**
      - **Validates: Phase 1 Requirements 5.3, 6.1**
    
    - [ ]* 21.3.2 Write property test for error details
      - **Property 16: Insufficient Balance Error Details**
      - **Property 17: Overlapping Leave Error Details**
      - **Validates: Phase 1 Requirements 6.4, 6.5**

- [ ] 22. Final checkpoint - Comprehensive testing
  - Run all unit tests and property tests
  - Verify bundle size is under limits
  - Verify all database indexes exist
  - Test pagination on all list pages
  - Test error tracking in production mode
  - Verify performance monitoring is working
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 22. Integration tests for end-to-end flows
  - Test pagination flow (first page, next page, last page)
  - Test error tracking integration with Sentry
  - Test cache invalidation across components
  - Test route lazy loading and code splitting
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 4.5, 5.2_

- [ ]* 23. Property-based tests from Phase 1
  - All optional property tests deferred from Phase 1 Critical Data Integrity tasks
  - See Phase 1 tasks.md for complete list of deferred property tests

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Database indexes should be created with CONCURRENTLY to avoid locking
- Sentry integration requires a Sentry account and project DSN
- Bundle size limits are enforced at build time
- Performance monitoring sends metrics to Sentry for aggregation
