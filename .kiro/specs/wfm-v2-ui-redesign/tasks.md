# Implementation Plan: WFM v2 UI Redesign

## Overview

This implementation plan breaks down the WFM v2 UI redesign into incremental, testable tasks. The approach follows a phased rollout strategy, starting with foundational components and building up to complete page redesigns. Each task builds on previous work and includes testing to ensure correctness and prevent regressions.

## Tasks

- [x] 1. Update design system constants and create shared badge components
  - Update `src/lib/designSystem.ts` with new color constants for stat cards, badges, and coverage levels
  - Create `src/components/TypeBadge.tsx` component for request type indicators
  - Create `src/components/StatusBadge.tsx` component (enhance existing or create new) with updated color mappings
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4_

- [ ]* 1.1 Write property tests for badge components
  - **Property 14: Status Badge Color Mapping**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
  - **Property 15: Type Badge Color Mapping**
  - **Validates: Requirements 10.1, 10.2**
  - **Property 16: Type Badge Consistency**
  - **Validates: Requirements 10.4**

- [ ]* 1.2 Write unit tests for badge components
  - Test badge rendering with different statuses and types
  - Test edge cases (unknown status, missing props)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2_

- [x] 2. Redesign Layout component with fixed sidebar
  - Remove sidebar collapse/expand functionality from `src/components/Layout.tsx`
  - Remove `sidebarCollapsed` state and localStorage persistence
  - Change sidebar width to fixed `w-64` (remove dynamic w-20/w-48)
  - Update main content margin to fixed `ml-64`
  - Create bottom section in sidebar for user controls
  - Move user profile (avatar, name, role badge) to sidebar bottom
  - Move dark mode toggle to sidebar bottom
  - Move sign out button to sidebar bottom
  - Preserve all existing navigation items and ordering
  - Update mobile sidebar to maintain overlay behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ]* 2.1 Write unit tests for Layout component
  - Test sidebar structure and fixed width
  - Test bottom section contains user profile, dark mode toggle, sign out
  - Test all navigation items are present and in correct order
  - Test mobile responsive behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 15.1_

- [x] 3. Create StatCard component for dashboard metrics
  - Create `src/components/StatCard.tsx` with icon, title, value, and colored background
  - Implement responsive grid layout support
  - Add optional onClick handler for navigation
  - Add hover effects for interactive cards
  - _Requirements: 2.1, 2.2, 2.6, 2.7_

- [ ]* 3.1 Write unit tests for StatCard component
  - Test rendering with different props
  - Test icon and background color application
  - Test onClick behavior
  - Test responsive layout classes
  - _Requirements: 2.6, 2.7_

- [x] 4. Create dashboard statistics hook and update Dashboard page
  - Create `src/hooks/useDashboardStats.ts` to calculate Total Staff, Active Shifts, Pending Requests, Open Swaps
  - Update `src/pages/Dashboard.tsx` to use StatCard components
  - Implement four stat cards at top of dashboard
  - Add navigation on stat card clicks (e.g., Pending Requests → Leave Requests page)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 4.1 Write property tests for dashboard statistics calculations
  - **Property 1: Active Shifts Calculation**
  - **Validates: Requirements 2.3**
  - **Property 2: Pending Requests Calculation**
  - **Validates: Requirements 2.4**
  - **Property 3: Open Swaps Calculation**
  - **Validates: Requirements 2.5**
  - **Property 24: Statistics Calculation Accuracy**
  - **Validates: Requirements 18.4**

- [ ]* 4.2 Write unit tests for dashboard stat cards
  - Test stat card rendering with mock data
  - Test navigation on card clicks
  - Test loading states
  - Test empty states (zero values)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Create CoverageChart component for weekly staffing visualization
  - Create `src/components/CoverageChart.tsx` with bar chart display
  - Implement color coding for coverage levels (adequate=green, low=yellow, critical=red)
  - Add responsive design with horizontal scrolling on mobile
  - Display day labels (Mon-Sun) and coverage counts
  - _Requirements: 4.2, 4.4_

- [ ]* 5.1 Write property tests for coverage calculations
  - **Property 7: Coverage Calculation**
  - **Validates: Requirements 4.3**
  - **Property 8: Coverage Level Classification**
  - **Validates: Requirements 4.4**

- [ ]* 5.2 Write unit tests for CoverageChart component
  - Test chart rendering with different data sets
  - Test color coding for different coverage levels
  - Test responsive behavior
  - Test empty state (no data)
  - _Requirements: 4.2, 4.4_

- [x] 6. Create coverage data hook and add Coverage Overview to Dashboard
  - Create `src/hooks/useCoverageData.ts` to calculate weekly coverage
  - Update `src/pages/Dashboard.tsx` to include Coverage Overview section
  - Show coverage chart only for TL and WFM roles
  - Calculate net coverage (shifts minus approved leaves) for each day
  - _Requirements: 4.1, 4.3, 4.5_

- [ ]* 6.1 Write unit tests for coverage data hook
  - Test coverage calculation with various shift and leave combinations
  - Test role-based visibility
  - Test week boundary handling
  - _Requirements: 4.1, 4.3_

- [x] 7. Update Dashboard Recent Requests section
  - Update `src/pages/Dashboard.tsx` to merge swap and leave requests
  - Display unified list with TypeBadge and StatusBadge
  - Show requester name, type, status, and type-specific details
  - Limit to 10 most recent requests
  - Add click navigation to detail pages
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ]* 7.1 Write property tests for recent requests
  - **Property 4: Request List Merging**
  - **Validates: Requirements 3.2, 8.2**
  - **Property 5: Request Rendering Completeness**
  - **Validates: Requirements 3.3, 3.4, 3.5, 3.6, 3.7, 8.3, 8.4, 8.5, 8.6**
  - **Property 6: Recent Requests Limit**
  - **Validates: Requirements 3.8**

- [ ]* 7.2 Write unit tests for recent requests section
  - Test request merging and sorting
  - Test badge rendering
  - Test click navigation
  - Test empty state
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create ViewToggle component for schedule view switching
  - Create `src/components/ViewToggle.tsx` with Weekly/Monthly options
  - Implement segmented control design
  - Add active state styling
  - _Requirements: 5.1_

- [ ]* 9.1 Write unit tests for ViewToggle component
  - Test rendering both options
  - Test active state styling
  - Test onChange callback
  - _Requirements: 5.1_

- [x] 10. Create schedule view state hook
  - Create `src/hooks/useScheduleView.ts` to manage view state
  - Implement localStorage persistence for view preference
  - Default to "Monthly" view if no preference stored
  - Handle localStorage access failures gracefully
  - _Requirements: 5.4, 5.5, 5.6_

- [ ]* 10.1 Write property tests for schedule view persistence
  - **Property 9: Schedule View Persistence**
  - **Validates: Requirements 5.4, 5.5**

- [ ]* 10.2 Write unit tests for schedule view hook
  - Test default to monthly view
  - Test localStorage save and restore
  - Test localStorage failure handling
  - _Requirements: 5.4, 5.5, 5.6_

- [x] 11. Update Schedule page with view toggle and weekly view
  - Update `src/pages/Schedule/Schedule.tsx` to include ViewToggle component
  - Implement weekly view showing 7-day grid for current week
  - Add week navigation (previous/next week) for weekly view
  - Maintain existing monthly view functionality
  - Preserve all existing schedule editing capabilities
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 11.1 Write unit tests for schedule view switching
  - Test weekly view displays 7 days
  - Test monthly view displays full month
  - Test view toggle interaction
  - Test week navigation
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 12. Add Team and Agent filters to Schedule page
  - Add Team filter dropdown to `src/pages/Schedule/Schedule.tsx` (visible for TL/WFM only)
  - Add Agent filter dropdown (visible for TL/WFM only)
  - Implement team filtering logic
  - Implement agent filtering logic
  - Preserve existing "All Agents" filter
  - Maintain schedule editing capabilities when filters are applied
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ]* 12.1 Write property tests for schedule filtering
  - **Property 10: Team Filter Correctness**
  - **Validates: Requirements 6.3**
  - **Property 11: Agent Filter Correctness**
  - **Validates: Requirements 6.4**

- [ ]* 12.2 Write unit tests for schedule filters
  - Test filter visibility based on role
  - Test team filter functionality
  - Test agent filter functionality
  - Test "All Agents" option
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 13. Update Schedule shift cell styling
  - Update shift cell rendering in `src/pages/Schedule/Schedule.tsx`
  - Display shift type name (Morning, Day, Evening, Night)
  - Display time range in 24-hour format (HH:MM - HH:MM)
  - Apply color coding: Morning=light blue, Day=blue, Evening=purple, Night=dark
  - Ensure text readability against background colors
  - Preserve existing shift editing functionality
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [ ]* 13.1 Write property tests for shift cell rendering
  - **Property 12: Shift Cell Rendering**
  - **Validates: Requirements 7.1, 7.2**
  - **Property 13: Shift Color Mapping**
  - **Validates: Requirements 7.3, 7.4, 7.5, 7.6**

- [ ]* 13.2 Write unit tests for shift cells
  - Test shift type name display
  - Test time range formatting
  - Test color application for each shift type
  - Test text contrast
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Create RequestTable component for unified request display
  - Create `src/components/RequestTable.tsx` with columns: Requester, Type, Details, Status, Actions
  - Display requester avatar and name
  - Display TypeBadge for request type
  - Display type-specific details (target user for swaps, date range for leave)
  - Display StatusBadge with color coding
  - Implement conditional action buttons based on permissions
  - Add row click handler for navigation to detail pages
  - Implement responsive card layout for mobile
  - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 15.4_

- [ ]* 15.1 Write property tests for request table
  - **Property 17: Action Button Visibility for Managers**
  - **Validates: Requirements 11.1**
  - **Property 18: Revoke Button Visibility for Requesters**
  - **Validates: Requirements 11.2**

- [ ]* 15.2 Write unit tests for RequestTable component
  - Test table rendering with mixed request types
  - Test action button visibility based on role and status
  - Test row click navigation
  - Test responsive card layout
  - Test empty state
  - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 15.4_

- [x] 16. Create unified Request Management page
  - Create `src/pages/RequestManagement.tsx` with RequestTable component
  - Fetch and merge swap and leave requests
  - Implement filters for both request types (date range, status, leave type)
  - Add action handlers (Approve, Reject, Revoke)
  - Add route to `src/App.tsx`
  - Add navigation item to sidebar
  - Preserve existing detail page navigation
  - _Requirements: 8.1, 8.2, 8.9, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ]* 16.1 Write unit tests for Request Management page
  - Test request fetching and merging
  - Test filter functionality
  - Test action button handlers
  - Test error handling
  - Test loading states
  - _Requirements: 8.1, 8.2, 8.9, 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 17. Update Swap Requests page styling
  - Update `src/pages/SwapRequests/SwapRequests.tsx` to use RequestTable component or match its styling
  - Preserve all existing detail page functionality
  - Preserve all existing filter functionality
  - Preserve all existing approval workflow logic
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ]* 17.1 Write unit tests for updated Swap Requests page
  - Test table styling consistency
  - Test existing functionality preservation
  - Test filters still work
  - Test navigation to detail pages
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 18. Update Leave Requests page styling
  - Update `src/pages/LeaveRequests/LeaveRequests.tsx` to use RequestTable component or match its styling
  - Preserve all existing detail page functionality
  - Preserve all existing filter functionality
  - Preserve all existing approval workflow logic
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ]* 18.1 Write unit tests for updated Leave Requests page
  - Test table styling consistency
  - Test existing functionality preservation
  - Test filters still work
  - Test navigation to detail pages
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Create EmployeeEditModal component
  - Create `src/components/EmployeeEditModal.tsx` with modal overlay and backdrop
  - Display form with all editable employee fields (name, email, role, team, etc.)
  - Implement form validation according to existing rules
  - Add Save and Cancel buttons
  - Handle loading state during save operation
  - Display error messages within modal
  - Close modal on backdrop click or Cancel button
  - Close modal and refresh list on successful save
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

- [ ]* 20.1 Write property tests for employee edit modal
  - **Property 25: Employee Form Field Completeness**
  - **Validates: Requirements 19.2**
  - **Property 26: Employee Form Validation**
  - **Validates: Requirements 19.3**

- [ ]* 20.2 Write unit tests for EmployeeEditModal component
  - Test modal open/close behavior
  - Test form field rendering
  - Test validation error display
  - Test save button disabled during loading
  - Test cancel and backdrop click behavior
  - _Requirements: 19.1, 19.2, 19.3, 19.6_

- [x] 21. Update Headcount page with employee edit modal
  - Update `src/pages/Headcount/EmployeeDirectory.tsx` to integrate EmployeeEditModal
  - Add edit action buttons/icons to employee list
  - Handle modal open/close state
  - Implement save handler to update employee records
  - Refresh employee list after successful save
  - Update page styling to match WFM v2 design aesthetic
  - Preserve all existing employee directory functionality
  - Preserve all existing employee detail page functionality
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 19.1, 19.4, 19.5_

- [ ]* 21.1 Write unit tests for updated Headcount page
  - Test edit button triggers modal
  - Test modal integration
  - Test employee list refresh after save
  - Test existing functionality preservation
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 19.1, 19.4, 19.5_

- [x] 22. Implement responsive design refinements
  - Update Layout component for mobile sidebar overlay (already done in task 2, verify)
  - Verify StatCard stacking on mobile (grid-cols-1 on small screens)
  - Verify Schedule page horizontal scrolling on mobile
  - Verify RequestTable card layout on mobile
  - Test all interactive elements on touch devices
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ]* 22.1 Write unit tests for responsive behavior
  - Test mobile sidebar overlay classes
  - Test stat card grid responsiveness
  - Test schedule table overflow classes
  - Test request table card layout on mobile
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 23. Implement accessibility improvements
  - Add keyboard navigation support to all interactive elements
  - Add ARIA labels to all custom components (StatCard, TypeBadge, StatusBadge, ViewToggle, CoverageChart, EmployeeEditModal)
  - Verify text contrast ratios meet 4.5:1 minimum
  - Verify badge contrast ratios meet 4.5:1 minimum
  - Add visible focus indicators to all interactive elements
  - Test with keyboard-only navigation
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ]* 23.1 Write property tests for accessibility
  - **Property 19: Keyboard Navigation Completeness**
  - **Validates: Requirements 17.1**
  - **Property 20: ARIA Label Presence**
  - **Validates: Requirements 17.2**
  - **Property 21: Text Contrast Ratio**
  - **Validates: Requirements 17.3**
  - **Property 22: Badge Contrast Ratio**
  - **Validates: Requirements 17.4**
  - **Property 23: Focus Indicator Presence**
  - **Validates: Requirements 17.5**

- [ ]* 23.2 Write unit tests for accessibility features
  - Test tabIndex on interactive elements
  - Test ARIA labels on custom components
  - Test focus indicator styles
  - _Requirements: 17.1, 17.2, 17.5_

- [x] 24. Verify data integrity and API compatibility
  - Verify no database schema changes were introduced
  - Verify all existing API endpoints still work
  - Test request status updates maintain referential integrity
  - Test statistics calculations match database counts
  - Run full regression test suite
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ]* 24.1 Write integration tests for data integrity
  - Test API endpoint compatibility
  - Test database query correctness
  - Test statistics calculation accuracy
  - _Requirements: 18.1, 18.2, 18.4_

- [x] 25. Final checkpoint and polish
  - Run all unit tests and property tests
  - Run accessibility audit (axe-core or similar)
  - Test on all supported browsers
  - Test on mobile devices
  - Fix any remaining bugs or styling issues
  - Update documentation if needed
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a phased approach: Foundation → Dashboard → Schedule → Requests → Employee Management → Polish
- All existing functionality must be preserved throughout the redesign
- Mobile responsiveness and accessibility are critical requirements
