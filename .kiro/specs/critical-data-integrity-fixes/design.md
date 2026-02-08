# Design Document: Critical Data Integrity Fixes

## Overview

This design addresses critical data integrity vulnerabilities in the WFM system that can lead to database inconsistencies and business logic violations. The fixes focus on four key areas:

1. **Atomic Swap Execution**: Ensuring all 4 shift updates in a swap operation succeed or fail together
2. **Service-Level Leave Balance Validation**: Moving validation from UI to service layer to prevent bypass via direct API calls
3. **Comprehensive Input Validation**: Validating all inputs at the service layer (UUIDs, enums, string lengths, dates)
4. **Race Condition Prevention**: Using optimistic locking to handle concurrent approval attempts

The implementation will use TypeScript with Supabase (PostgreSQL) and maintain backward compatibility with existing functionality.

## Architecture

### Current Architecture Issues

**Swap Execution Problem:**
- Currently in `SwapRequestDetail.tsx`, the `handleApprove()` function executes 4 separate `shiftsService.updateShift()` calls
- Each call is a separate database transaction
- If any update fails (e.g., network error, database constraint), previous updates remain committed
- Result: Database left in inconsistent state with partially swapped shifts

**Leave Balance Validation Problem:**
- Validation exists only in UI (`CreateLeaveRequest.tsx`)
- Direct API calls to `leaveRequestsService.createLeaveRequest()` bypass validation
- No check for overlapping leave dates
- No business day calculation at service layer

**Input Validation Problem:**
- Services accept raw inputs without validation
- No UUID format checks
- No enum value validation
- No string length limits enforced at service layer

**Race Condition Problem:**
- No optimistic locking when updating request status
- Two approvers can simultaneously approve/reject the same request
- Status changes can conflict and cause unexpected behavior

### Proposed Architecture

**1. Atomic Swap Execution via Stored Procedure:**
```
┌─────────────────────────────────────────────────────────────┐
│  SwapRequestDetail.tsx (UI)                                 │
│  - handleApprove() calls swapRequestsService.executeSwap()  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  swapRequestsService.ts                                     │
│  - executeSwap() calls Supabase RPC function                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL Stored Procedure: execute_shift_swap()          │
│  BEGIN TRANSACTION                                          │
│    1. Validate all 4 shifts exist                           │
│    2. Update shift 1 (requester on requester date)          │
│    3. Update shift 2 (target on requester date)             │
│    4. Update shift 3 (requester on target date)             │
│    5. Update shift 4 (target on target date)                │
│  COMMIT or ROLLBACK on error                                │
└─────────────────────────────────────────────────────────────┘
```

**2. Service-Level Validation Layer:**
```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer (CreateLeaveRequest.tsx)                          │
│  - Basic form validation (Zod schemas)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Service Layer (leaveRequestsService.ts)                    │
│  - validateLeaveRequest()                                   │
│    • Check leave balance                                    │
│    • Check overlapping dates                                │
│    • Validate date ranges                                   │
│    • Calculate business days                                │
│  - createLeaveRequest()                                     │
│    • Validate inputs (UUIDs, enums, strings)                │
│    • Call validateLeaveRequest()                            │
│    • Insert to database                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Database (Supabase/PostgreSQL)                             │
└─────────────────────────────────────────────────────────────┘
```

**3. Optimistic Locking Pattern:**
```
┌─────────────────────────────────────────────────────────────┐
│  Service Layer                                              │
│  updateSwapRequestStatus(id, newStatus, expectedStatus)     │
│    1. Read current status from database                     │
│    2. Compare with expectedStatus                           │
│    3. If mismatch, throw error                              │
│    4. If match, update with WHERE clause checking status    │
│    5. Check affected rows (0 = conflict, 1 = success)       │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Input Validation Module

**Location:** `src/services/validation/inputValidation.ts`

**Purpose:** Centralized input validation for all service layer operations

**Functions:**

```typescript
// UUID validation
function validateUUID(value: string, fieldName: string): void
  - Validates UUID v4 format using regex
  - Throws ValidationError with descriptive message if invalid

// Enum validation
function validateEnum<T>(value: string, allowedValues: T[], fieldName: string): void
  - Checks if value exists in allowedValues array
  - Throws ValidationError with descriptive message if invalid

// String length validation
function validateStringLength(value: string, maxLength: number, fieldName: string): void
  - Checks if string length <= maxLength
  - Throws ValidationError with descriptive message if too long

// Date format validation
function validateDateFormat(value: string, fieldName: string): void
  - Validates ISO 8601 format (YYYY-MM-DD)
  - Throws ValidationError with descriptive message if invalid

// Date range validation
function validateDateRange(startDate: string, endDate: string): void
  - Validates start <= end
  - Validates start is not in past
  - Validates end is not more than 365 days in future
  - Throws ValidationError with descriptive message if invalid
```

**Error Format:**
```typescript
class ValidationError extends Error {
  constructor(
    public field: string,
    public message: string,
    public code: string
  )
}
```

### 2. Leave Balance Validation Module

**Location:** `src/services/validation/leaveBalanceValidation.ts`

**Purpose:** Business logic validation for leave requests

**Functions:**

```typescript
// Check if user has sufficient leave balance
async function validateLeaveBalance(
  userId: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string
): Promise<ValidationResult>
  - Calculate business days in date range
  - Fetch current leave balance
  - Compare requested days vs available balance
  - Return { valid: boolean, error?: string, requestedDays: number, availableDays: number }

// Check for overlapping leave requests
async function checkOverlappingLeave(
  userId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<ValidationResult>
  - Query leave_requests table for user
  - Check for date range overlaps
  - Return { valid: boolean, error?: string, conflictingRequest?: LeaveRequest }

// Calculate business days (excluding weekends)
function calculateBusinessDays(startDate: string, endDate: string): number
  - Use existing getBusinessDaysBetween() from dateHelpers
  - Returns count of weekdays in range
```

### 3. Swap Execution Stored Procedure

**Location:** `supabase/migrations/008_atomic_swap_execution.sql`

**Purpose:** Execute all 4 shift updates atomically

**Stored Procedure Signature:**
```sql
CREATE OR REPLACE FUNCTION execute_shift_swap(
  p_requester_id UUID,
  p_target_user_id UUID,
  p_requester_date DATE,
  p_target_date DATE
) RETURNS JSON
```

**Logic:**
1. BEGIN TRANSACTION
2. Find all 4 shift records:
   - Requester on requester_date
   - Target on requester_date
   - Requester on target_date
   - Target on target_date
3. Validate all 4 shifts exist (throw error if any missing)
4. Store original shift_type values
5. Execute 4 UPDATE statements:
   - Requester on requester_date gets target's shift_type from requester_date
   - Target on requester_date gets requester's shift_type from requester_date
   - Requester on target_date gets target's shift_type from target_date
   - Target on target_date gets requester's shift_type from target_date
6. COMMIT transaction
7. Return JSON with success status and updated shift IDs

**Error Handling:**
- If any shift not found: ROLLBACK and return error
- If any UPDATE fails: ROLLBACK and return error
- Return detailed error messages for debugging

### 4. Enhanced Service Layer Functions

**swapRequestsService.ts:**

```typescript
// New function: Execute swap atomically
async function executeSwap(swapRequest: SwapRequest): Promise<void>
  - Validate swap request status is 'approved'
  - Call Supabase RPC: execute_shift_swap()
  - Handle errors and throw descriptive exceptions

// Enhanced function: Update status with optimistic locking
async function updateSwapRequestStatus(
  id: string,
  newStatus: SwapRequestStatus,
  expectedStatus: SwapRequestStatus,
  approvalField?: 'tl_approved_at' | 'wfm_approved_at'
): Promise<SwapRequest>
  - Validate UUID format for id
  - Validate enum value for newStatus
  - Query current status
  - Compare with expectedStatus
  - If mismatch, throw ConcurrencyError
  - Update with WHERE clause checking status
  - Check affected rows
  - Return updated request

// Enhanced function: Create swap request with validation
async function createSwapRequest(request: CreateSwapRequestInput): Promise<SwapRequest>
  - Validate all UUIDs (requester_id, target_user_id, shift IDs)
  - Validate requester_id !== target_user_id (no self-swaps)
  - Validate shift IDs exist
  - Insert to database
  - Return created request
```

**leaveRequestsService.ts:**

```typescript
// Enhanced function: Create leave request with validation
async function createLeaveRequest(request: CreateLeaveRequestInput): Promise<LeaveRequest>
  - Validate UUID format for user_id
  - Validate enum value for leave_type
  - Validate date formats
  - Validate date range (start <= end, not in past, not > 365 days future)
  - Validate string length for notes
  - Call validateLeaveBalance()
  - Call checkOverlappingLeave()
  - If validation fails, throw ValidationError
  - Insert to database
  - Return created request

// Enhanced function: Update status with optimistic locking
async function updateLeaveRequestStatus(
  id: string,
  newStatus: LeaveRequestStatus,
  expectedStatus: LeaveRequestStatus,
  approvalField?: 'tl_approved_at' | 'wfm_approved_at'
): Promise<LeaveRequest>
  - Validate UUID format for id
  - Validate enum value for newStatus
  - Query current status
  - Compare with expectedStatus
  - If mismatch, throw ConcurrencyError
  - Update with WHERE clause checking status
  - Check affected rows
  - Return updated request
```

## Data Models

### Existing Models (No Changes)

The existing data models remain unchanged:
- `SwapRequest` (from `src/types/index.ts`)
- `LeaveRequest` (from `src/types/index.ts`)
- `Shift` (from `src/types/index.ts`)
- `LeaveBalance` (from `src/types/index.ts`)

### New Error Types

**Location:** `src/types/errors.ts`

```typescript
// Base error for validation failures
export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Error for concurrent modification conflicts
export class ConcurrencyError extends Error {
  constructor(
    public resourceType: string,
    public resourceId: string,
    public expectedStatus: string,
    public actualStatus: string
  ) {
    super(
      `Concurrent modification detected for ${resourceType} ${resourceId}. ` +
      `Expected status '${expectedStatus}' but found '${actualStatus}'. ` +
      `Please refresh and try again.`
    )
    this.name = 'ConcurrencyError'
  }
}

// Error for insufficient leave balance
export class InsufficientBalanceError extends ValidationError {
  constructor(
    public requestedDays: number,
    public availableDays: number,
    public leaveType: string
  ) {
    super(
      'leave_balance',
      `Insufficient ${leaveType} leave balance. Requested: ${requestedDays} days, Available: ${availableDays} days`,
      'INSUFFICIENT_BALANCE'
    )
  }
}

// Error for overlapping leave dates
export class OverlappingLeaveError extends ValidationError {
  constructor(
    public conflictingRequestId: string,
    public conflictingDateRange: { start: string; end: string }
  ) {
    super(
      'date_range',
      `Leave request overlaps with existing request from ${conflictingDateRange.start} to ${conflictingDateRange.end}`,
      'OVERLAPPING_LEAVE'
    )
  }
}
```

### New Input Types

**Location:** `src/types/inputs.ts`

```typescript
// Input for creating swap request (with validation)
export interface CreateSwapRequestInput {
  requester_id: string        // Must be valid UUID
  target_user_id: string       // Must be valid UUID, different from requester_id
  requester_shift_id: string   // Must be valid UUID
  target_shift_id: string      // Must be valid UUID
}

// Input for creating leave request (with validation)
export interface CreateLeaveRequestInput {
  user_id: string              // Must be valid UUID
  leave_type: LeaveType        // Must be valid enum value
  start_date: string           // Must be ISO 8601 format, not in past
  end_date: string             // Must be ISO 8601 format, <= 365 days future
  notes?: string | null        // Max 500 characters
}

// Result of validation checks
export interface ValidationResult {
  valid: boolean
  error?: string
  details?: Record<string, any>
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Requirements 2.2, 2.6, 3.2, 3.4, 3.6, 3.8, 3.10, 4.2, 4.4, and 6.3 are redundant - they test error message content for validations already covered by other properties
- Requirement 2.4 is redundant with 2.3 (business day calculation inherently excludes weekends)
- Requirements 1.1 and 1.2 can be combined into a single atomicity property
- Input validation properties (3.1, 3.3, 3.5, 3.7, 3.9) can be consolidated into comprehensive validation properties

The following properties provide unique validation value without redundancy:

### Property 1: Swap Execution Atomicity

*For any* approved swap request involving 4 shift records, executing the swap should result in either all 4 shifts being updated successfully or all 4 shifts remaining in their original state (no partial updates).

**Validates: Requirements 1.1, 1.2**

### Property 2: Swap Pre-Validation

*For any* swap execution attempt, if any of the 4 required shift records do not exist, the system should reject the swap before making any database changes.

**Validates: Requirements 1.3**

### Property 3: Swap Revoke Atomicity

*For any* approved swap that is revoked, the revoke operation should restore all 4 shift records to their original state atomically (all restored or none restored).

**Validates: Requirements 1.5**

### Property 4: Leave Balance Validation

*For any* leave request, if the requested business days exceed the available leave balance for that leave type, the system should reject the request.

**Validates: Requirements 2.1, 2.2**

### Property 5: Business Day Calculation

*For any* date range, the calculated business days should equal the count of weekdays (Monday-Friday) in that range, excluding all Saturdays and Sundays.

**Validates: Requirements 2.3, 2.4**

### Property 6: Overlapping Leave Detection

*For any* user, if a new leave request has date ranges that overlap with an existing leave request for that user, the system should reject the new request.

**Validates: Requirements 2.5, 2.6**

### Property 7: Leave Date Range Validation

*For any* leave request, the system should reject requests where: (a) start date is in the past, (b) end date is more than 365 days in the future, or (c) start date is after end date.

**Validates: Requirements 2.7, 2.8, 2.9**

### Property 8: UUID Format Validation

*For any* service function that accepts UUID parameters, providing an invalid UUID format should result in rejection with an error indicating the invalid field.

**Validates: Requirements 3.1, 3.2**

### Property 9: Enum Value Validation

*For any* service function that accepts enum parameters (leave_type, shift_type, status), providing a value not in the allowed set should result in rejection with an error indicating the invalid field.

**Validates: Requirements 3.3, 3.4**

### Property 10: String Length Validation

*For any* service function that accepts string parameters with length limits (notes, comments), providing a string exceeding the maximum length should result in rejection with an error indicating the field and limit.

**Validates: Requirements 3.5, 3.6**

### Property 11: Self-Swap Prevention

*For any* swap request creation attempt, if the requester_id equals the target_user_id, the system should reject the request with an error indicating self-swaps are not allowed.

**Validates: Requirements 3.7, 3.8**

### Property 12: Date Format Validation

*For any* service function that accepts date parameters, providing a date not in ISO 8601 format (YYYY-MM-DD) should result in rejection with an error indicating the invalid field.

**Validates: Requirements 3.9, 3.10**

### Property 13: Swap Status Optimistic Locking

*For any* swap request status update, if the current status in the database differs from the expected status provided by the caller, the system should reject the update and return an error indicating a concurrent modification was detected.

**Validates: Requirements 4.1, 4.2, 4.6**

### Property 14: Leave Status Optimistic Locking

*For any* leave request status update, if the current status in the database differs from the expected status provided by the caller, the system should reject the update and return an error indicating a concurrent modification was detected.

**Validates: Requirements 4.3, 4.4, 4.6**

### Property 15: Error Message Consistency

*For any* validation error, the error object should contain a 'message' field, a 'field' field (indicating which field failed validation), and a 'code' field (indicating the error type).

**Validates: Requirements 5.3, 6.1**

### Property 16: Insufficient Balance Error Details

*For any* leave request rejected due to insufficient balance, the error message should contain both the requested number of days and the available number of days.

**Validates: Requirements 6.4**

### Property 17: Overlapping Leave Error Details

*For any* leave request rejected due to overlapping dates, the error message should contain the conflicting date range (start and end dates).

**Validates: Requirements 6.5**

## Error Handling

### Error Types and Handling Strategy

**1. Validation Errors (ValidationError)**
- Thrown when input validation fails
- Contains: field name, error message, error code
- HTTP Status: 400 Bad Request
- User Action: Fix input and retry

**2. Concurrency Errors (ConcurrencyError)**
- Thrown when optimistic locking detects concurrent modification
- Contains: resource type, resource ID, expected status, actual status
- HTTP Status: 409 Conflict
- User Action: Refresh page and retry

**3. Insufficient Balance Errors (InsufficientBalanceError)**
- Thrown when leave request exceeds available balance
- Contains: requested days, available days, leave type
- HTTP Status: 400 Bad Request
- User Action: Reduce requested days or choose different leave type

**4. Overlapping Leave Errors (OverlappingLeaveError)**
- Thrown when leave dates overlap with existing request
- Contains: conflicting request ID, conflicting date range
- HTTP Status: 409 Conflict
- User Action: Choose different dates

**5. Transaction Errors (Database Errors)**
- Thrown when database operations fail
- Contains: operation name, underlying error message
- HTTP Status: 500 Internal Server Error
- User Action: Retry or contact support

### Error Propagation

```
Service Layer (throws typed errors)
        ↓
Error Handler Middleware (catches and formats)
        ↓
HTTP Response (JSON with error details)
        ↓
UI Layer (displays user-friendly message)
```

### Error Logging

All errors should be logged with:
- Timestamp
- User ID (if available)
- Operation being performed
- Error type and message
- Stack trace (for unexpected errors)
- Request parameters (sanitized)

### Graceful Degradation

- If stored procedure fails, fall back to sequential updates with explicit transaction handling
- If validation service is unavailable, reject request with "service unavailable" error
- If database connection fails, queue operation for retry (for non-critical operations)

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Specific examples of valid and invalid inputs
- Edge cases (empty strings, boundary values, null/undefined)
- Error message format verification
- Integration points between components
- Stored procedure execution with mocked database

**Property-Based Tests:**
- Universal properties across all inputs (see Correctness Properties section)
- Randomized input generation for comprehensive coverage
- Each property test runs minimum 100 iterations
- Tests validate behavior across wide range of scenarios

### Property-Based Testing Configuration

**Library:** fast-check (for TypeScript/JavaScript)

**Test Structure:**
```typescript
// Example property test structure
test('Property 1: Swap Execution Atomicity', async () => {
  // Feature: critical-data-integrity-fixes, Property 1: Swap Execution Atomicity
  await fc.assert(
    fc.asyncProperty(
      // Generators for swap request, shifts, etc.
      swapRequestArbitrary(),
      shiftsArbitrary(),
      async (swapRequest, shifts) => {
        // Test atomicity: all 4 updates or none
        // ...
      }
    ),
    { numRuns: 100 }
  )
})
```

**Each property test must:**
1. Reference its design document property number in a comment
2. Use the tag format: `Feature: critical-data-integrity-fixes, Property {number}: {property_text}`
3. Run minimum 100 iterations
4. Generate randomized inputs covering edge cases
5. Verify the universal property holds for all generated inputs

### Test Coverage Goals

- **Unit Test Coverage:** 90%+ of service layer code
- **Property Test Coverage:** All 17 correctness properties
- **Integration Test Coverage:** End-to-end workflows (swap execution, leave request creation)
- **Edge Case Coverage:** Boundary values, null/undefined, empty collections, concurrent operations

### Testing Environments

**Local Development:**
- Use Supabase local development environment
- Mock external dependencies
- Fast feedback loop for TDD

**CI/CD Pipeline:**
- Run all unit tests and property tests
- Use test database with known seed data
- Fail build on any test failure

**Staging:**
- Run integration tests against staging database
- Test with production-like data volumes
- Verify performance under load

### Test Data Generation

**For Property Tests:**
- Use fast-check generators for primitive types
- Create custom generators for domain types (SwapRequest, LeaveRequest, etc.)
- Ensure generators produce both valid and invalid inputs
- Include edge cases in generator distributions

**For Unit Tests:**
- Use factory functions for test data creation
- Maintain test fixtures for common scenarios
- Use realistic data that mirrors production

### Regression Testing

- Maintain existing test suite (all tests must pass)
- Add new tests for each bug fix
- Run full test suite before each deployment
- Monitor test execution time and optimize slow tests
