# Design Document: Libs, Hooks, and Components Test Coverage

## Overview

This design addresses the systematic improvement of test coverage for three critical layers of the application: utility libraries (libs), custom React hooks (hooks), and UI components (components). The goal is to achieve 80% test coverage for each layer while maintaining test performance and establishing reusable patterns.

### Current State

- Overall coverage: 56.75%
- Services and validation layers: Already addressed
- Remaining gaps: libs, hooks, and components layers
- Existing infrastructure: Test generators, mock helpers, shared fixtures, React Testing Library setup

### Design Goals

1. Achieve 80% test coverage for each of the three target layers
2. Leverage existing test infrastructure for consistency and efficiency
3. Implement property-based testing for critical data transformation logic
4. Maintain fast test execution (< 30 seconds for all new tests)
5. Establish clear patterns for future test development
6. Prioritize business-critical functionality (hooks > libs > components)

### Scope

**In Scope:**
- 11 custom React hooks in src/hooks/
- 8 utility library modules in src/lib/
- 14 component areas in src/components/
- Unit tests for all three layers
- Property-based tests for CSV parsing and data transformations
- Integration with existing test infrastructure

**Out of Scope:**
- End-to-end testing
- Performance benchmarking beyond basic execution time
- Visual regression testing
- Accessibility testing (beyond basic ARIA attributes)

## Architecture

### Testing Architecture

The testing architecture follows a three-tier approach aligned with the application's layer structure:

```
┌─────────────────────────────────────────────────────────┐
│                    Test Suite                           │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Hooks      │  │    Libs      │  │  Components  │ │
│  │   Tests      │  │    Tests     │  │    Tests     │ │
│  │              │  │              │  │              │ │
│  │ • Unit       │  │ • Unit       │  │ • Unit       │ │
│  │ • Integration│  │ • Property   │  │ • Interaction│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────┤
│              Shared Test Infrastructure                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Mock Helpers │  │  Test Data   │  │  Generators  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────┤
│              Testing Frameworks                         │
│  • Vitest  • React Testing Library  • fast-check       │
└─────────────────────────────────────────────────────────┘
```

### Test Organization

Tests will be organized by layer with consistent naming conventions:

```
src/test/
├── hooks/
│   ├── useAuth.test.ts
│   ├── useCoverageData.test.ts
│   └── ...
├── lib/
│   ├── autoDistribution.test.ts
│   ├── breakScheduleCSV.test.ts
│   └── ...
├── components/
│   ├── CoverageChart.test.tsx
│   ├── DistributionSettingsForm.test.tsx
│   └── ...
└── fixtures/
    ├── mockHelpers.ts (existing)
    └── testData.ts (existing)
```

### Priority-Based Implementation

Tests will be implemented in priority order to maximize value:

**P1 (Critical - Hooks):** Business logic encapsulation
- useAuth, useRoleCheck (authentication/authorization)
- useCoverageData, useDashboardData (data aggregation)
- useDistributionSettings, useOvertimeSettings (configuration)

**P2 (High - Libs):** Core functionality and data transformation
- breakScheduleCSV (data integrity)
- autoDistribution (business algorithms)
- breakValidation (rule enforcement)
- errorHandler (error processing)

**P3 (Medium - Components):** UI behavior and interactions
- Form components (DistributionSettingsForm)
- Data display (CoverageChart, RequestTable)
- Interactive elements (Toast, StatusBadge)

## Components and Interfaces

### Hook Testing Interface

Custom hooks will be tested using React Testing Library's `renderHook` utility:

```typescript
interface HookTestSetup<T> {
  // Hook to test
  hook: () => T;
  
  // Mock dependencies
  mocks?: {
    supabase?: any;
    queryClient?: any;
    context?: any;
  };
  
  // Initial props
  initialProps?: any;
  
  // Wrapper component (for context providers)
  wrapper?: React.ComponentType;
}

interface HookTestResult<T> {
  result: { current: T };
  rerender: (props?: any) => void;
  unmount: () => void;
  waitFor: (callback: () => void) => Promise<void>;
}
```

### Library Testing Interface

Utility libraries will be tested with standard unit test patterns:

```typescript
interface LibraryTestCase<TInput, TOutput> {
  description: string;
  input: TInput;
  expected: TOutput;
  shouldThrow?: boolean;
  errorMessage?: string;
}

interface PropertyTestConfig {
  iterations: number; // minimum 100
  arbitrary: fc.Arbitrary<any>;
  property: (input: any) => boolean;
  tag: string; // references design property
}
```

### Component Testing Interface

React components will be tested using React Testing Library:

```typescript
interface ComponentTestSetup {
  component: React.ComponentType;
  props: Record<string, any>;
  mocks?: {
    hooks?: Record<string, any>;
    services?: Record<string, any>;
  };
  wrapper?: React.ComponentType;
}

interface ComponentTestActions {
  render: () => RenderResult;
  userEvent: typeof userEvent;
  waitFor: (callback: () => void) => Promise<void>;
  screen: typeof screen;
}
```

### Mock Helper Extensions

New mock helpers will be added to support hooks and components:

```typescript
// Hook mocks
export function createQueryMock<T>(data: T, isLoading = false, error = null) {
  return {
    data,
    isLoading,
    isError: error !== null,
    error,
    refetch: vi.fn(),
  };
}

export function createMutationMock<T>(mutate: any = vi.fn()) {
  return {
    mutate,
    mutateAsync: vi.fn(),
    isLoading: false,
    isError: false,
    error: null,
  };
}

// Component mocks
export function createFormMock(onSubmit: any = vi.fn()) {
  return {
    handleSubmit: (callback: any) => (e: any) => {
      e.preventDefault();
      callback();
      onSubmit();
    },
    register: vi.fn(),
    formState: { errors: {}, isSubmitting: false },
  };
}
```

## Data Models

### Test Coverage Model

```typescript
interface LayerCoverage {
  layer: 'hooks' | 'libs' | 'components';
  files: number;
  testedFiles: number;
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  threshold: number; // 80%
  status: 'below' | 'at' | 'above';
}

interface TestMetrics {
  totalTests: number;
  passingTests: number;
  failingTests: number;
  executionTime: number; // milliseconds
  propertyTests: number;
  unitTests: number;
}
```

### CSV Round-Trip Model

For property-based testing of CSV parsing:

```typescript
interface BreakScheduleData {
  agent_name: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  hb1_start: string | null; // HH:MM
  b_start: string | null;
  hb2_start: string | null;
}

interface CSVRoundTripTest {
  input: BreakScheduleData[];
  csvString: string;
  parsed: BreakScheduleData[];
  isEquivalent: boolean;
}
```

### Test Priority Model

```typescript
interface TestPriority {
  file: string;
  layer: 'hooks' | 'libs' | 'components';
  priority: 'P1' | 'P2' | 'P3';
  complexity: 'low' | 'medium' | 'high';
  estimatedTests: number;
  dependencies: string[];
  businessCritical: boolean;
}
```

### Hook Test Model

```typescript
interface HookTestCase {
  hookName: string;
  testType: 'state' | 'effect' | 'callback' | 'async';
  scenario: string;
  setup: {
    mocks: Record<string, any>;
    initialState?: any;
  };
  actions: Array<{
    type: 'call' | 'wait' | 'assert';
    payload?: any;
  }>;
  expected: {
    returnValue?: any;
    sideEffects?: string[];
  };
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all 89 acceptance criteria, the vast majority (87 out of 89) are meta-requirements about the test suite itself rather than properties of the system under test. These criteria specify:
- Which tests should exist
- How tests should be written
- What coverage thresholds should be met
- Test implementation patterns and documentation

Only 2 acceptance criteria describe testable properties of the actual system:

**3.3** - CSV round-trip property (property test)
**3.4** - CSV error handling for invalid inputs (property test)

The remaining criteria (3.1 and 3.2) are examples that demonstrate correct behavior but are not universal properties.

This is appropriate for a test coverage feature, as the primary deliverable is the test suite itself rather than new system functionality. The correctness properties below focus on the actual system behaviors that should be verified through testing.

### Property 1: CSV Round-Trip Preservation

*For any* valid break schedule data structure, converting it to CSV format and then parsing it back should produce data equivalent to the original.

**Validates: Requirements 3.3**

**Rationale:** This is a classic round-trip property that ensures data integrity through serialization and deserialization. The CSV parser must preserve all information without loss or corruption.

**Implementation Notes:**
- Generate random break schedule data with valid agent names, dates, shifts, and break times
- Use `exportToCSV` to convert to CSV string
- Use `parseCSV` to parse back to data structure
- Verify equivalence (accounting for format normalization like time with seconds)
- Test with edge cases: empty breaks, all breaks filled, various shift types

### Property 2: CSV Error Handling for Invalid Formats

*For any* CSV input that violates format constraints (invalid dates, malformed times, missing required fields), the parser should reject it with a descriptive error rather than producing incorrect data.

**Validates: Requirements 3.4**

**Rationale:** Robust error handling prevents silent data corruption. The parser must validate inputs and fail fast with clear error messages.

**Implementation Notes:**
- Generate invalid CSV inputs: wrong date formats, invalid time formats, missing required fields
- Verify that `parseCSV` or `validateCSVFormat` throws appropriate errors
- Check that error messages are descriptive and include row numbers
- Test boundary cases: empty files, header-only files, malformed quotes

### Property 3: CSV Time Format Normalization

*For any* valid time in HH:MM format, the CSV parser should normalize it to HH:MM:SS format consistently.

**Validates: Requirements 3.1, 3.2**

**Rationale:** Time format consistency is critical for database storage and comparison operations. The parser must handle the conversion reliably.

**Implementation Notes:**
- Generate random valid times in HH:MM format
- Verify conversion to HH:MM:SS adds ":00" suffix
- Test edge cases: midnight (00:00), noon (12:00), end of day (23:59)

### Additional System Properties (Implicit)

While not explicitly called out in the requirements, the following properties should be verified through the test suite:

### Property 4: Hook State Consistency

*For any* custom hook that manages state, the returned state should always be consistent with the underlying data source after all async operations complete.

**Rationale:** Hooks encapsulate business logic and state management. Inconsistent state leads to UI bugs and data corruption.

### Property 5: Validation Rule Idempotence

*For any* validation function in breakValidation, applying the validation multiple times to the same input should produce the same result.

**Rationale:** Validation functions should be pure and deterministic. Multiple validations of the same data should not change the outcome.

### Property 6: Error Handler Message Preservation

*For any* error passed to the error handler, the formatted error should preserve the essential information (message, type, context) needed for debugging.

**Rationale:** Error handling must not lose critical debugging information. Developers need complete error context to diagnose issues.

## Error Handling

### Test Error Handling Strategy

The test suite will verify error handling through multiple approaches:

**1. Expected Error Tests**
- Test functions that should throw errors with invalid inputs
- Verify error types and messages are correct
- Use `expect(() => fn()).toThrow(ErrorType)` pattern

**2. Async Error Tests**
- Test hooks and services that handle async failures
- Mock failed API calls and database errors
- Verify error states are set correctly in hook return values

**3. Boundary Condition Tests**
- Test edge cases that might trigger errors: null, undefined, empty arrays
- Verify graceful degradation rather than crashes
- Test numeric boundaries: zero, negative, maximum values

**4. Error Recovery Tests**
- Test that components display error states appropriately
- Verify retry mechanisms work correctly
- Test that errors don't leave the system in an inconsistent state

### Error Handling Patterns

```typescript
// Pattern 1: Synchronous error testing
describe('parseCSV', () => {
  it('should throw error for empty CSV', () => {
    expect(() => parseCSV('')).toThrow('CSV file is empty');
  });
});

// Pattern 2: Async error testing with hooks
describe('useCoverageData', () => {
  it('should handle fetch errors', async () => {
    mockSupabase.from.mockReturnValue(createSelectMock(null, new Error('Network error')));
    
    const { result } = renderHook(() => useCoverageData());
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeDefined();
    });
  });
});

// Pattern 3: Component error boundary testing
describe('ErrorBoundary', () => {
  it('should catch and display component errors', () => {
    const ThrowError = () => { throw new Error('Test error'); };
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
```

### Error Categories to Test

**1. Validation Errors**
- Invalid input formats (dates, times, emails)
- Missing required fields
- Constraint violations (min/max values)

**2. Network Errors**
- Failed API calls
- Timeout scenarios
- Connection errors

**3. Database Errors**
- Query failures
- Constraint violations
- Transaction rollbacks

**4. Business Logic Errors**
- Insufficient permissions
- Invalid state transitions
- Rule violations

**5. System Errors**
- Out of memory (for large data sets)
- Unexpected null/undefined
- Type mismatches

## Testing Strategy

### Dual Testing Approach

The test suite will employ both unit testing and property-based testing as complementary strategies:

**Unit Tests:**
- Verify specific examples and known edge cases
- Test integration points between components
- Validate error conditions with specific inputs
- Test UI interactions and rendering paths
- Fast execution for quick feedback

**Property-Based Tests:**
- Verify universal properties across all inputs
- Comprehensive input coverage through randomization
- Discover edge cases not anticipated by developers
- Validate data transformation correctness (CSV round-trip)
- Run minimum 100 iterations per property

**Balance:** Unit tests provide concrete examples and catch specific bugs. Property tests verify general correctness across the input space. Together they provide comprehensive coverage.

### Property-Based Testing Configuration

**Library:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:**
```typescript
import * as fc from 'fast-check';

// Minimum 100 iterations per property test
const propertyConfig = {
  numRuns: 100,
  verbose: true,
};

// Example property test structure
describe('CSV Round-Trip Property', () => {
  it('should preserve data through parse-generate-parse cycle', () => {
    // Feature: libs-hooks-components-coverage, Property 1: CSV round-trip preservation
    fc.assert(
      fc.property(
        breakScheduleDataArbitrary(),
        (data) => {
          const csv = generateCSV(data);
          const parsed = parseCSV(csv);
          return isEquivalent(data, parsed);
        }
      ),
      propertyConfig
    );
  });
});
```

**Tagging Convention:**
Each property test must include a comment tag referencing the design document:
```typescript
// Feature: libs-hooks-components-coverage, Property {number}: {property_text}
```

### Test Organization by Layer

**Hooks Layer (P1 Priority):**

Test files: `src/test/hooks/*.test.ts`

Testing approach:
- Use `renderHook` from React Testing Library
- Mock Supabase client and React Query
- Test return values, state updates, and side effects
- Use `waitFor` for async operations
- Wrap hooks in necessary context providers

Example hooks to test:
- `useAuth`: Authentication state, role checking, permissions
- `useCoverageData`: Data fetching, transformation, error handling
- `useDashboardData`: Data aggregation, filtering, sorting
- `useDistributionSettings`: Settings CRUD operations
- `useRoleCheck`: Permission checking logic

**Libs Layer (P2 Priority):**

Test files: `src/test/lib/*.test.ts`

Testing approach:
- Standard unit tests for pure functions
- Property-based tests for data transformations
- Mock external dependencies (Supabase, Sentry)
- Test valid inputs, invalid inputs, and edge cases
- Verify error messages and types

Example libs to test:
- `breakScheduleCSV`: CSV parsing/generation with round-trip property
- `autoDistribution`: Distribution algorithms with various inputs
- `breakValidation`: Validation rules with valid/invalid data
- `errorHandler`: Error formatting and processing
- `designSystem`: Theme utilities and style helpers

**Components Layer (P3 Priority):**

Test files: `src/test/components/*.test.tsx`

Testing approach:
- Use React Testing Library's `render` and `screen`
- Simulate user interactions with `userEvent`
- Test initial rendering with default props
- Test conditional rendering paths
- Verify accessibility attributes (ARIA labels)
- Mock hooks and services

Example components to test:
- `CoverageChart`: Data visualization, legend, accessibility
- `DistributionSettingsForm`: Form validation, submission, error display
- `RequestTable`: Data display, sorting, filtering
- `Toast`: Notification display, auto-dismiss, close button
- `StatusBadge`: Status rendering, color coding

### Test Infrastructure Reuse

**Existing Mock Helpers (src/test/fixtures/mockHelpers.ts):**
- `createSelectMock`: Mock Supabase select queries
- `createInsertMock`: Mock Supabase insert operations
- `createUpdateMock`: Mock Supabase update operations
- `createDeleteMock`: Mock Supabase delete operations
- `createAuthMock`: Mock authentication operations

**Existing Test Data (src/test/fixtures/testData.ts):**
- `MOCK_USERS`: Pre-defined user fixtures
- `MOCK_SKILLS`: Pre-defined skill fixtures
- `MOCK_BREAK_RULES`: Pre-defined break rule fixtures
- `MOCK_DISTRIBUTION_SETTINGS`: Pre-defined settings fixtures
- Helper functions: `cloneFixture`, `createMultiple`

**New Mock Helpers to Add:**
```typescript
// Hook mocks
export function createQueryMock<T>(data: T, isLoading = false, error = null);
export function createMutationMock<T>(mutate = vi.fn());

// Component mocks
export function createFormMock(onSubmit = vi.fn());
export function createRouterMock(navigate = vi.fn());
```

### Coverage Measurement

**Coverage Tool:** Vitest with c8 coverage reporter

**Coverage Thresholds:**
```json
{
  "coverage": {
    "provider": "c8",
    "reporter": ["text", "json", "html"],
    "all": true,
    "include": ["src/hooks/**", "src/lib/**", "src/components/**"],
    "exclude": ["**/*.test.ts", "**/*.test.tsx", "**/types.ts"],
    "lines": 80,
    "functions": 80,
    "branches": 80,
    "statements": 80,
    "perFile": true
  }
}
```

**Per-Layer Tracking:**
- Hooks layer: `src/hooks/**` must reach 80%
- Libs layer: `src/lib/**` must reach 80%
- Components layer: `src/components/**` must reach 80%

**Coverage Reports:**
- HTML report for detailed file-by-file analysis
- JSON report for programmatic analysis
- Console summary for quick feedback

### Test Performance Requirements

**Execution Time Target:** < 30 seconds for all new tests

**Performance Strategies:**
1. Mock all external dependencies (no real network calls)
2. Use in-memory mocks for database operations
3. Avoid unnecessary setup/teardown
4. Run tests in parallel where possible
5. Use shallow rendering for component tests when appropriate

**Performance Monitoring:**
```typescript
// Add to test setup
beforeAll(() => {
  console.time('Test Suite Execution');
});

afterAll(() => {
  console.timeEnd('Test Suite Execution');
});
```

### Test Patterns and Documentation

**Naming Conventions:**
```typescript
// Pattern: describe('[Component/Hook/Lib Name]', () => { ... })
describe('useAuth', () => {
  // Pattern: it('should [expected behavior] when [condition]', () => { ... })
  it('should return true when user has WFM role', () => {
    // Test implementation
  });
  
  // Pattern: it('should throw error when [error condition]', () => { ... })
  it('should throw error when used outside AuthProvider', () => {
    // Test implementation
  });
});
```

**Documentation Requirements:**
- Inline comments for complex mock setups
- Comments explaining property-based test properties
- Comments for non-obvious test scenarios
- JSDoc comments for reusable test utilities

**Example Documented Test:**
```typescript
describe('breakScheduleCSV', () => {
  describe('round-trip property', () => {
    it('should preserve data through parse-generate-parse cycle', () => {
      // Feature: libs-hooks-components-coverage, Property 1: CSV round-trip preservation
      // This property ensures that no data is lost or corrupted when converting
      // break schedules to CSV and back. We generate random valid break schedules,
      // convert to CSV, parse back, and verify equivalence.
      
      fc.assert(
        fc.property(
          // Generate random break schedule data with:
          // - Valid agent names (non-empty strings)
          // - Valid dates (YYYY-MM-DD format)
          // - Valid shift types (AM, PM, BET, OFF)
          // - Valid break times (HH:MM format) or null
          breakScheduleDataArbitrary(),
          (data) => {
            const csv = generateCSV(data);
            const parsed = parseCSV(csv);
            
            // Note: Time format normalization means HH:MM becomes HH:MM:SS
            // so we need to normalize before comparison
            return isEquivalent(normalizeData(data), parsed);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
```

### Implementation Phases

**Phase 1: P1 Hooks (Week 1)**
- Set up hook testing infrastructure
- Test authentication hooks (useAuth, useRoleCheck)
- Test data fetching hooks (useCoverageData, useDashboardData)
- Test settings hooks (useDistributionSettings, useOvertimeSettings)
- Target: 80% coverage for hooks layer

**Phase 2: P2 Libs (Week 2)**
- Implement property-based tests for CSV parsing
- Test validation libraries
- Test error handling utilities
- Test configuration modules
- Target: 80% coverage for libs layer

**Phase 3: P3 Components (Week 3)**
- Test form components
- Test data display components
- Test notification components
- Test shared/reusable components
- Target: 80% coverage for components layer

**Phase 4: Refinement (Week 4)**
- Address coverage gaps
- Optimize test performance
- Document patterns
- Review and refactor

### Success Criteria

**Coverage Metrics:**
- ✓ Overall coverage ≥ 80%
- ✓ Hooks layer coverage ≥ 80%
- ✓ Libs layer coverage ≥ 80%
- ✓ Components layer coverage ≥ 80%

**Quality Metrics:**
- ✓ All tests pass consistently
- ✓ Test execution time < 30 seconds
- ✓ Property tests run ≥ 100 iterations
- ✓ Zero flaky tests

**Documentation Metrics:**
- ✓ All property tests tagged with design references
- ✓ Complex mocks documented with comments
- ✓ Test patterns documented for future reference
- ✓ Coverage reports generated and accessible

