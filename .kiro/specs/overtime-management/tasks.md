# Implementation Plan: Overtime Management System

## Overview

This implementation plan breaks down the Overtime Management System into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to catch errors early. The implementation follows the existing patterns in the WFM application for swap and leave requests, ensuring consistency across the codebase.

## Tasks

- [x] 1. Set up database schema and migrations
  - Create migration file `supabase/migrations/016_overtime_management.sql`
  - Define `overtime_requests` table with all fields and constraints
  - Define `overtime_settings` table with default settings
  - Create indexes for performance optimization
  - Create RLS policies for role-based access control
  - Create database trigger for auto-approve logic
  - Update `comments` table constraint to include 'overtime_request' reference type
  - _Requirements: 1.1, 1.8, 1.9, 4.1, 4.2, 4.3, 7.1, 7.2, 8.1, 11.1_

- [x] 2. Create TypeScript types and interfaces
  - [x] 2.1 Define overtime types in `src/types/overtime.ts`
    - Create `OvertimeType`, `OvertimeStatus`, `ApprovalDecision` types
    - Create `OvertimeRequest` interface
    - Create `OvertimeSettings` interface
    - Create `CreateOvertimeRequestInput` interface
    - Create `OvertimeRequestFilters` interface
    - Create `OvertimeStatistics` and related interfaces
    - Create `OvertimeCSVRow` interface
    - _Requirements: 1.1, 4.4, 11.1, 12.1, 13.2_

  - [ ]* 2.2 Write property test for type definitions
    - **Property 10: Request Data Completeness**
    - **Validates: Requirements 4.4, 6.1**

- [x] 3. Implement overtime settings service
  - [x] 3.1 Create `src/services/overtimeSettingsService.ts`
    - Implement `getOvertimeSettings()` function
    - Implement `updateOvertimeSetting(key, value)` function
    - Add error handling and validation
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 3.2 Write property test for settings service
    - **Property 23: Settings Retrieval Completeness**
    - **Property 24: Settings Update Persistence**
    - **Property 26: Settings Validation**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.7, 11.8, 11.9**

  - [ ]* 3.3 Write unit tests for settings service
    - Test specific settings update scenarios
    - Test validation error cases
    - _Requirements: 11.7, 11.8, 11.9_

- [x] 4. Implement validation utilities
  - [x] 4.1 Create `src/utils/overtimeValidation.ts`
    - Implement `validateOvertimeRequest()` function
    - Implement `calculateHours()` helper function
    - Implement `checkDailyLimit()` function
    - Implement `checkWeeklyLimit()` function
    - Implement `checkOverlap()` function
    - Implement `timesOverlap()` helper function
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.7, 14.1, 14.3_

  - [ ]* 4.2 Write property test for hours calculation
    - **Property 2: Hours Calculation**
    - **Validates: Requirements 1.2**

  - [ ]* 4.3 Write property test for validation rules
    - **Property 1: Request Validation**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6, 1.7**

  - [ ]* 4.4 Write property test for daily limit enforcement
    - **Property 5: Daily Limit Enforcement**
    - **Validates: Requirements 2.1, 2.3**

  - [ ]* 4.5 Write property test for weekly limit enforcement
    - **Property 6: Weekly Limit Enforcement**
    - **Validates: Requirements 2.2, 2.4, 2.7**

  - [ ]* 4.6 Write property test for overlap detection
    - **Property 36: Overlap Detection**
    - **Validates: Requirements 14.1, 14.3**

  - [ ]* 4.7 Write unit tests for validation edge cases
    - Test boundary conditions (exactly at limits)
    - Test time boundary cases (midnight, etc.)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 5. Implement overtime requests service
  - [x] 5.1 Create `src/services/overtimeRequestsService.ts`
    - Implement `createOvertimeRequest()` function
    - Implement `getOvertimeRequests()` function with filtering and pagination
    - Implement `getOvertimeRequestById()` function
    - Implement `approveOvertimeRequest()` function
    - Implement `rejectOvertimeRequest()` function
    - Implement `cancelOvertimeRequest()` function
    - Add error handling and authorization checks
    - _Requirements: 1.1, 1.8, 4.1, 4.2, 4.3, 4.7, 5.1, 5.2, 5.3, 5.4, 6.1, 7.3, 7.4, 7.5, 7.6, 7.7, 9.2_

  - [ ]* 5.2 Write property test for initial status assignment
    - **Property 3: Initial Status Assignment**
    - **Validates: Requirements 1.8**

  - [ ]* 5.3 Write property test for duplicate prevention
    - **Property 4: Duplicate Prevention**
    - **Validates: Requirements 1.9**

  - [ ]* 5.4 Write property test for role-based access control
    - **Property 9: Role-Based Access Control**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ]* 5.5 Write property test for pagination
    - **Property 12: Pagination Limit**
    - **Validates: Requirements 4.7**

  - [ ]* 5.6 Write property test for filter application
    - **Property 13: Filter Application**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [ ]* 5.7 Write property test for state transitions
    - **Property 16: State Transition Correctness**
    - **Validates: Requirements 7.3, 7.4, 7.5, 9.2**

  - [ ]* 5.8 Write property test for approval requires notes
    - **Property 17: Approval Requires Notes**
    - **Validates: Requirements 7.6**

  - [ ]* 5.9 Write property test for approval metadata recording
    - **Property 18: Approval Metadata Recording**
    - **Validates: Requirements 7.7**

  - [ ]* 5.10 Write unit tests for service methods
    - Test specific approval workflows
    - Test error conditions
    - _Requirements: 7.3, 7.4, 7.5, 9.2_

- [~] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 7. Implement React hooks for overtime requests
  - [x] 7.1 Create `src/hooks/useOvertimeRequests.ts`
    - Implement `useOvertimeRequests(filters)` hook using React Query
    - Implement `useOvertimeRequest(id)` hook
    - Implement `useCreateOvertimeRequest()` mutation hook
    - Implement `useApproveOvertimeRequest()` mutation hook
    - Implement `useRejectOvertimeRequest()` mutation hook
    - Implement `useCancelOvertimeRequest()` mutation hook
    - Configure cache invalidation on mutations
    - _Requirements: 1.1, 4.1, 4.2, 4.3, 6.1, 7.3, 7.4, 7.5, 9.2_

  - [x] 7.2 Create `src/hooks/useOvertimeSettings.ts`
    - Implement `useOvertimeSettings()` hook
    - Implement `useUpdateOvertimeSetting()` mutation hook
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [~] 8. Create overtime request submission form
  - [x] 8.1 Create `src/pages/OvertimeRequests/CreateOvertimeRequest.tsx`
    - Build form with date picker, time inputs, overtime type radio buttons, and reason textarea
    - Implement client-side validation using validation utilities
    - Display calculated total hours
    - Display shift information if available
    - Display validation errors and warnings
    - Handle form submission with loading and error states
    - Navigate to list page on success
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.10, 2.5, 2.6_

  - [ ]* 8.2 Write unit tests for form component
    - Test form validation
    - Test submission flow
    - Test error handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [~] 9. Create overtime request card component
  - [x] 9.1 Create `src/components/OvertimeRequests/OvertimeRequestCard.tsx`
    - Display work date with calendar icon
    - Display overtime type badge (Regular/Double)
    - Display total hours
    - Display status badge using design system colors
    - Display reason (truncated)
    - Display time range
    - Display approval info for approved/rejected requests
    - Handle click to navigate to detail page
    - _Requirements: 4.4, 4.5_

  - [ ]* 9.2 Write unit tests for card component
    - Test rendering with different request states
    - Test click handling
    - _Requirements: 4.4, 4.5_

- [~] 10. Create overtime requests list page
  - [x] 10.1 Create `src/pages/OvertimeRequests/OvertimeRequests.tsx`
    - Display list of overtime request cards
    - Implement status filter dropdown
    - Implement date range filter (This Week, Last 30 Days, Custom)
    - Implement agent search filter (TL/WFM only)
    - Implement department filter
    - Implement pagination using existing Pagination component
    - Display loading skeletons
    - Display empty state when no requests
    - Add "New Request" button
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.6_

  - [ ]* 10.2 Write unit tests for list page
    - Test filtering behavior
    - Test pagination
    - Test role-based display
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4_

- [~] 11. Create approval timeline component
  - [x] 11.1 Create `src/components/OvertimeRequests/ApprovalTimeline.tsx`
    - Display submission stage (always shown)
    - Display TL approval stage (pending/completed)
    - Display WFM approval stage (pending/completed/skipped)
    - Use visual indicators for completed/pending stages
    - Display reviewer names and timestamps
    - Display approval/rejection notes
    - _Requirements: 6.2, 6.4, 6.5_

  - [ ]* 11.2 Write unit tests for timeline component
    - Test rendering for different approval states
    - Test auto-approve scenario display
    - _Requirements: 6.2, 6.4_

- [~] 12. Create overtime request detail page
  - [x] 12.1 Create `src/pages/OvertimeRequests/OvertimeRequestDetail.tsx`
    - Display request details card with all information
    - Display ApprovalTimeline component
    - Display action buttons (Approve/Reject/Cancel) based on role and status
    - Implement approve modal with notes input
    - Implement reject modal with notes input
    - Implement cancel confirmation
    - Display comments thread using existing comments component
    - Add comment input field
    - Handle all actions with loading and error states
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.1, 9.5, 10.1, 10.2_

  - [ ]* 12.2 Write property test for comment chronological ordering
    - **Property 14: Comment Chronological Ordering**
    - **Validates: Requirements 6.3**

  - [ ]* 12.3 Write unit tests for detail page
    - Test action button visibility
    - Test approval/rejection flow
    - Test cancel flow
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1_

- [~] 13. Implement system comment generation
  - [-] 13.1 Update overtime requests service to create system comments
    - Add system comment on approval
    - Add system comment on rejection
    - Add system comment on cancellation
    - Add system comment on auto-approval
    - _Requirements: 7.8, 8.3, 9.4_

  - [ ]* 13.2 Write property test for approval system comment
    - **Property 19: Approval System Comment**
    - **Validates: Requirements 7.8**

  - [ ]* 13.3 Write property test for auto-approve workflow
    - **Property 20: Auto-Approve Workflow**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [ ]* 13.4 Write property test for cancellation metadata
    - **Property 21: Cancellation Metadata**
    - **Validates: Requirements 9.3, 9.4**

  - [ ]* 13.5 Write property test for comment data recording
    - **Property 22: Comment Data Recording**
    - **Validates: Requirements 10.2**

- [~] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [~] 15. Create overtime settings panel
  - [~] 15.1 Create `src/components/Settings/OvertimeSettings.tsx`
    - Display auto-approve toggle
    - Display daily limits inputs (regular/double)
    - Display weekly limits inputs (regular/double)
    - Display shift verification toggle
    - Display submission deadline input
    - Display pay multipliers inputs (regular/double)
    - Implement validation for positive numbers
    - Handle settings updates with loading and error states
    - Display success toast on save
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_

  - [~] 15.2 Integrate overtime settings into Settings page
    - Add "Overtime Settings" section to `src/pages/Settings.tsx`
    - Restrict access to WFM role only
    - _Requirements: 11.1_

  - [ ]* 15.3 Write property test for settings update audit
    - **Property 25: Settings Update Audit**
    - **Validates: Requirements 11.6**

  - [ ]* 15.4 Write unit tests for settings panel
    - Test validation behavior
    - Test save functionality
    - _Requirements: 11.7, 11.8, 11.9_

- [~] 16. Implement overtime statistics service
  - [~] 16.1 Add statistics methods to `src/services/overtimeRequestsService.ts`
    - Implement `getOvertimeStatistics(filters)` function
    - Calculate summary statistics (total, approved, rejected, pending, approval rate)
    - Calculate hours breakdown (total, regular, double, equivalent)
    - Calculate top agents by overtime hours
    - Calculate overtime by type
    - Calculate weekly trend data
    - Apply date range and department filters
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.8, 12.9_

  - [ ]* 16.2 Write property test for statistics calculation
    - **Property 27: Statistics Calculation Correctness**
    - **Validates: Requirements 12.1, 12.2, 12.3**

  - [ ]* 16.3 Write property test for top agents ranking
    - **Property 28: Top Agents Ranking**
    - **Validates: Requirements 12.4**

  - [ ]* 16.4 Write property test for statistics filtering
    - **Property 29: Statistics Filtering**
    - **Validates: Requirements 12.8, 12.9**

  - [ ]* 16.5 Write unit tests for statistics calculations
    - Test specific calculation scenarios
    - Test edge cases (no data, single request)
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [~] 17. Create overtime statistics component
  - [~] 17.1 Create `src/components/OvertimeRequests/OvertimeStatistics.tsx`
    - Display summary card (total requests, approval rate)
    - Display hours breakdown (regular, double, equivalent)
    - Display top 5 agents table
    - Display bar chart (overtime by agent) using existing chart library
    - Display pie chart (regular vs double distribution)
    - Display line chart (weekly trend)
    - Add export CSV button
    - Handle loading and error states
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [ ]* 17.2 Write unit tests for statistics component
    - Test rendering with different data
    - Test empty state
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [~] 18. Integrate overtime statistics into Reports page
  - [~] 18.1 Update `src/pages/Reports.tsx`
    - Add "Overtime" tab or section
    - Display OvertimeStatistics component
    - Apply date range filter from Reports page
    - Apply department filter from Reports page
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [~] 19. Implement CSV export functionality
  - [~] 19.1 Create `src/utils/overtimeCsvHelpers.ts`
    - Implement `generateOvertimeCSV(requests, settings)` function
    - Format CSV with all required columns
    - Calculate equivalent hours for each row
    - Sort by employee name, then date
    - Generate filename with date range
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.9_

  - [~] 19.2 Add export method to overtime requests service
    - Implement `exportOvertimeCSV(filters)` function
    - Query approved requests with filters
    - Generate CSV using helper function
    - Return CSV string for download
    - _Requirements: 13.1, 13.7, 13.8_

  - [ ]* 19.3 Write property test for CSV export status filter
    - **Property 30: CSV Export Status Filter**
    - **Validates: Requirements 13.1**

  - [ ]* 19.4 Write property test for CSV data completeness
    - **Property 31: CSV Export Data Completeness**
    - **Validates: Requirements 13.2, 13.3, 13.4**

  - [ ]* 19.5 Write property test for equivalent hours calculation
    - **Property 32: Equivalent Hours Calculation**
    - **Validates: Requirements 13.5**

  - [ ]* 19.6 Write property test for CSV sorting
    - **Property 33: CSV Export Sorting**
    - **Validates: Requirements 13.6**

  - [ ]* 19.7 Write property test for CSV filtering
    - **Property 34: CSV Export Filtering**
    - **Validates: Requirements 13.7, 13.8**

  - [ ]* 19.8 Write property test for CSV filename format
    - **Property 35: CSV Filename Format**
    - **Validates: Requirements 13.9**

  - [ ]* 19.9 Write unit tests for CSV export
    - Test specific export scenarios
    - Test CSV format correctness
    - _Requirements: 13.2, 13.3, 13.4, 13.5, 13.6_

- [~] 20. Implement shift verification integration
  - [~] 20.1 Update validation utilities to check shift schedule
    - Query shifts table for agent's shift on work date
    - Display shift information in validation warnings
    - Check if overtime is outside shift hours
    - Respect shift verification setting
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 20.2 Write property test for shift verification
    - **Property 7: Shift Verification**
    - **Validates: Requirements 3.1**

  - [ ]* 20.3 Write property test for shift verification bypass
    - **Property 8: Shift Verification Bypass**
    - **Validates: Requirements 3.5**

  - [ ]* 20.4 Write unit tests for shift verification
    - Test with various shift types
    - Test with no shift
    - Test with setting enabled/disabled
    - _Requirements: 3.1, 3.5_

- [~] 21. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [~] 22. Add routing and navigation
  - [x] 22.1 Update application routing
    - Add route for `/overtime-requests` (list page)
    - Add route for `/overtime-requests/new` (create form)
    - Add route for `/overtime-requests/:id` (detail page)
    - Add navigation menu item for "Overtime Requests"
    - Protect routes with role-based access control
    - _Requirements: 4.1, 4.2, 4.3_

- [~] 23. Implement mobile responsiveness
  - [~] 23.1 Add responsive styles to overtime components
    - Make forms stack vertically on mobile
    - Make request cards stack vertically on mobile
    - Make date pickers touch-friendly
    - Ensure buttons have minimum 44px touch targets
    - Scale charts to fit mobile screens
    - Test on various screen sizes
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [ ]* 23.2 Manual testing on mobile devices
    - Test on actual mobile devices
    - Test touch interactions
    - Test form inputs
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [~] 24. Add loading states and error handling
  - [~] 24.1 Implement loading skeletons
    - Add skeleton for request list
    - Add skeleton for request detail
    - Add skeleton for statistics
    - Use existing Skeleton component
    - _Requirements: 4.1, 6.1, 12.1_

  - [~] 24.2 Implement error states
    - Add error boundaries for overtime pages
    - Display user-friendly error messages
    - Add retry functionality
    - Log errors for monitoring
    - _Requirements: 4.1, 6.1, 12.1_

- [~] 25. Add success notifications
  - [~] 25.1 Implement toast notifications
    - Show success toast on request submission
    - Show success toast on approval/rejection
    - Show success toast on cancellation
    - Show success toast on settings update
    - Use existing Toast component
    - _Requirements: 1.8, 7.3, 7.4, 7.5, 9.2, 11.2_

- [~] 26. Write integration tests
  - [ ]* 26.1 Write end-to-end workflow tests
    - Test complete submission and approval workflow
    - Test auto-approve workflow
    - Test rejection workflow
    - Test cancellation workflow
    - Test settings changes affecting validation
    - _Requirements: 1.1, 7.3, 7.4, 7.5, 8.1, 9.2, 11.2_

  - [ ]* 26.2 Write RLS policy tests
    - Test agent can only see own requests
    - Test TL can see team requests
    - Test WFM can see all requests
    - Test approval permissions
    - _Requirements: 4.1, 4.2, 4.3, 7.1, 7.2_

- [~] 27. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [~] 28. Documentation and polish
  - [~] 28.1 Add inline code documentation
    - Document complex validation logic
    - Document state transition rules
    - Document calculation formulas
    - _Requirements: All_

  - [~] 28.2 Update user-facing documentation
    - Document overtime submission process
    - Document approval workflow
    - Document settings configuration
    - Document CSV export format
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end workflows
- The implementation reuses existing patterns from swap and leave request systems
- All property tests should run minimum 100 iterations
- Property tests use fast-check library for TypeScript
