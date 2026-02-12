# Implementation Plan: Code Quality Improvements

## Overview

This implementation plan breaks down all code quality improvements into discrete, actionable tasks. The work is organized into four phases corresponding to the requirements specification. Each phase builds on the previous one, ensuring that critical issues are addressed first while maintaining the ability to deliver incremental value.

The implementation uses TypeScript throughout, consistent with the existing codebase architecture. Tasks are organized to minimize dependencies between workstreams, allowing multiple team members to work in parallel on different categories of improvements.

## Tasks

### Phase 1: Critical Fixes (Type Safety, Validation, Security)

- [ ] 1. Type Safety Improvements
  - [x] 1.1 Create type-safe validator interfaces
    - Define Generic Validator Type with proper typing
    - Define ValidationResult union type
    - Replace `as any` casts with proper generic constraints
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.2 Write property test for type-safe validator
    - **Property 1: Type Safety Compliance**
    - **Validates: Requirements 1.1, 1.2, 1.5**

  - [x] 1.3 Export all types from service barrel files
    - Create src/services/types.ts barrel file
    - Export all types from breakSchedulesService, leaveRequestsService, swapRequestsService
    - Export all types from hooks barrel file
    - _Requirements: 1.3_

  - [x] 1.4 Create explicit error type unions in AuthContext
    - Define AuthError type union (AuthenticationError, TokenExpiredError, PermissionDeniedError, NetworkError)
    - Update error handling code to use explicit types
    - Add type guards for error narrowing
    - _Requirements: 1.4_

  - [ ]* 1.5 Write property test for error type explicitness
    - **Property 3: Error Type Explicitness**
    - **Validates: Requirements 1.4**

- [ ] 2. Validation Improvements
  - [x] 2.1 Implement break schedule rule validation
    - Complete the TODO at line 267 in breakSchedulesService.ts
    - Create BreakScheduleRule interface
    - Implement validateBreakScheduleRule function
    - Add validation for startTime, endTime, breakDuration, maxConsecutiveWork, applicableDays
    - _Requirements: 2.1_

  - [ ]* 2.2 Write property test for break schedule validation
    - **Property 4: Validation Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 2.3 Add input validation for all service parameters
    - Create validation wrapper for service methods
    - Add parameter validation to breakSchedulesService methods
    - Add parameter validation to leaveRequestsService methods
    - Add parameter validation to swapRequestsService methods
    - _Requirements: 2.2_

  - [x] 2.4 Implement color validation for inline styles
    - Create isValidHexColor function
    - Create sanitizeColorForStyle function
    - Update Dashboard.tsx to use validated colors
    - _Requirements: 2.3_

  - [ ]* 2.5 Write property test for color validation
    - **Property 4: Validation Completeness**
    - **Validates: Requirements 2.3**

  - [x] 2.6 Consolidate duplicate validation modules
    - Analyze overlap between src/utils/validation.ts and src/validation/validators.ts
    - Merge duplicate validation logic into single module
    - Deprecate redundant implementation
    - Update all imports to use consolidated module
    - _Requirements: 2.4, 7.1_

  - [x] 2.7 Standardize error handling patterns
    - Audit all modules for error handling consistency
    - Choose error handling pattern (throw vs return error objects)
    - Update all modules to use consistent pattern
    - _Requirements: 2.5, 7.5_

- [ ] 3. Security Improvements
  - [x] 3.1 Implement PII filtering for error logs
    - Create PII_PATTERNS constant with email, phone, SSN patterns
    - Implement sanitizeForLog function
    - Update errorHandler.ts to use PII filtering
    - _Requirements: 4.2_

  - [ ]* 3.2 Write property test for PII filtering
    - **Property 10: Security Sanitization**
    - **Validates: Requirements 4.2**

  - [x] 3.3 Extract magic strings to constants
    - Create TABLE_NAMES constant object
    - Create TIME_RANGES constant object
    - Create ERROR_MESSAGES constant object
    - Update all services to use constants instead of magic strings
    - _Requirements: 4.3, 4.4, 7.2_

  - [x] 3.4 Add environment variable validation
    - Create REQUIRED_ENV_VARS constant
    - Implement validateEnvironment function
    - Call validateEnvironment at application startup
    - _Requirements: 4.5_

  - [ ]* 3.5 Write property test for environment validation
    - **Property 12: Environment Validation**
    - **Validates: Requirements 4.5**

- [x] 4. Checkpoint - Ensure all Phase 1 tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 2: Performance Optimizations

- [x] 5. Pagination Implementation
  - [x] 5.1 Create pagination types and interfaces
    - Define PaginationParams interface
    - Define PaginatedResult interface
    - Define PaginationState interface
    - Define PaginationActions interface
    - _Requirements: 3.1, 3.2_

  - [x] 5.2 Implement pagination in useLeaveRequests
    - Add pagination parameters to hook
    - Update fetch function to accept PaginationParams
    - Return PaginatedResult from hook
    - Add nextPage, prevPage, goToPage actions
    - _Requirements: 3.1_

  - [ ]* 5.3 Write property test for useLeaveRequests pagination
    - **Property 6: Pagination Support**
    - **Validates: Requirements 3.1**

  - [x] 5.4 Implement pagination in useSwapRequests
    - Add pagination parameters to hook
    - Update fetch function to accept PaginationParams
    - Return PaginatedResult from hook
    - Add nextPage, prevPage, goToPage actions
    - _Requirements: 3.2_

  - [ ]* 5.5 Write property test for useSwapRequests pagination
    - **Property 6: Pagination Support**
    - **Validates: Requirements 3.2_

- [x] 6. Performance Optimizations
  - [x] 6.1 Optimize interval map building in breakSchedulesService
    - Create IntervalMap class with pre-computation capability
    - Implement precomputeTemplates method
    - Update breakSchedulesService to use optimized IntervalMap
    - Measure and verify performance improvement
    - _Requirements: 3.3_

  - [ ]* 6.2 Write property test for interval map performance
    - **Property 7: Interval Map Performance**
    - **Validates: Requirements 3.3**

  - [x] 6.3 Limit dashboard queries to recent 10 items
    - Update dashboard queries to include LIMIT 10
    - Add ORDER BY created_at DESC to queries
    - Verify only recent items are fetched
    - _Requirements: 3.4_

  - [ ]* 6.4 Write property test for dashboard query limits
    - **Property 8: Dashboard Query Limits**
    - **Validates: Requirements 3.4**

  - [x] 6.5 Configure Supabase client timeout
    - Update Supabase client initialization
    - Add timeout configuration (30000ms)
    - Test timeout behavior
    - _Requirements: 3.5_

  - [ ]* 6.6 Write property test for Supabase timeout
    - **Property 9: Supabase Timeout Configuration**
    - **Validates: Requirements 3.5_

- [-] 7. Checkpoint - Ensure all Phase 2 tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: Accessibility Improvements

- [ ] 8. Accessibility Components
  - [ ] 8.1 Create accessible icon component
    - Define IconProps interface with ariaLabel
    - Implement Icon component with proper role and aria attributes
    - Update all existing icon usages to use new component
    - _Requirements: 5.3_

  - [ ] 8.2 Implement focus trap for modals
    - Create createFocusTrap function
    - Implement FocusTrap interface with activate/deactivate methods
    - Integrate focus trap into all modal components
    - Test keyboard focus behavior
    - _Requirements: 5.2_

  - [ ] 8.3 Add aria-label to sidebar collapse button
    - Locate Layout.tsx sidebar collapse button
    - Add aria-label attribute describing button function
    - Test with screen reader
    - _Requirements: 5.1_

  - [ ] 8.4 Ensure pagination keyboard accessibility
    - Audit pagination controls for keyboard accessibility
    - Add proper tabindex attributes
    - Add keyboard event handlers for navigation
    - Test with keyboard navigation
    - _Requirements: 5.4_

  - [ ] 8.5 Add icons and text to toast notifications
    - Update toast notification component
    - Add icon for each notification type
    - Ensure text labels are readable by screen readers
    - Test with screen reader
    - _Requirements: 5.5_

  - [ ]* 8.6 Write property test for accessibility compliance
    - **Property 13: Accessibility Compliance**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [ ] 9. Checkpoint - Ensure all Phase 3 tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 4: Testing and Documentation

- [x] 10. Testing Improvements
  - [x] 10.1 Add comprehensive tests for breakSchedulesService
    - Write unit tests for all public methods
    - Achieve 100% test coverage
    - Test all validation scenarios
    - Test error handling paths
    - _Requirements: 6.1_

  - [x] 10.2 Write property test for breakSchedulesService
    - **Property 14: Test Coverage Maintenance**
    - **Validates: Requirements 6.1**

  - [x] 10.3 Add component tests for Dashboard page
    - Write component tests for major user flows
    - Test pagination interactions
    - Test error states
    - Test loading states
    - _Requirements: 6.2_

  - [x] 10.4 Write property test for Dashboard component
    - **Property 15: Component Test Coverage**
    - **Validates: Requirements 6.2**

  - [x] 10.5 Add tests for ErrorBoundary component
    - Write tests for error catching behavior
    - Test error display rendering
    - Test recovery mechanisms
    - _Requirements: 6.3_

  - [x] 10.6 Write property test for ErrorBoundary
    - **Property 16: Error Boundary Testing**
    - **Validates: Requirements 6.3**

  - [x] 10.7 Add integration tests for approval workflows
    - Write integration tests for leave request approval
    - Write integration tests for swap request approval
    - Write integration tests for overtime request approval
    - Test complete lifecycle from request to approval
    - _Requirements: 6.4_

  - [x] 10.8 Write property test for approval workflows
    - **Property 17: Integration Test Coverage**
    - **Validates: Requirements 6.4**

  - [x] 10.9 Add performance benchmarks
    - Implement benchmark tests for interval map operations
    - Implement benchmark tests for pagination operations
    - Implement benchmark tests for validation operations
    - Establish baseline metrics
    - _Requirements: 6.5_

  - [x] 10.10 Write property test for performance benchmarks
    - **Property 18: Performance Benchmarking**
    - **Validates: Requirements 6.5**

- [x] 11. Documentation Improvements
  - [ ] 11.1 Add JSDoc comments to all public functions
    - Audit all public functions for JSDoc coverage
    - Add JSDoc comments documenting parameters
    - Add JSDoc comments documenting return types
    - Add JSDoc comments documenting behavior
    - _Requirements: 7.3_

  - [x] 11.2 Add error boundaries to all page components
    - Audit all page components for ErrorBoundary wrapping
    - Wrap Dashboard page in ErrorBoundary
    - Wrap all other page components in ErrorBoundary
    - Test error boundary behavior
    - _Requirements: 7.4_

  - [x] 11.3 Write property test for error boundary wrapping
    - **Property 21: Error Boundary Wrapping**
    - **Validates: Requirements 7.4**

- [ ] 12. Final Checkpoint - Ensure all Phase 4 tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at the end of each phase
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript, consistent with the existing codebase
- Phases should be completed in order, but tasks within phases can be done in parallel
- All tests should pass before moving to the next phase
- Performance benchmarks should show measurable improvements over baseline