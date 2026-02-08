# Requirements Document

## Introduction

This document specifies requirements for critical data integrity fixes in the Workforce Management (WFM) system. The system currently has several data corruption risks that can lead to inconsistent database states and business logic violations. These fixes address atomic transaction handling, service-level validation, input validation, and race condition prevention.

## Glossary

- **System**: The Workforce Management (WFM) application
- **Swap_Service**: The service layer component responsible for processing shift swap requests
- **Leave_Service**: The service layer component responsible for processing leave requests
- **Shift_Record**: A database record representing an employee's shift assignment for a specific date
- **Swap_Request**: A request from one employee to exchange shifts with another employee
- **Leave_Request**: A request from an employee to take time off
- **Leave_Balance**: The available leave days for an employee by leave type
- **Transaction**: A database operation that ensures all-or-nothing execution
- **Stored_Procedure**: A database function that executes multiple operations atomically
- **Optimistic_Lock**: A concurrency control mechanism that checks if data has changed before updating
- **Business_Day**: A weekday (Monday-Friday), excluding weekends
- **UUID**: Universally Unique Identifier, a 128-bit identifier format
- **Enum_Value**: A predefined set of valid values for a field
- **API_Call**: A direct request to the service layer bypassing the UI

## Requirements

### Requirement 1: Atomic Swap Execution

**User Story:** As a WFM administrator, I want shift swaps to execute atomically, so that the database never ends up in an inconsistent state if any part of the swap fails.

#### Acceptance Criteria

1. WHEN a swap request is approved, THE System SHALL execute all 4 shift updates within a single transaction
2. IF any of the 4 shift updates fails, THEN THE System SHALL roll back all changes and maintain the original state
3. WHEN executing a swap, THE System SHALL validate that all 4 shift records exist before beginning the transaction
4. WHEN a swap transaction fails, THE System SHALL return a descriptive error message indicating which validation failed
5. WHEN a swap is revoked, THE System SHALL restore all 4 shift records atomically within a single transaction
6. THE System SHALL implement swap execution using a Supabase stored procedure or transaction wrapper

### Requirement 2: Service-Level Leave Balance Validation

**User Story:** As a system administrator, I want leave balance validation enforced at the service layer, so that users cannot bypass validation through direct API calls.

#### Acceptance Criteria

1. WHEN a leave request is created, THE Leave_Service SHALL validate that the user has sufficient leave balance before creating the request
2. WHEN a leave request exceeds available balance, THE Leave_Service SHALL auto-deny the request and return an error message
3. WHEN validating leave balance, THE Leave_Service SHALL calculate the number of business days in the requested date range
4. WHEN calculating business days, THE Leave_Service SHALL exclude weekends (Saturday and Sunday)
5. WHEN a leave request is created, THE Leave_Service SHALL check for overlapping leave dates for the same user
6. WHEN overlapping leave dates are detected, THE Leave_Service SHALL reject the request with a descriptive error message
7. WHEN a leave request is created, THE Leave_Service SHALL validate that the start date is not in the past
8. WHEN a leave request is created, THE Leave_Service SHALL validate that the end date is not more than 365 days in the future
9. WHEN a leave request is created, THE Leave_Service SHALL validate that the start date is before or equal to the end date

### Requirement 3: Comprehensive Input Validation

**User Story:** As a security-conscious developer, I want all service inputs validated, so that invalid data cannot corrupt the database or cause runtime errors.

#### Acceptance Criteria

1. WHEN a service function receives a UUID parameter, THE System SHALL validate that it conforms to UUID format
2. WHEN an invalid UUID is provided, THE System SHALL reject the request with a descriptive error message
3. WHEN a service function receives an enum value, THE System SHALL validate that it matches one of the allowed values
4. WHEN an invalid enum value is provided, THE System SHALL reject the request with a descriptive error message
5. WHEN a service function receives a string field, THE System SHALL validate that it does not exceed maximum length limits
6. WHEN a string exceeds maximum length, THE System SHALL reject the request with a descriptive error message
7. WHEN a swap request is created, THE Swap_Service SHALL validate that the requester and target user are different
8. WHEN a self-swap is attempted, THE Swap_Service SHALL reject the request with a descriptive error message
9. WHEN a service function receives a date field, THE System SHALL validate that it conforms to ISO 8601 format
10. WHEN an invalid date format is provided, THE System SHALL reject the request with a descriptive error message

### Requirement 4: Race Condition Prevention

**User Story:** As a WFM administrator, I want concurrent approval attempts to be handled safely, so that conflicting approvals do not cause data corruption.

#### Acceptance Criteria

1. WHEN approving a swap request, THE Swap_Service SHALL verify that the request status has not changed since it was loaded
2. WHEN a status conflict is detected, THE Swap_Service SHALL reject the approval and return a descriptive error message
3. WHEN approving a leave request, THE Leave_Service SHALL verify that the request status has not changed since it was loaded
4. WHEN a status conflict is detected, THE Leave_Service SHALL reject the approval and return a descriptive error message
5. THE System SHALL use optimistic locking pattern to detect concurrent modifications
6. WHEN a concurrent modification is detected, THE System SHALL return an error message instructing the user to refresh and retry

### Requirement 5: Backward Compatibility

**User Story:** As a developer, I want all changes to maintain backward compatibility, so that existing functionality continues to work without modification.

#### Acceptance Criteria

1. WHEN data integrity fixes are deployed, THE System SHALL maintain all existing API signatures
2. WHEN data integrity fixes are deployed, THE System SHALL continue to support all existing UI workflows
3. WHEN validation errors occur, THE System SHALL return error messages in the same format as existing errors
4. THE System SHALL not require database schema changes except for the swap execution stored procedure
5. WHEN existing tests are run, THE System SHALL pass all tests that passed before the changes

### Requirement 6: Error Handling and Reporting

**User Story:** As a user, I want clear error messages when operations fail, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a validation error occurs, THE System SHALL return an error message that clearly describes the validation that failed
2. WHEN a transaction fails, THE System SHALL return an error message that indicates which operation failed
3. WHEN a race condition is detected, THE System SHALL return an error message instructing the user to refresh and retry
4. WHEN insufficient leave balance is detected, THE System SHALL return an error message showing the requested days and available balance
5. WHEN overlapping leave dates are detected, THE System SHALL return an error message showing the conflicting date range
6. THE System SHALL log all validation failures and transaction errors for debugging purposes
