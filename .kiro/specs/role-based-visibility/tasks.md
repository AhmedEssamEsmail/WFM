# Implementation Plan: Role-Based Visibility Controls

## Overview

This implementation plan breaks down the role-based visibility feature into discrete coding tasks. The approach follows a layered implementation strategy: first building the foundational authorization utilities, then updating route protection, then implementing component-level visibility, and finally adding comprehensive testing.

## Tasks

- [x] 1. Create useRoleCheck hook for component-level authorization
  - Create `src/hooks/useRoleCheck.ts` file
  - Implement `hasRole`, `hasAnyRole`, `hasAllRoles` utility functions
  - Implement convenience boolean properties: `isManager`, `isAgent`, `isWFM`, `isTL`
  - Add error handling for usage outside AuthContext
  - Use React.useMemo to optimize role checks
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [ ]* 1.1 Write property test for useRoleCheck hook
  - **Property 3: Manager-Visible Dashboard Cards Are Hidden from Agents**
  - **Property 4: Manager-Visible Dashboard Cards Are Shown to Managers**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12**

- [ ]* 1.2 Write unit tests for useRoleCheck hook
  - Test each role-checking function with different role combinations
  - Test error handling when used outside AuthContext
  - Test convenience boolean properties
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [x] 2. Update route protection for /requests page
  - Modify `/requests` route in `src/App.tsx` to require `['wfm']` role
  - Verify ProtectedRoute component handles the role restriction correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 2.1 Write property test for /requests route protection
  - **Property 1: Unauthorized Route Access Redirects to Dashboard**
  - **Property 2: Unauthorized Access Attempts Are Logged**
  - **Validates: Requirements 1.2, 1.3, 1.4, 2.4, 6.1, 6.2**

- [ ]* 2.2 Write unit tests for /requests route protection
  - Test that wfm role can access /requests
  - Test that agent role is redirected from /requests
  - Test that tl role is redirected from /requests
  - Test that unauthorized access is logged
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Update route protection for /swap-requests page
  - Modify `/swap-requests` route in `src/App.tsx` to require `['agent', 'tl']` roles
  - Verify ProtectedRoute component handles the role restriction correctly
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 3.1 Write property test for /swap-requests route protection
  - **Property 1: Unauthorized Route Access Redirects to Dashboard**
  - **Property 2: Unauthorized Access Attempts Are Logged**
  - **Validates: Requirements 1.2, 1.3, 2.3, 2.4, 6.1, 6.2**

- [ ]* 3.2 Write unit tests for /swap-requests route protection
  - Test that agent role can access /swap-requests
  - Test that tl role can access /swap-requests
  - Test that wfm role is redirected from /swap-requests
  - Test that unauthorized access is logged
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Update navigation menu configuration
  - Modify `NAV_ITEMS` in `src/hooks/useNavigation.ts`
  - Change "Requests" item roles to `['wfm']`
  - Change "Swap Requests" item roles to `['agent', 'tl']`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 4.1 Write property test for navigation filtering
  - **Property 5: Navigation Items Match User Role Permissions**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [ ]* 4.2 Write unit tests for navigation menu filtering
  - Test that agent sees "Swap Requests" but not "Requests"
  - Test that tl sees "Swap Requests" but not "Requests"
  - Test that wfm sees "Requests" but not "Swap Requests"
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Checkpoint - Ensure route protection and navigation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update Dashboard component for conditional card rendering
  - Import and use `useRoleCheck` hook in `src/pages/Dashboard.tsx`
  - Wrap statistics cards grid with `{isManager && ...}` conditional
  - Ensure all four stat cards (Total Staff, Active Shifts, Pending Requests, Open Swaps) are within the conditional
  - Preserve existing loading skeleton behavior
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_

- [ ]* 6.1 Write property test for dashboard card visibility
  - **Property 3: Manager-Visible Dashboard Cards Are Hidden from Agents**
  - **Property 4: Manager-Visible Dashboard Cards Are Shown to Managers**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12**

- [ ]* 6.2 Write unit tests for dashboard card visibility
  - Test that agent role does not see statistics cards
  - Test that tl role sees all statistics cards
  - Test that wfm role sees all statistics cards
  - Test that action cards are visible to all roles
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_

- [x] 7. Update Dashboard component for conditional Coverage Overview rendering
  - Ensure Coverage Overview section uses existing `isManager` check
  - Verify the conditional already exists: `{isManager && coverageData && ...}`
  - If not present, add the conditional rendering
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 7.1 Write unit tests for Coverage Overview visibility
  - Test that agent role does not see Coverage Overview
  - Test that tl role sees Coverage Overview when data is available
  - Test that wfm role sees Coverage Overview when data is available
  - Test that Coverage Overview is hidden when no data is available
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 8. Checkpoint - Ensure dashboard visibility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Add integration tests for security logging
  - [ ] 9.1 Create integration test file for unauthorized access logging
    - Create `src/test/integration/roleBasedVisibility.test.tsx`
    - Set up test utilities for mocking security logger
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 9.2 Write property test for security logging
    - **Property 2: Unauthorized Access Attempts Are Logged**
    - **Property 6: Log Entries Do Not Expose Sensitive Information to Client**
    - **Validates: Requirements 1.4, 2.4, 6.1, 6.2, 6.4**

  - [ ]* 9.3 Write unit tests for security logging
    - Test that unauthorized /requests access is logged with correct parameters
    - Test that unauthorized /swap-requests access is logged with correct parameters
    - Test that log entries include user ID, role, path, and violation type
    - Test that log entries do not appear in client-side state
    - _Requirements: 6.1, 6.2, 6.4_

- [ ] 10. Add integration tests for authentication preservation
  - [ ] 10.1 Create integration test file for authentication flow
    - Create `src/test/integration/authenticationPreservation.test.tsx`
    - Set up test utilities for mocking authentication state
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 10.2 Write property tests for authentication preservation
    - **Property 7: Authentication Check Precedes Role Check**
    - **Property 8: Existing Authentication Mechanisms Are Preserved**
    - **Property 9: Domain-Based Access Control Is Preserved**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [ ]* 10.3 Write unit tests for authentication preservation
    - Test that unauthenticated users are redirected to login
    - Test that post-login redirect preserves requested URL
    - Test that invalid email domains are blocked
    - Test that authentication check happens before role check
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Run full test suite with `npm run test:run`
  - Verify all property tests run 100+ iterations
  - Verify all unit tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties across all role combinations
- Unit tests validate specific examples and edge cases
- The implementation preserves all existing authentication and authorization mechanisms
- Security logging is integrated throughout to track unauthorized access attempts
