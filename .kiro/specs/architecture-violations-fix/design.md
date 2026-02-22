# Architecture Violations Fix - Bugfix Design

## Overview

This bugfix addresses architecture violations where page components directly import and use the Supabase client instead of following the established service layer pattern. The application has a well-defined service layer (in `src/services/`) that abstracts all database operations, but four page components bypass this pattern by making direct Supabase calls. This creates maintenance issues, inconsistent error handling, and violates the separation of concerns principle.

The fix will refactor these components to use the existing service layer methods or extend the service layer with new methods where needed, ensuring all database operations go through the proper abstraction layer.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when page components directly import `supabase` from `'../../lib/supabase'` and make database calls
- **Property (P)**: The desired behavior - all database operations should go through the service layer in `src/services/`
- **Preservation**: Existing functionality must remain unchanged - all features must work exactly as before
- **Service Layer**: The abstraction layer in `src/services/` that encapsulates all database operations
- **Direct Supabase Import**: When a component imports `{ supabase }` from `'../../lib/supabase'` and calls methods like `supabase.from().select()`
- **Architecture Pattern**: The established pattern where components use service methods (e.g., `leaveBalancesService.getLeaveBalance()`) instead of direct database calls

## Bug Details

### Fault Condition

The bug manifests when page components directly import and use the Supabase client for database operations. This violates the established service layer architecture pattern used throughout the application.

**Formal Specification:**
```
FUNCTION isBugCondition(file)
  INPUT: file of type SourceFile
  OUTPUT: boolean
  
  RETURN file.path MATCHES 'src/pages/**/*.tsx'
         AND file.imports CONTAINS "import { supabase } from '../../lib/supabase'"
         AND file.code CONTAINS directSupabaseCall()
         AND NOT isServiceLayerFile(file)
END FUNCTION

FUNCTION directSupabaseCall()
  RETURN pattern MATCHES 'supabase.from(*).select(*)'
         OR pattern MATCHES 'supabase.from(*).insert(*)'
         OR pattern MATCHES 'supabase.from(*).update(*)'
         OR pattern MATCHES 'supabase.from(*).delete(*)'
END FUNCTION
```

### Examples

**LeaveBalances.tsx (2 violations):**
1. Line ~70: Direct query to fetch users based on role
   ```typescript
   let usersQuery = supabase.from('users').select('*');
   ```
   Expected: Use a service method like `usersService.getUsers()` or `usersService.getUsersByRole()`

2. Line ~80: Direct query to fetch all leave balances
   ```typescript
   let balancesQuery = supabase.from('leave_balances').select('*');
   ```
   Expected: Use `leaveBalancesService.getAllLeaveBalances()` (needs to be added to service)

**CreateLeaveRequest.tsx (5 violations):**
1. Line ~50: Direct query to fetch all users
   ```typescript
   const { data, error } = await supabase.from('users').select('*').order('name');
   ```
   Expected: Use `usersService.getUsers()`

2. Line ~100: Direct query to fetch agents
   ```typescript
   const { data, error } = await supabase.from('users').select('*').eq('role', 'agent')...
   ```
   Expected: Use `usersService.getUsersByRole('agent')`

3. Line ~130: Direct insert to leave_requests with custom status
   ```typescript
   const { error: insertError } = await supabase.from('leave_requests').insert({...})
   ```
   Expected: Extend `leaveRequestsService.createLeaveRequest()` to accept optional status parameter

4. Line ~145: Direct query to resolve user emails
   ```typescript
   const { data: users } = await supabase.from('users').select('id, email, name').in('email', emails);
   ```
   Expected: Use `usersService.getUsersByEmails(emails)`

5. Line ~170: Direct insert to leave_balance_history
   ```typescript
   await supabase.from('leave_balance_history').insert({...})
   ```
   Expected: This is already handled by `leaveBalancesService.deductLeaveBalance()` - use that method

**CreateSwapRequest.tsx (4 violations):**
1. Line ~45: Direct query to fetch all users
   ```typescript
   const { data, error } = await supabase.from('users').select('*').order('name');
   ```
   Expected: Use `usersService.getUsers()`

2. Line ~70: Direct query to fetch agents excluding requester
   ```typescript
   const { data, error } = await supabase.from('users').select('*').eq('role', 'agent').neq('id', effectiveRequesterId)...
   ```
   Expected: Use `usersService.getUsersByRole('agent')` and filter in component

3. Line ~150: Direct insert to swap_requests
   ```typescript
   const { error: insertError } = await supabase.from('swap_requests').insert({...})
   ```
   Expected: Use `swapRequestsService.createSwapRequest()`

4. Line ~160: Direct query to resolve user emails
   ```typescript
   const { data: users } = await supabase.from('users').select('id, email, name').in('email', emails);
   ```
   Expected: Use `usersService.getUsersByEmails(emails)`

**ScheduleUpload.tsx (3 violations):**
1. Line ~200: Direct query to fetch users
   ```typescript
   const { data: users, error: usersError } = await supabase.from('users').select('id, email, name').in('email', emails);
   ```
   Expected: Use `usersService.getUsersByEmails(emails)`

2. Line ~250: Direct insert to leave_requests
   ```typescript
   const { error: leaveError } = await supabase.from('leave_requests').insert({...})
   ```
   Expected: Use `leaveRequestsService.createLeaveRequest()` with auto-approve option

3. Line ~350: Direct query to fetch approved leaves
   ```typescript
   const { data: leaves, error: leavesError } = await supabase.from('leave_requests').select('*').eq('status', 'approved')...
   ```
   Expected: Use `leaveRequestsService.getLeaveRequestsByDateRange()` and filter by status

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All existing functionality must continue to work exactly as before
- User interface behavior must remain identical
- Data validation and error handling must produce the same results
- Performance characteristics should remain similar or improve
- All existing features (filtering, pagination, CSV import/export, etc.) must work unchanged

**Scope:**
All inputs and user interactions that do NOT involve the internal implementation of database calls should be completely unaffected by this fix. This includes:
- User interface interactions (clicks, form submissions, navigation)
- Data display and formatting
- Business logic and validation rules
- Error messages shown to users
- Component state management
- React hooks behavior

## Hypothesized Root Cause

Based on the code analysis, the most likely causes for these architecture violations are:

1. **Missing Service Methods**: Some required operations don't have corresponding service methods
   - No `usersService` exists (needs to be created)
   - `leaveBalancesService` lacks `getAllLeaveBalances()` method
   - `leaveRequestsService.createLeaveRequest()` doesn't support custom status parameter
   - `swapRequestsService` may lack full CRUD operations

2. **Developer Convenience**: Direct Supabase calls were used for quick implementation
   - Faster to write `supabase.from('users').select()` than to create a service method
   - May have been prototyping code that wasn't refactored

3. **Incomplete Service Layer Migration**: The service layer may have been added later
   - Older components still use direct Supabase calls
   - Newer components follow the service layer pattern

4. **Complex Query Requirements**: Some queries have specific filtering needs
   - Role-based filtering (TL sees team, WFM sees all)
   - Email-based user lookup for CSV imports
   - Custom status handling for auto-deny/auto-approve scenarios

## Correctness Properties

Property 1: Fault Condition - Service Layer Usage

_For any_ page component that needs to perform database operations, the fixed code SHALL use service layer methods from `src/services/` instead of direct Supabase client calls, ensuring proper abstraction and maintainability.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Functional Equivalence

_For any_ user interaction or data operation that worked before the fix, the refactored code SHALL produce exactly the same observable behavior (same data returned, same UI updates, same error messages), preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, we need to:

**File**: `src/services/usersService.ts` (NEW FILE)

**Create New Service**:
1. **Create usersService**: New service file to handle all user-related database operations
   - `getUsers()` - Get all users with optional ordering
   - `getUsersByRole(role)` - Get users filtered by role
   - `getUsersByEmails(emails)` - Get users by email list (for CSV imports)
   - `getUserById(id)` - Get single user by ID
   - Follow the same pattern as existing services (leaveBalancesService, shiftsService)

**File**: `src/services/leaveBalancesService.ts`

**Add Missing Methods**:
1. **getAllLeaveBalances()**: Get all leave balances with optional user filtering
   - Support role-based filtering (agent sees own, TL sees team, WFM sees all)
   - Return balances with user information joined

**File**: `src/services/leaveRequestsService.ts`

**Extend Existing Methods**:
1. **createLeaveRequest()**: Add optional `status` parameter
   - Allow custom status for auto-deny/auto-approve scenarios
   - Default to 'pending_tl' if not provided
   - Maintain existing validation logic

**File**: `src/services/swapRequestsService.ts`

**Verify/Add Methods**:
1. **createSwapRequest()**: Ensure it exists and handles all required fields
   - Support all the original shift type fields
   - Handle the complex swap request data structure

**File**: `src/services/index.ts`

**Export New Service**:
1. **Add usersService export**: Make the new service available to components

**File**: `src/pages/LeaveRequests/LeaveBalances.tsx`

**Refactor Direct Calls**:
1. **Remove direct supabase import**: Delete `import { supabase } from '../../lib/supabase'`
2. **Add service imports**: Import `usersService` and use extended `leaveBalancesService`
3. **Replace user query**: Use `usersService.getUsers()` or `getUsersByRole()`
4. **Replace balance query**: Use `leaveBalancesService.getAllLeaveBalances()`
5. **Keep history insert**: The optional history insert can stay as-is (it's marked as non-critical)

**File**: `src/pages/LeaveRequests/CreateLeaveRequest.tsx`

**Refactor Direct Calls**:
1. **Remove direct supabase import**: Delete `import { supabase } from '../../lib/supabase'`
2. **Add usersService import**: Import the new users service
3. **Replace fetchAgents()**: Use `usersService.getUsers()` instead of direct query
4. **Replace fetchAllUsers()**: Use `usersService.getUsers()` instead of direct query
5. **Replace leave request insert**: Use `leaveRequestsService.createLeaveRequest()` with status parameter
6. **Replace email resolution**: Use `usersService.getUsersByEmails()` instead of direct query
7. **Keep history insert**: Already handled by service layer methods

**File**: `src/pages/SwapRequests/CreateSwapRequest.tsx`

**Refactor Direct Calls**:
1. **Remove direct supabase import**: Delete `import { supabase } from '../../lib/supabase'`
2. **Add usersService import**: Import the new users service
3. **Replace fetchAllUsers()**: Use `usersService.getUsers()` instead of direct query
4. **Replace fetchAgents()**: Use `usersService.getUsersByRole('agent')` and filter in component
5. **Replace swap request insert**: Use `swapRequestsService.createSwapRequest()` if it exists, or create it
6. **Replace email resolution**: Use `usersService.getUsersByEmails()` instead of direct query

**File**: `src/pages/Schedule/ScheduleUpload.tsx`

**Refactor Direct Calls**:
1. **Remove direct supabase import**: Delete `import { supabase } from '../../lib/supabase'`
2. **Add usersService import**: Import the new users service
3. **Replace email resolution**: Use `usersService.getUsersByEmails()` instead of direct query
4. **Replace leave request insert**: Use `leaveRequestsService.createLeaveRequest()` with auto-approve status
5. **Replace leave query**: Use `leaveRequestsService.getLeaveRequestsByDateRange()` and filter by status

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify the current behavior works correctly on unfixed code to establish a baseline, then verify the refactored code produces identical behavior while following the architecture pattern.

### Exploratory Fault Condition Checking

**Goal**: Identify all direct Supabase imports in page components BEFORE implementing the fix. Confirm the architecture violations exist and document the expected behavior.

**Test Plan**: Use code analysis tools (grep, AST parsing) to find all instances of direct Supabase imports in page components. For each violation, document the current behavior by running the application and testing the affected features.

**Test Cases**:
1. **LeaveBalances Component**: Test viewing balances as different roles (agent, TL, WFM) - verify role-based filtering works
2. **CreateLeaveRequest Component**: Test creating leave requests, including "submit on behalf" feature - verify all scenarios work
3. **CreateSwapRequest Component**: Test creating swap requests with "submit on behalf" - verify all data is saved correctly
4. **ScheduleUpload Component**: Test CSV import/export functionality - verify parsing and bulk operations work

**Expected Counterexamples**:
- Direct `supabase.from()` calls found in page components
- Imports of `{ supabase }` from `'../../lib/supabase'` in non-service files
- Inconsistent error handling compared to service layer methods

### Fix Checking

**Goal**: Verify that for all page components that previously used direct Supabase calls, the refactored code uses service layer methods and produces the expected behavior.

**Pseudocode:**
```
FOR ALL pageComponent WHERE isBugCondition(pageComponent) DO
  refactoredComponent := applyServiceLayerRefactoring(pageComponent)
  ASSERT NOT containsDirectSupabaseCalls(refactoredComponent)
  ASSERT usesServiceLayerMethods(refactoredComponent)
  ASSERT functionallyEquivalent(pageComponent, refactoredComponent)
END FOR
```

**Test Cases:**
1. **Service Layer Compliance**: Verify no direct Supabase imports remain in page components
2. **Method Existence**: Verify all required service methods exist and are properly exported
3. **Functional Equivalence**: Verify each refactored feature produces identical results

### Preservation Checking

**Goal**: Verify that for all user interactions and data operations, the refactored code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL userInteraction WHERE NOT affectsInternalImplementation(userInteraction) DO
  ASSERT originalBehavior(userInteraction) = refactoredBehavior(userInteraction)
END FOR
```

**Testing Approach**: Manual testing and integration tests are recommended for preservation checking because:
- The changes affect internal implementation, not external behavior
- We need to verify complex user workflows remain unchanged
- Database operations need to be tested with real data scenarios
- Role-based access control must be verified for each user type

**Test Plan**: Test all affected features with the original code first to document expected behavior, then test with refactored code to verify identical behavior.

**Test Cases**:
1. **Leave Balances Viewing**: Verify agents see only their balances, TLs see team balances, WFM sees all balances
2. **Leave Balances Editing**: Verify WFM can edit balances and history is recorded correctly
3. **Leave Balances CSV Import/Export**: Verify CSV parsing, validation, and bulk operations work identically
4. **Leave Request Creation**: Verify form validation, balance checking, and auto-deny logic work correctly
5. **Leave Request "Submit on Behalf"**: Verify WFM/TL can submit for other users
6. **Swap Request Creation**: Verify shift selection, validation, and request creation work correctly
7. **Swap Request "Submit on Behalf"**: Verify WFM/TL can submit for other users
8. **Schedule Upload**: Verify CSV parsing, shift/leave creation, and export functionality work correctly
9. **Error Handling**: Verify error messages remain the same for validation failures and server errors
10. **Performance**: Verify page load times and operation speeds remain similar

### Unit Tests

- Test new `usersService` methods with mock Supabase client
- Test extended `leaveBalancesService.getAllLeaveBalances()` method
- Test `leaveRequestsService.createLeaveRequest()` with custom status parameter
- Test service method error handling matches Supabase error patterns

### Property-Based Tests

- Generate random user roles and verify role-based filtering works correctly across all components
- Generate random CSV data and verify import/export produces consistent results
- Generate random leave request scenarios and verify validation logic is preserved
- Test that service layer methods handle edge cases (empty results, invalid IDs, etc.)

### Integration Tests

- Test full leave balance workflow: view → edit → save → verify history
- Test full leave request workflow: create → validate balance → submit → verify status
- Test full swap request workflow: select shifts → submit → verify data saved
- Test full schedule upload workflow: parse CSV → validate → upload → export → verify consistency
- Test role-based access control across all affected pages
- Test error scenarios: network failures, validation errors, concurrent updates
