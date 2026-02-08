# Implementation Plan: Critical Data Integrity Fixes

## Overview

This implementation plan addresses critical data integrity vulnerabilities in the WFM system through four key areas: atomic swap execution, service-level validation, comprehensive input validation, and race condition prevention. The implementation will be done incrementally, with testing at each step to ensure correctness.

## Tasks

- [x] 1. Create error types and validation utilities
  - [x] 1.1 Create error type definitions
    - Create `src/types/errors.ts` with ValidationError, ConcurrencyError, InsufficientBalanceError, and OverlappingLeaveError classes
    - Each error type should extend Error with appropriate properties
    - _Requirements: 6.1, 6.4, 6.5_
  
  - [x] 1.2 Create input validation module
    - Create `src/services/validation/inputValidation.ts`
    - Implement validateUUID(), validateEnum(), validateStringLength(), validateDateFormat(), validateDateRange()
    - Each function should throw ValidationError with descriptive messages
    - _Requirements: 3.1, 3.3, 3.5, 3.9, 2.7, 2.8, 2.9_
  
  - [ ]* 1.3 Write property tests for input validation
    - **Property 8: UUID Format Validation**
    - **Property 9: Enum Value Validation**
    - **Property 10: String Length Validation**
    - **Property 12: Date Format Validation**
    - **Property 7: Leave Date Range Validation**
    - **Validates: Requirements 3.1, 3.3, 3.5, 3.9, 2.7, 2.8, 2.9**

- [x] 2. Implement leave balance validation
  - [x] 2.1 Create leave balance validation module
    - Create `src/services/validation/leaveBalanceValidation.ts`
    - Implement validateLeaveBalance() to check sufficient balance
    - Implement checkOverlappingLeave() to detect date conflicts
    - Use existing getBusinessDaysBetween() from dateHelpers
    - _Requirements: 2.1, 2.3, 2.5_
  
  - [ ]* 2.2 Write property tests for leave balance validation
    - **Property 4: Leave Balance Validation**
    - **Property 5: Business Day Calculation**
    - **Property 6: Overlapping Leave Detection**
    - **Validates: Requirements 2.1, 2.3, 2.5**
  
  - [ ]* 2.3 Write unit tests for error message details
    - Test InsufficientBalanceError contains requested and available days
    - Test OverlappingLeaveError contains conflicting date range
    - _Requirements: 6.4, 6.5_

- [x] 3. Enhance leaveRequestsService with validation
  - [x] 3.1 Update createLeaveRequest function
    - Add input validation calls (UUID, enum, date format, string length)
    - Add validateLeaveBalance() call before database insert
    - Add checkOverlappingLeave() call before database insert
    - Throw appropriate errors on validation failure
    - _Requirements: 2.1, 2.3, 2.5, 3.1, 3.3, 3.5, 3.9_
  
  - [x] 3.2 Add optimistic locking to updateLeaveRequestStatus
    - Add expectedStatus parameter
    - Query current status before update
    - Compare with expectedStatus and throw ConcurrencyError if mismatch
    - Update with WHERE clause checking status
    - Verify affected rows count
    - _Requirements: 4.3, 4.6_
  
  - [ ]* 3.3 Write property tests for leave request service
    - **Property 14: Leave Status Optimistic Locking**
    - **Validates: Requirements 4.3, 4.6**
  
  - [ ]* 3.4 Write unit tests for leave request validation
    - Test valid leave request creation succeeds
    - Test insufficient balance rejection
    - Test overlapping dates rejection
    - Test past date rejection
    - Test far-future date rejection
    - Test inverted date range rejection
    - _Requirements: 2.1, 2.5, 2.7, 2.8, 2.9_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create atomic swap execution stored procedure
  - [x] 5.1 Create database migration for stored procedure
    - Create `supabase/migrations/008_atomic_swap_execution.sql`
    - Implement execute_shift_swap() function with transaction handling
    - Validate all 4 shifts exist before updates
    - Execute all 4 shift updates within single transaction
    - Return JSON with success status or error details
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 5.2 Create TypeScript types for stored procedure
    - Add SwapExecutionResult interface in types
    - Add error types for swap execution failures
    - _Requirements: 1.4_
  
  - [ ]* 5.3 Write integration tests for stored procedure
    - Test successful swap execution (all 4 shifts updated)
    - Test rollback on missing shift
    - Test rollback on update failure
    - Test error message content
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6. Enhance swapRequestsService with validation and atomic execution
  - [x] 6.1 Create executeSwap function
    - Implement executeSwap() to call stored procedure via Supabase RPC
    - Handle errors and throw descriptive exceptions
    - _Requirements: 1.1, 1.2_
  
  - [x] 6.2 Update createSwapRequest function
    - Add input validation calls (UUID validation for all IDs)
    - Add self-swap prevention check (requester_id !== target_user_id)
    - Validate shift IDs exist before creating request
    - _Requirements: 3.1, 3.7_
  
  - [x] 6.3 Add optimistic locking to updateSwapRequestStatus
    - Add expectedStatus parameter
    - Query current status before update
    - Compare with expectedStatus and throw ConcurrencyError if mismatch
    - Update with WHERE clause checking status
    - Verify affected rows count
    - _Requirements: 4.1, 4.6_
  
  - [ ]* 6.4 Write property tests for swap request service
    - **Property 1: Swap Execution Atomicity**
    - **Property 2: Swap Pre-Validation**
    - **Property 11: Self-Swap Prevention**
    - **Property 13: Swap Status Optimistic Locking**
    - **Validates: Requirements 1.1, 1.2, 1.3, 3.7, 4.1, 4.6**
  
  - [ ]* 6.5 Write unit tests for swap request validation
    - Test valid swap request creation succeeds
    - Test self-swap rejection
    - Test invalid UUID rejection
    - Test missing shift rejection
    - _Requirements: 3.1, 3.7_

- [ ] 7. Implement swap revoke with atomicity
  - [ ] 7.1 Create revoke stored procedure
    - Add revoke_shift_swap() function to migration
    - Restore all 4 shifts atomically within transaction
    - Validate all 4 shifts exist before restoration
    - _Requirements: 1.5_
  
  - [ ] 7.2 Update handleRevoke in SwapRequestDetail
    - Replace sequential updates with call to revoke stored procedure
    - Handle errors appropriately
    - _Requirements: 1.5_
  
  - [ ]* 7.3 Write property tests for swap revoke
    - **Property 3: Swap Revoke Atomicity**
    - **Validates: Requirements 1.5**

- [x] 8. Update UI components to handle new error types
  - [x] 8.1 Update error handling in SwapRequestDetail
    - Catch and display ValidationError, ConcurrencyError appropriately
    - Show user-friendly messages for each error type
    - Add refresh prompt for ConcurrencyError
    - _Requirements: 4.6, 6.1_
  
  - [x] 8.2 Update error handling in LeaveRequestDetail
    - Catch and display ValidationError, ConcurrencyError appropriately
    - Show user-friendly messages for each error type
    - Add refresh prompt for ConcurrencyError
    - _Requirements: 4.6, 6.1_
  
  - [x] 8.3 Update error handling in CreateLeaveRequest
    - Catch and display InsufficientBalanceError with balance details
    - Catch and display OverlappingLeaveError with date range
    - Show user-friendly messages for validation errors
    - _Requirements: 6.4, 6.5_
  
  - [x] 8.4 Update error handling in CreateSwapRequest
    - Catch and display ValidationError for self-swaps and invalid inputs
    - Show user-friendly messages
    - _Requirements: 3.7, 6.1_

- [ ] 9. Add error message consistency validation
  - [ ]* 9.1 Write property test for error message format
    - **Property 15: Error Message Consistency**
    - **Validates: Requirements 5.3, 6.1**
  
  - [ ]* 9.2 Write property test for error details
    - **Property 16: Insufficient Balance Error Details**
    - **Property 17: Overlapping Leave Error Details**
    - **Validates: Requirements 6.4, 6.5**

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify backward compatibility with existing tests
  - Run full test suite including existing tests
  - _Requirements: 5.1, 5.2, 5.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The stored procedure approach ensures atomic swap execution at the database level
- Optimistic locking prevents race conditions in concurrent approval scenarios
- All validation is enforced at the service layer to prevent bypass via direct API calls
