# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Direct Supabase Import Detection
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate architecture violations exist
  - **Scoped PBT Approach**: Scope the property to the 4 known violating files
  - Test that page components do NOT contain direct Supabase imports: `import { supabase } from '../../lib/supabase'`
  - Test that page components do NOT contain direct database calls: `supabase.from().select()`, `supabase.from().insert()`, etc.
  - Check files: `src/pages/LeaveRequests/LeaveBalances.tsx`, `src/pages/LeaveRequests/CreateLeaveRequest.tsx`, `src/pages/SwapRequests/CreateSwapRequest.tsx`, `src/pages/Schedule/ScheduleUpload.tsx`
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the architecture violations exist)
  - Document counterexamples found: specific line numbers and direct Supabase calls in each file
  - Mark task complete when test is written, run, and failures are documented
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Functional Equivalence
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for all affected features
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Test leave balances viewing with role-based filtering (agent, TL, WFM roles)
  - Test leave request creation including "submit on behalf" feature
  - Test swap request creation including "submit on behalf" feature
  - Test schedule upload CSV import/export functionality
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Create usersService and extend existing services

  - [x] 3.1 Create new usersService
    - Create `src/services/usersService.ts` following existing service patterns
    - Implement `getUsers()` - Get all users with optional ordering
    - Implement `getUsersByRole(role)` - Get users filtered by role
    - Implement `getUsersByEmails(emails)` - Get users by email list for CSV imports
    - Implement `getUserById(id)` - Get single user by ID
    - Follow error handling patterns from existing services
    - _Bug_Condition: Page components directly import supabase for user queries_
    - _Expected_Behavior: Components use usersService methods instead_
    - _Preservation: All user data queries return identical results_
    - _Requirements: 2.1, 2.2, 3.1_

  - [x] 3.2 Export usersService from services index
    - Add usersService export to `src/services/index.ts`
    - Make service available to all components
    - _Requirements: 2.1_

  - [x] 3.3 Extend leaveBalancesService
    - Add `getAllLeaveBalances()` method to `src/services/leaveBalancesService.ts`
    - Support role-based filtering (agent sees own, TL sees team, WFM sees all)
    - Return balances with user information joined
    - _Bug_Condition: LeaveBalances.tsx directly queries leave_balances table_
    - _Expected_Behavior: Component uses leaveBalancesService.getAllLeaveBalances()_
    - _Preservation: Balance viewing with role-based filtering works identically_
    - _Requirements: 2.2, 3.2_

  - [x] 3.4 Extend leaveRequestsService
    - Modify `createLeaveRequest()` in `src/services/leaveRequestsService.ts` to accept optional `status` parameter
    - Default to 'pending_tl' if not provided
    - Support custom status for auto-deny/auto-approve scenarios
    - Maintain existing validation logic
    - _Bug_Condition: Components directly insert to leave_requests with custom status_
    - _Expected_Behavior: Components use createLeaveRequest() with status parameter_
    - _Preservation: Leave request creation with all status scenarios works identically_
    - _Requirements: 2.2, 3.3_

  - [x] 3.5 Verify swapRequestsService has createSwapRequest method
    - Check if `createSwapRequest()` exists in `src/services/swapRequestsService.ts`
    - If missing, implement it to handle all required swap request fields
    - Support all original shift type fields and complex swap request data structure
    - _Bug_Condition: CreateSwapRequest.tsx directly inserts to swap_requests table_
    - _Expected_Behavior: Component uses swapRequestsService.createSwapRequest()_
    - _Preservation: Swap request creation works identically_
    - _Requirements: 2.2, 3.4_

- [x] 4. Refactor LeaveBalances.tsx to use service layer

  - [x] 4.1 Remove direct Supabase import and add service imports
    - Remove `import { supabase } from '../../lib/supabase'` from `src/pages/LeaveRequests/LeaveBalances.tsx`
    - Add `import { usersService, leaveBalancesService } from '../../services'`
    - _Requirements: 2.1, 2.2_

  - [x] 4.2 Replace user query with usersService
    - Replace direct `supabase.from('users').select()` call (line ~70) with `usersService.getUsers()` or `usersService.getUsersByRole()`
    - Maintain role-based filtering logic
    - _Requirements: 2.2, 3.1_

  - [x] 4.3 Replace balance query with leaveBalancesService
    - Replace direct `supabase.from('leave_balances').select()` call (line ~80) with `leaveBalancesService.getAllLeaveBalances()`
    - Maintain filtering and data transformation logic
    - _Requirements: 2.2, 3.2_

- [x] 5. Refactor CreateLeaveRequest.tsx to use service layer

  - [x] 5.1 Remove direct Supabase import and add service imports
    - Remove `import { supabase } from '../../lib/supabase'` from `src/pages/LeaveRequests/CreateLeaveRequest.tsx`
    - Add `import { usersService, leaveRequestsService, leaveBalancesService } from '../../services'`
    - _Requirements: 2.1, 2.2_

  - [x] 5.2 Replace fetchAllUsers with usersService
    - Replace direct `supabase.from('users').select()` call (line ~50) with `usersService.getUsers()`
    - Maintain ordering by name
    - _Requirements: 2.2, 3.1_

  - [x] 5.3 Replace fetchAgents with usersService
    - Replace direct `supabase.from('users').select().eq('role', 'agent')` call (line ~100) with `usersService.getUsersByRole('agent')`
    - Maintain filtering logic
    - _Requirements: 2.2, 3.1_

  - [x] 5.4 Replace leave request insert with service method
    - Replace direct `supabase.from('leave_requests').insert()` call (line ~130) with `leaveRequestsService.createLeaveRequest()` with status parameter
    - Pass custom status for auto-deny scenarios
    - _Requirements: 2.2, 3.3_

  - [x] 5.5 Replace email resolution with usersService
    - Replace direct `supabase.from('users').select().in('email', emails)` call (line ~145) with `usersService.getUsersByEmails(emails)`
    - Maintain email-to-user mapping logic
    - _Requirements: 2.2, 3.1_

  - [x] 5.6 Verify balance deduction uses service method
    - Confirm that balance deduction already uses `leaveBalancesService.deductLeaveBalance()` instead of direct insert to leave_balance_history
    - No changes needed if already using service method
    - _Requirements: 3.3_

- [x] 6. Refactor CreateSwapRequest.tsx to use service layer

  - [x] 6.1 Remove direct Supabase import and add service imports
    - Remove `import { supabase } from '../../lib/supabase'` from `src/pages/SwapRequests/CreateSwapRequest.tsx`
    - Add `import { usersService, swapRequestsService } from '../../services'`
    - _Requirements: 2.1, 2.2_

  - [x] 6.2 Replace fetchAllUsers with usersService
    - Replace direct `supabase.from('users').select()` call (line ~45) with `usersService.getUsers()`
    - Maintain ordering by name
    - _Requirements: 2.2, 3.1_

  - [x] 6.3 Replace fetchAgents with usersService
    - Replace direct `supabase.from('users').select().eq('role', 'agent')` call (line ~70) with `usersService.getUsersByRole('agent')`
    - Filter out requester in component code (`.neq('id', effectiveRequesterId)` logic)
    - _Requirements: 2.2, 3.1_

  - [x] 6.4 Replace swap request insert with service method
    - Replace direct `supabase.from('swap_requests').insert()` call (line ~150) with `swapRequestsService.createSwapRequest()`
    - Pass all required swap request fields
    - _Requirements: 2.2, 3.4_

  - [x] 6.5 Replace email resolution with usersService
    - Replace direct `supabase.from('users').select().in('email', emails)` call (line ~160) with `usersService.getUsersByEmails(emails)`
    - Maintain email-to-user mapping logic
    - _Requirements: 2.2, 3.1_

- [x] 7. Refactor ScheduleUpload.tsx to use service layer

  - [x] 7.1 Remove direct Supabase import and add service imports
    - Remove `import { supabase } from '../../lib/supabase'` from `src/pages/Schedule/ScheduleUpload.tsx`
    - Add `import { usersService, leaveRequestsService } from '../../services'`
    - _Requirements: 2.1, 2.2_

  - [x] 7.2 Replace email resolution with usersService
    - Replace direct `supabase.from('users').select().in('email', emails)` call (line ~200) with `usersService.getUsersByEmails(emails)`
    - Maintain email-to-user mapping logic for CSV import
    - _Requirements: 2.2, 3.1_

  - [x] 7.3 Replace leave request insert with service method
    - Replace direct `supabase.from('leave_requests').insert()` call (line ~250) with `leaveRequestsService.createLeaveRequest()` with auto-approve status
    - Pass status parameter for auto-approved leaves from schedule
    - _Requirements: 2.2, 3.3_

  - [x] 7.4 Replace leave query with service method
    - Replace direct `supabase.from('leave_requests').select().eq('status', 'approved')` call (line ~350) with `leaveRequestsService.getLeaveRequestsByDateRange()`
    - Filter by status='approved' in component code
    - _Requirements: 2.2, 3.5_

- [x] 8. Verify bug condition exploration test now passes

  - [x] 8.1 Re-run architecture violation detection test
    - **Property 1: Expected Behavior** - Service Layer Compliance
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms architecture violations are fixed)
    - Verify no direct Supabase imports remain in the 4 page components
    - Verify all database operations use service layer methods
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 9. Verify preservation tests still pass

  - [x] 9.1 Re-run functional equivalence tests
    - **Property 2: Preservation** - Functional Equivalence
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify leave balances viewing works identically with role-based filtering
    - Verify leave request creation works identically including "submit on behalf"
    - Verify swap request creation works identically including "submit on behalf"
    - Verify schedule upload CSV import/export works identically
    - Confirm all tests still pass after refactoring (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 10. Checkpoint - Ensure all tests pass
  - Run all tests to verify the fix is complete
  - Verify no direct Supabase imports remain in page components
  - Verify all affected features work correctly
  - Ask the user if questions arise
