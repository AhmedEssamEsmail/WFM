# Implementation Plan: Security & Access Control

## Overview

This implementation plan addresses critical security vulnerabilities in the WFM system by implementing route-level authentication and authorization, protecting system-generated comments, and enforcing role-based access control consistently. The implementation will be done incrementally, with testing at each step to ensure security controls work correctly.

## Tasks

- [x] 1. Create error types for security violations
  - Create `src/types/errors.ts` if it doesn't exist
  - Define `SystemCommentProtectedError` class with code 'SYSTEM_COMMENT_PROTECTED'
  - Define `UnauthorizedAccessError` class for logging unauthorized route access
  - Export all error types
  - _Requirements: 5.1, 5.2, 7.3, 9.3_

- [x] 2. Implement ProtectedRoute component
  - [x] 2.1 Create ProtectedRoute component with authentication checks
    - Create `src/components/ProtectedRoute.tsx`
    - Implement authentication check using useAuth hook
    - Implement loading state with spinner
    - Implement redirect to /login for unauthenticated users
    - Preserve requested URL in location state for post-login redirect
    - _Requirements: 1.1, 1.2, 1.4, 6.1, 6.2, 6.4, 6.5_
  
  - [ ]* 2.2 Write property test for unauthenticated access redirect
    - **Property 1: Unauthenticated Access Redirect**
    - **Validates: Requirements 1.1, 1.4**
  
  - [ ]* 2.3 Write property test for post-authentication redirect
    - **Property 2: Post-Authentication Redirect**
    - **Validates: Requirements 1.2**
  
  - [x] 2.4 Add domain-based access control to ProtectedRoute
    - Check if user email ends with '@dabdoob.com'
    - Call signOut() if domain is invalid
    - Redirect to /unauthorized for invalid domains
    - _Requirements: 8.1, 8.2, 8.4, 8.5_
  
  - [ ]* 2.5 Write property test for domain-based access control
    - **Property 13: Domain-Based Access Control**
    - **Validates: Requirements 8.1**
  
  - [x] 2.6 Add role-based authorization to ProtectedRoute
    - Accept optional `requiredRoles` prop (UserRole[])
    - Check if user.role is in requiredRoles array
    - Redirect to /dashboard if role check fails
    - Log unauthorized access attempts
    - Wrap children in Layout component
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 6.3, 6.6, 7.5_
  
  - [ ]* 2.7 Write property test for agent role admin route denial
    - **Property 4: Agent Role Admin Route Denial**
    - **Validates: Requirements 2.1, 3.1, 3.3**
  
  - [ ]* 2.8 Write property test for agent role manager route denial
    - **Property 5: Agent Role Manager Route Denial**
    - **Validates: Requirements 2.2, 3.2, 3.4, 3.5, 4.4**
  
  - [ ]* 2.9 Write property test for TL role admin route denial
    - **Property 6: TL Role Admin Route Denial**
    - **Validates: Requirements 2.3, 3.1, 3.3**
  
  - [ ]* 2.10 Write property test for TL role manager route access
    - **Property 7: TL Role Manager Route Access**
    - **Validates: Requirements 2.4, 4.1, 4.2, 4.3**
  
  - [ ]* 2.11 Write property test for WFM role universal access
    - **Property 8: WFM Role Universal Access**
    - **Validates: Requirements 2.5, 3.6**

- [ ] 3. Extract and enhance PublicRoute component
  - [x] 3.1 Extract PublicRoute from App.tsx to separate file
    - Create `src/components/PublicRoute.tsx`
    - Move PublicRoute logic from App.tsx
    - Implement redirect to dashboard for authenticated users
    - Support redirect to originally requested route via location state
    - _Requirements: 1.5, 10.1_
  
  - [ ]* 3.2 Write property test for authenticated user public route redirect
    - **Property 3: Authenticated User Public Route Redirect**
    - **Validates: Requirements 1.5**

- [ ] 4. Checkpoint - Ensure route protection tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Update route configuration in App.tsx
  - [x] 5.1 Replace WFMOnlyRoute with ProtectedRoute for admin routes
    - Update /settings route to use ProtectedRoute with requiredRoles={['wfm']}
    - Update /schedule/upload route to use ProtectedRoute with requiredRoles={['wfm']}
    - Remove WFMOnlyRoute component definition
    - _Requirements: 3.1, 3.3, 10.1, 10.4_
  
  - [x] 5.2 Replace HeadcountRoute with ProtectedRoute for manager routes
    - Update /reports route to use ProtectedRoute with requiredRoles={['tl', 'wfm']}
    - Update /headcount/employees route to use ProtectedRoute with requiredRoles={['tl', 'wfm']}
    - Update /headcount/employees/:id route to use ProtectedRoute with requiredRoles={['tl', 'wfm']}
    - Remove HeadcountRoute component definition
    - _Requirements: 3.2, 3.4, 3.5, 4.1, 4.2, 4.3, 10.1, 10.4_
  
  - [x] 5.3 Update all other protected routes to use ProtectedRoute
    - Update /dashboard, /schedule, /swap-requests, /leave-requests, etc.
    - Use ProtectedRoute without requiredRoles for employee-accessible routes
    - Ensure all routes maintain existing paths
    - _Requirements: 1.1, 10.1_
  
  - [ ]* 5.4 Write unit tests for route configuration
    - Test that all admin routes have requiredRoles={['wfm']}
    - Test that all manager routes have requiredRoles={['tl', 'wfm']}
    - Test that employee routes have no role restrictions
    - _Requirements: 10.1, 10.2_

- [ ] 6. Implement system comment protection in service layer
  - [x] 6.1 Add authorization checks to commentsService
    - Update `updateComment()` to fetch comment and check is_system flag
    - Throw SystemCommentProtectedError if is_system === true
    - Update `deleteComment()` to fetch comment and check is_system flag
    - Throw SystemCommentProtectedError if is_system === true
    - Maintain existing API signatures for backward compatibility
    - _Requirements: 5.1, 5.2, 9.1, 9.2, 9.3, 9.5, 10.2_
  
  - [ ]* 6.2 Write property test for system comment update protection
    - **Property 9: System Comment Update Protection**
    - **Validates: Requirements 5.1, 5.3, 9.1, 9.3**
  
  - [ ]* 6.3 Write property test for system comment delete protection
    - **Property 10: System Comment Delete Protection**
    - **Validates: Requirements 5.2, 5.4, 9.2, 9.3**
  
  - [ ]* 6.4 Write property test for non-system comment ownership enforcement
    - **Property 12: Non-System Comment Ownership Enforcement**
    - **Validates: Requirements 9.4**

- [ ] 7. Create RLS policies for system comment protection
  - [x] 7.1 Create migration for system comment RLS policies
    - Create `supabase/migrations/009_system_comment_protection.sql`
    - Drop existing overly permissive UPDATE and DELETE policies on comments
    - Create policy "Users can update own non-system comments" with is_system = false check
    - Create policy "Users can delete own non-system comments" with is_system = false check
    - Create policy "WFM can view all comments" for audit purposes
    - _Requirements: 5.3, 5.4, 5.6_
  
  - [ ]* 7.2 Write integration test for RLS policy enforcement
    - Test direct database UPDATE on system comment is blocked
    - Test direct database DELETE on system comment is blocked
    - Test authenticated users can SELECT system comments
    - **Property 11: System Comment Read Access**
    - **Validates: Requirements 5.6**

- [ ] 8. Checkpoint - Ensure all security tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Add security logging for unauthorized access
  - [x] 9.1 Create security logging utility
    - Create `src/lib/securityLogger.ts`
    - Implement logUnauthorizedAccess() function
    - Log user ID, role, requested route, timestamp, failure reason
    - Use console.warn in development, proper logging service in production
    - _Requirements: 7.5_
  
  - [x] 9.2 Integrate security logging into ProtectedRoute
    - Call logUnauthorizedAccess() when role check fails
    - Call logUnauthorizedAccess() when domain check fails
    - Include all relevant context in log entries
    - _Requirements: 7.5_

- [ ] 10. Update error handling for security errors
  - [x] 10.1 Add error handling for SystemCommentProtectedError
    - Update error handler middleware to catch SystemCommentProtectedError
    - Return 403 Forbidden with descriptive error message
    - Display user-friendly error message in UI
    - _Requirements: 7.3_
  
  - [x] 10.2 Add error handling for domain authorization failures
    - Ensure unauthorized page displays clear message about domain restriction
    - Ensure sign out happens before redirect to unauthorized page
    - _Requirements: 8.1, 8.3_

- [ ] 11. Backward compatibility verification
  - [ ]* 11.1 Write unit tests for backward compatibility
    - Test all existing route paths still work
    - Test all existing commentsService API signatures unchanged
    - Test authorized users see same content as before
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 11.2 Run existing test suite
    - Run all existing unit tests
    - Run all existing integration tests
    - Verify no regressions introduced
    - _Requirements: 10.5_

- [ ] 12. Final checkpoint - Complete security audit
  - Verify all protected routes have ProtectedRoute wrapper
  - Verify all admin routes specify requiredRoles=['wfm']
  - Verify all manager routes specify requiredRoles=['tl', 'wfm']
  - Verify RLS policies prevent system comment modification
  - Verify domain check happens on every protected route
  - Verify authorization failures are logged
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation of security controls
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and backward compatibility
- Security logging is critical for monitoring and incident response
- RLS policies provide defense-in-depth at the database layer
