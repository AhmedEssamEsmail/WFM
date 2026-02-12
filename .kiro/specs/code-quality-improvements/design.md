# Design Document: Code Quality Improvements

## Overview

This design document outlines the technical approach for addressing all code quality issues identified in the WFM codebase. The improvements are organized into six workstreams that can be executed in parallel or sequentially depending on team capacity. Each workstream addresses specific categories of issues while maintaining backward compatibility and ensuring no regressions are introduced.

The design follows a phased approach where critical security and type safety issues are addressed first, followed by performance optimizations, accessibility improvements, and finally testing and documentation enhancements. This prioritization ensures that the most impactful issues are resolved early in the process.

## Architecture

### Overall Structure

The codebase follows a layered architecture with React components at the presentation layer, custom hooks for state management and data fetching, services for business logic, and utilities for common operations. The improvements will touch all layers while maintaining clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Components │  │   Pages     │  │     Modals          │  │
│  │  (React)    │  │  (React)    │  │  (with Focus Trap)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   State Management Layer                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Hooks      │  │  Context    │  │     State           │  │
│  │  (useLeave  │  │  (Auth,     │  │     (Redux/Context) │  │
│  │   Requests) │  │   Error)    │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   Business Logic Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Services   │  │ Validation  │  │     Constants       │  │
│  │  (Break     │  │  (Validator │  │     (Magic Strings  │  │
│  │   Schedules)│  │   Module)   │  │      Extracted)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Data Access Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Supabase   │  │   Types     │  │     Error Handler   │  │
│  │  Client     │  │  (Exported) │  │     (PII Filtered)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

The primary design decision is to implement improvements incrementally without breaking existing functionality. Each workstream will introduce changes that are backward compatible and can be tested independently. This approach minimizes risk and allows for gradual rollout of improvements.

Another key decision is to consolidate validation logic into a single module. Currently, validation is split between `src/utils/validation.ts` and `src/validation/validators.ts`, leading to duplication and potential inconsistencies. The new design will have a single source of truth for validation rules.

For type safety, the design calls for replacing `as any` casts with proper generic typing and type guards. This will improve IDE support for autocomplete and error detection while making the code more maintainable.

## Components and Interfaces

### Type Safety Components

The type safety improvements will introduce several new type definitions and interfaces to replace the current `as any` casts and implicit `any` types.

**Generic Validator Type:**
```typescript
interface Validator<T, K extends keyof T> {
  validateField(obj: T, field: K): ValidationResult<T[K]>;
  validateAll(obj: T): ValidationResult<T>;
}

type ValidationResult<T> = 
  | { valid: true; value: T }
  | { valid: false; errors: string[] };
```

**Error Type Union:**
```typescript
type AuthError = 
  | AuthenticationError 
  | TokenExpiredError 
  | PermissionDeniedError
  | NetworkError;

interface AuthError {
  code: string;
  message: string;
  timestamp: Date;
  recoverable: boolean;
}
```

### Validation Components

The validation improvements will consolidate existing validation logic and add new validation rules for break schedule rules and color values.

**Break Schedule Validation:**
```typescript
interface BreakScheduleRule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  maxConsecutiveWork: number;
  applicableDays: DayOfWeek[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function validateBreakScheduleRule(rule: BreakScheduleRule): ValidationResult;
```

**Color Validation:**
```typescript
function isValidHexColor(color: string): boolean;
function sanitizeColorForStyle(color: string): string;
```

### Performance Components

The performance improvements will introduce pagination interfaces and optimized data structures.

**Pagination Interface:**
```typescript
interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface UsePaginationOptions<T> {
  fetchFn: (params: PaginationParams) => Promise<PaginatedResult<T>>;
  initialPageSize?: number;
}
```

**Interval Map Optimization:**
```typescript
class IntervalMap<T> {
  constructor(intervalSize: number);
  insert(start: number, end: number, value: T): void;
  query(point: number): T[];
  precomputeTemplates(): void;
}
```

### Accessibility Components

The accessibility improvements will add focus trap functionality and improve ARIA label coverage.

**Focus Trap:**
```typescript
function createFocusTrap(container: HTMLElement): FocusTrap;
interface FocusTrap {
  activate(): void;
  deactivate(): void;
  updateContainerElement(container: HTMLElement): void;
}
```

**Accessible Icon Component:**
```typescript
interface IconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel: string;
  role?: 'img' | 'presentation';
}

function Icon({ name, size, ariaLabel, role = 'img' }: IconProps): JSX.Element;
```

### Error Handling Components

The error handling improvements will introduce consistent error patterns and PII filtering.

**Error Handler:**
```typescript
interface ErrorHandlerOptions {
  includeStackTrace: boolean;
  filterPII: boolean;
  maxLogSize: number;
}

function createErrorHandler(options: ErrorHandlerOptions): ErrorHandler;

interface ErrorHandler {
  log(error: Error, context?: Record<string, unknown>): void;
  handle(error: Error): void;
  sanitizeForLog(data: Record<string, unknown>): Record<string, unknown>;
}
```

### Constants

Magic strings will be extracted to named constants:

```typescript
const TABLE_NAMES = {
  LEAVE_REQUESTS: 'leave_requests',
  SWAP_REQUESTS: 'swap_requests',
  OVERTIME_REQUESTS: 'overtime_requests',
  BREAK_SCHEDULES: 'break_schedules',
  USERS: 'users',
  TEAMS: 'teams',
} as const;

const TIME_RANGES = {
  DASHBOARD_RECENT_ITEMS: 10,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SUPABASE_TIMEOUT_MS: 30000,
} as const;

const ERROR_MESSAGES = {
  MISSING_ENV_VAR: (name: string) => `Missing required environment variable: ${name}`,
  VALIDATION_FAILED: (field: string) => `Validation failed for field: ${field}`,
} as const;
```

## Data Models

### Type Exports

All types will be exported from barrel files to enable external consumption:

```typescript
// src/services/types.ts
export * from './breakSchedulesService';
export * from './leaveRequestsService';
export * from './swapRequestsService';
export * from './overtimeRequestsService';

// src/hooks/types.ts
export * from './useLeaveRequests';
export * from './useSwapRequests';
export * from './useOvertimeRequests';
```

### Error Models

Error types will be explicitly defined:

```typescript
// src/types/errors.ts
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class PIIFilterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PIIFilterError';
  }
}
```

### Pagination Models

Pagination will use consistent models across all hooks:

```typescript
// src/types/pagination.ts
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  error: Error | null;
}

export interface PaginationActions {
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Acceptence Criteria Testing Prework

1.1. WHEN the Validator processes dynamic field access, THE System SHALL use proper generic typing instead of `as any` casts to maintain type safety.
  Thoughts: This is about ensuring type safety across all validator operations. We can generate random objects with various field types and verify that the validator correctly type-checks each field without using `as any` casts.
  Testable: yes - property

1.2. WHEN validators.ts is modified, THE System SHALL ensure no `as any` type assertions remain on lines 219 and 279.
  Thoughts: This is a specific check for two lines. We can use static analysis to verify no `as any` exists, or we can test that the validator works correctly with properly typed code.
  Testable: yes - property

1.3. WHEN types are defined in service files, THE System SHALL export them from the corresponding barrel files for external consumption.
  Thoughts: This is about module exports. We can test that importing from barrel files includes all expected types.
  Testable: yes - property

1.4. WHEN AuthContext handles errors, THE System SHALL use explicit error type unions instead of implicit `any` types.
  Thoughts: This is about type definitions. We can verify that error handlers use the explicit type union and that TypeScript correctly narrows types in error handling code.
  Testable: yes - property

1.5. WHEN loose type assertions are encountered, THE System SHALL replace them with proper type guards or explicit type conversions.
  Thoughts: This is about eliminating `as any` throughout the codebase. We can use static analysis to count `as any` occurrences and verify they decrease over time.
  Testable: yes - property

2.1. WHEN break schedule rule validation is required, THE Break_Schedules_Service SHALL implement the TODO at line 267 with complete validation logic.
  Thoughts: This is about implementing missing validation logic. We can test that the validation function correctly validates all aspects of a break schedule rule.
  Testable: yes - property

2.2. WHEN service methods receive parameters, THE System SHALL validate all input parameters before processing.
  Thoughts: This is about input validation. We can generate random invalid inputs and verify they are rejected with appropriate error messages.
  Testable: yes - property

2.3. WHEN color values are used in inline styles, THE System SHALL validate hex color format before application to prevent XSS attacks.
  Thoughts: This is about security validation. We can test that invalid color formats are rejected and that only valid hex colors are accepted.
  Testable: yes - property

2.4. WHEN validation modules exist, THE System SHALL consolidate duplicate validation logic between `src/utils/validation.ts` and `src/validation/validators.ts` to eliminate redundancy.
  Thoughts: This is about code organization. We can verify that there is only one validation module after consolidation.
  Testable: yes - property

2.5. WHEN error handling is performed, THE System SHALL use consistent patterns (either throwing errors or returning error objects, not both).
  Thoughts: This is about consistency in error handling. We can verify that all modules use the same error handling pattern.
  Testable: yes - property

3.1. WHEN useLeaveRequests fetches data, THE System SHALL implement pagination to limit initial payload size.
  Thoughts: This is about pagination behavior. We can verify that the hook accepts pagination parameters and that the fetch function is called with correct pagination options.
  Testable: yes - property

3.2. WHEN useSwapRequests fetches data, THE System SHALL implement pagination to limit initial payload size.
  Thoughts: This is about pagination behavior. We can verify that the hook accepts pagination parameters and that the fetch function is called with correct pagination options.
  Testable: yes - property

3.3. WHEN Break_Schedules_Service builds interval maps, THE System SHALL pre-generate interval templates to eliminate nested loop inefficiency.
  Thoughts: This is about performance optimization. We can measure the time complexity of interval map operations and verify it meets performance requirements.
  Testable: yes - property

3.4. WHEN dashboard queries retrieve swap and leave requests, THE System SHALL limit results to the most recent 10 items.
  Thoughts: This is about limiting query results. We can verify that dashboard queries include limit parameters.
  Testable: yes - property

3.5. WHEN Supabase client connects, THE System SHALL configure timeout settings to prevent hanging requests.
  Thoughts: This is about timeout configuration. We can verify that the Supabase client is initialized with timeout settings.
  Testable: yes - property

4.1. WHEN dynamic color values are used in inline styles, THE System SHALL sanitize all values to prevent XSS attacks through style attributes.
  Thoughts: This is about security sanitization. We can test that malicious color values are sanitized before being used in styles.
  Testable: yes - property

4.2. WHEN error logs are created, THE System SHALL filter PII (email addresses, names, phone numbers) before storage.
  Thoughts: This is about PII filtering. We can test that error logs containing PII are sanitized before storage.
  Testable: yes - property

4.3. WHEN magic strings are used for table names, THE System SHALL extract them to named constants.
  Thoughts: This is about code organization. We can verify that table names are referenced from constants rather than hardcoded strings.
  Testable: yes - property

4.4. WHEN magic strings are used for time ranges, THE System SHALL extract them to named constants.
  Thoughts: This is about code organization. We can verify that time ranges are referenced from constants rather than hardcoded values.
  Testable: yes - property

4.5. WHEN required environment variables are missing at startup, THE System SHALL throw explicit errors indicating which variables are required.
  Thoughts: This is about environment validation. We can test that missing environment variables trigger appropriate errors.
  Testable: yes - property

5.1. WHEN the sidebar collapse button is rendered, THE Layout component SHALL have an aria-label attribute describing its function.
  Thoughts: This is about accessibility attributes. We can verify that the sidebar button has the correct aria-label.
  Testable: yes - property

5.2. WHEN modals are opened, THE System SHALL implement focus trap to keep keyboard focus within the modal until closed.
  Thoughts: This is about focus management. We can test that keyboard focus is trapped within modals.
  Testable: yes - property

5.3. WHEN SVG icons are rendered, THE System SHALL add aria-label attributes to all icon components.
  Thoughts: This is about accessibility attributes. We can verify that all icon components have aria-label attributes.
  Testable: yes - property

5.4. WHEN pagination controls are rendered, THE System SHALL ensure all buttons are keyboard accessible with proper tab order.
  Thoughts: This is about keyboard accessibility. We can verify that pagination buttons are in the tab order and are focusable.
  Testable: yes - property

5.5. WHEN toast notifications are displayed, THE System SHALL include both icon and text labels for screen reader users.
  Thoughts: This is about accessibility of notifications. We can verify that toast notifications include both visual and textual information.
  Testable: yes - property

6.1. WHEN breakSchedulesService is modified, THE System SHALL maintain 100% test coverage for all public methods.
  Thoughts: This is about test coverage. We can run coverage reports and verify that all public methods are tested.
  Testable: yes - property

6.2. WHEN the Dashboard page is modified, THE System SHALL have component tests covering all major user flows.
  Thoughts: This is about component testing. We can verify that Dashboard component tests exist and cover major flows.
  Testable: yes - property

6.3. WHEN ErrorBoundary components are implemented, THE System SHALL have tests verifying error catching and display behavior.
  Thoughts: This is about error boundary testing. We can verify that ErrorBoundary components correctly catch and display errors.
  Testable: yes - property

6.4. WHEN approval workflows are executed, THE System SHALL have integration tests covering the complete approval lifecycle.
  Thoughts: This is about integration testing. We can verify that approval workflows have complete integration test coverage.
  Testable: yes - property

6.5. WHEN performance-related changes are made, THE System SHALL run benchmarks to quantify improvements.
  Thoughts: This is about performance benchmarking. We can verify that benchmark tests exist and produce measurable results.
  Testable: yes - property

7.1. WHEN duplicate validation modules exist, THE System SHALL consolidate them and deprecate the redundant implementation.
  Thoughts: This is about code consolidation. We can verify that only one validation module exists after consolidation.
  Testable: yes - property

7.2. WHEN magic strings are used, THE System SHALL replace them with named constants in appropriate constant files.
  Thoughts: This is about code organization. We can verify that magic strings are replaced with constants.
  Testable: yes - property

7.3. WHEN public functions are created, THE System SHALL add JSDoc comments documenting parameters, return types, and behavior.
  Thoughts: This is about documentation. We can verify that public functions have JSDoc comments.
  Testable: yes - property

7.4. WHEN page components are created, THE System SHALL wrap them in ErrorBoundary components to prevent cascading failures.
  Thoughts: This is about error isolation. We can verify that page components are wrapped in ErrorBoundary components.
  Testable: yes - property

7.5. WHEN error handling patterns are used, THE System SHALL maintain consistency across all modules (either throw or return, not both).
  Thoughts: This is about consistency in error handling. We can verify that all modules use the same error handling pattern.
  Testable: yes - property

8.1. WHEN Phase 1 begins, THE System SHALL address all critical issues (type safety, validation, security) before moving to Phase 2.
  Thoughts: This is about phase completion. We can verify that all Phase 1 acceptance criteria are met before starting Phase 2.
  Testable: yes - property

8.2. WHEN Phase 2 begins, THE System SHALL implement all performance optimizations after critical issues are resolved.
  Thoughts: This is about phase completion. We can verify that all Phase 2 acceptance criteria are met before starting Phase 3.
  Testable: yes - property

8.3. WHEN Phase 3 begins, THE System SHALL implement all accessibility improvements after performance optimizations are complete.
  Thoughts: This is about phase completion. We can verify that all Phase 3 acceptance criteria are met before starting Phase 4.
  Testable: yes - property

8.4. WHEN Phase 4 begins, THE System SHALL implement all testing and documentation improvements after accessibility improvements are complete.
  Thoughts: This is about phase completion. We can verify that all Phase 4 acceptance criteria are met before considering the project complete.
  Testable: yes - property

8.5. WHEN each phase completes, THE System SHALL have passing tests verifying all acceptance criteria for that phase.
  Thoughts: This is about test verification. We can verify that all phase acceptance criteria have corresponding passing tests.
  Testable: yes - property

### Property Reflection

After reviewing all properties identified as testable, I can see several opportunities for consolidation:

- Properties 1.1, 1.2, and 1.5 all relate to eliminating `as any` casts and improving type safety. These can be combined into a single comprehensive property about type safety compliance.
- Properties 2.1, 2.2, 2.3, and 2.4 all relate to validation improvements. These can be combined into a single property about validation completeness.
- Properties 3.1 and 3.2 both relate to pagination implementation. These can be combined into a single property about pagination support.
- Properties 4.1, 4.2, 4.3, and 4.4 all relate to security improvements. These can be combined into a single property about security compliance.
- Properties 5.1, 5.2, 5.3, 5.4, and 5.5 all relate to accessibility improvements. These can be combined into a single property about accessibility compliance.
- Properties 7.1, 7.2, 7.3, 7.4, and 7.5 all relate to code quality improvements. These can be combined into a single property about code quality compliance.

The remaining properties (1.3, 1.4, 2.5, 3.3, 3.4, 3.5, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5) are specific enough to remain as individual properties.

### Correctness Properties

Property 1: Type Safety Compliance
*For any* TypeScript file in the codebase, when analyzed by the TypeScript compiler, it should produce zero errors related to `as any` casts or implicit `any` types.
**Validates: Requirements 1.1, 1.2, 1.5**

Property 2: Type Export Completeness
*For any* type defined in a service file, it should be re-exported from the corresponding barrel file and be importable by external consumers.
**Validates: Requirements 1.3**

Property 3: Error Type Explicitness
*For any* error handling code in AuthContext, the error types should be explicitly defined and TypeScript should correctly narrow types in catch blocks.
**Validates: Requirements 1.4**

Property 4: Validation Completeness
*For any* input to the validation system, all validation rules should be applied and invalid inputs should be rejected with descriptive error messages.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 5: Error Handling Consistency
*For any* module in the system, error handling should follow a consistent pattern (either throwing errors or returning error objects, not mixing both).
**Validates: Requirements 2.5**

Property 6: Pagination Support
*For any* data fetching hook (useLeaveRequests, useSwapRequests), it should support pagination parameters and limit initial payload size.
**Validates: Requirements 3.1, 3.2**

Property 7: Interval Map Performance
*For any* interval map operation in Break_Schedules_Service, the time complexity should be O(1) or O(log n) after pre-computing templates, not O(n) from nested loops.
**Validates: Requirements 3.3**

Property 8: Dashboard Query Limits
*For any* dashboard query for swap and leave requests, the query should include a limit of 10 items.
**Validates: Requirements 3.4**

Property 9: Supabase Timeout Configuration
*For any* Supabase client initialization, timeout settings should be configured to prevent hanging requests.
**Validates: Requirements 3.5**

Property 10: Security Sanitization
*For any* dynamic value used in inline styles or error logs, it should be sanitized to prevent XSS attacks and PII leakage.
**Validates: Requirements 4.1, 4.2**

Property 11: Constant Extraction
*For any* magic string used for table names or time ranges, it should be extracted to a named constant and referenced from that constant.
**Validates: Requirements 4.3, 4.4**

Property 12: Environment Validation
*For any* required environment variable that is missing at startup, the system should throw an explicit error indicating which variable is required.
**Validates: Requirements 4.5**

Property 13: Accessibility Compliance
*For any* UI component (sidebar button, modal, icon, pagination control, toast notification), it should have appropriate accessibility attributes (aria-labels, keyboard focus management, screen reader support).
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

Property 14: Test Coverage Maintenance
*For any* public method in breakSchedulesService, there should be unit tests achieving 100% coverage.
**Validates: Requirements 6.1**

Property 15: Component Test Coverage
*For any* major user flow in the Dashboard page, there should be component tests covering the complete flow.
**Validates: Requirements 6.2**

Property 16: Error Boundary Testing
*For any* ErrorBoundary component, there should be tests verifying that it correctly catches and displays errors.
**Validates: Requirements 6.3**

Property 17: Integration Test Coverage
*For any* approval workflow, there should be integration tests covering the complete lifecycle from request to approval.
**Validates: Requirements 6.4**

Property 18: Performance Benchmarking
*For any* performance-related change, there should be benchmark tests that quantify the improvement.
**Validates: Requirements 6.5**

Property 19: Code Consolidation
*For any* duplicate validation logic between modules, it should be consolidated into a single source of truth.
**Validates: Requirements 7.1**

Property 20: Documentation Completeness
*For any* public function, there should be JSDoc comments documenting parameters, return types, and behavior.
**Validates: Requirements 7.3**

Property 21: Error Boundary Wrapping
*For any* page component, it should be wrapped in an ErrorBoundary component to prevent cascading failures.
**Validates: Requirements 7.4**

Property 22: Phase 1 Completion
*For any* critical issue (type safety, validation, security), all acceptance criteria should be met before starting Phase 2.
**Validates: Requirements 8.1**

Property 23: Phase 2 Completion
*For any* performance optimization, all acceptance criteria should be met before starting Phase 3.
**Validates: Requirements 8.2**

Property 24: Phase 3 Completion
*For any* accessibility improvement, all acceptance criteria should be met before starting Phase 4.
**Validates: Requirements 8.3**

Property 25: Phase 4 Completion
*For any* testing or documentation improvement, all acceptance criteria should be met before considering the project complete.
**Validates: Requirements 8.4**

Property 26: Phase Test Verification
*For any* phase completion, all acceptance criteria should have corresponding passing tests.
**Validates: Requirements 8.5**

## Error Handling

### Error Handling Strategy

The error handling improvements will establish consistent patterns across the codebase. All modules will use the same approach to error handling, either throwing errors or returning error objects, but not mixing both approaches within the same module.

### Error Types

All error types will be explicitly defined with meaningful properties:

```typescript
// Validation errors include field information
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown,
    public code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Authentication errors include error codes
class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// PII filtering errors
class PIIFilterError extends Error {
  constructor(
    message: string,
    public detectedPIITypes: string[]
  ) {
    super(message);
    this.name = 'PIIFilterError';
  }
}
```

### PII Filtering

Error logs will be sanitized to remove PII before storage:

```typescript
const PII_PATTERNS = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'email' },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, type: 'phone' },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'ssn' },
];

function sanitizeForLog(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      for (const { pattern } of PII_PATTERNS) {
        sanitized[key] = (sanitized[key] as string).replace(pattern, '[REDACTED]');
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLog(value as Record<string, unknown>);
    }
  }
  
  return sanitized;
}
```

### Environment Validation

Required environment variables will be validated at startup:

```typescript
const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET',
];

function validateEnvironment(): void {
  const missing = REQUIRED_ENV_VARS.filter(name => !process.env[name]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
```

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific examples and edge cases with property-based tests for universal properties. Both approaches are necessary for comprehensive coverage.

### Unit Testing Focus

Unit tests will focus on:
- Specific examples that demonstrate correct behavior
- Integration points between components
- Edge cases and error conditions
- Component rendering and user interactions

### Property-Based Testing Focus

Property-based tests will focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariant preservation across transformations
- Round-trip consistency for serialization

### Testing Framework Selection

The project will use Vitest for both unit and property-based testing. Vitest provides excellent TypeScript support and integrates well with the existing test infrastructure.

```typescript
// Example property test configuration
import { describe, it, expect } from 'vitest';
import { property } from 'testing-library';

describe('Type Safety', () => {
  it('should validate all input types correctly', () => {
    property(
      'for any input object, validation should either pass or return specific errors',
      (obj: Record<string, unknown>) => {
        const result = validateInput(obj);
        return result.valid || (result.errors && result.errors.length > 0);
      }
    );
  });
});
```

### Test Coverage Requirements

- All public methods must have 100% test coverage
- All components must have snapshot tests for rendering
- All error paths must have unit tests
- All integration flows must have integration tests

### Performance Benchmarking

Performance benchmarks will be implemented using Vitest's benchmarking capabilities:

```typescript
describe('Performance Benchmarks', () => {
  bench('interval map query', () => {
    const map = new IntervalMap(1000);
    map.insert(0, 1000, 'value');
    map.query(500);
  });
});
```

### Test Tagging

All tests will be tagged with the feature and property they validate:

```typescript
// Unit test
it('should validate email format', () => {
  // Test specific example
});

// Property test
property(
  'for any string, email validation should correctly identify valid and invalid formats',
  (email: string) => {
    // Test universal property
  }
);
```