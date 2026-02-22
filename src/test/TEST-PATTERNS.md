# Test Patterns and Best Practices

This document outlines the testing patterns, utilities, and conventions used throughout the test suite. Following these patterns ensures consistency, maintainability, and fast test execution.

## Table of Contents

1. [Mock Helpers](#mock-helpers)
2. [Property-Based Testing](#property-based-testing)
3. [Hook Testing Patterns](#hook-testing-patterns)
4. [Component Testing Patterns](#component-testing-patterns)
5. [Naming Conventions](#naming-conventions)
6. [Best Practices](#best-practices)

---

## Mock Helpers

Located in `src/test/fixtures/mockHelpers.ts`, these utilities provide reusable mock setups to minimize boilerplate.

### Supabase Query Mocks

Mock Supabase database operations without actual database calls. Each helper returns a mock object that mimics the Supabase query chain.

**Available Supabase Mocks:**
- `createSelectMock<T>(data, error?)` - Basic select with order
- `createSelectEqMock<T>(data, error?)` - Select with eq filter and single
- `createSelectOrderEqMock<T>(data, error?)` - Select with order and eq
- `createInsertMock<T>(data, error?)` - Insert with select and single
- `createUpdateMock<T>(data, error?)` - Update with eq, select, and single
- `createDeleteMock(error?)` - Delete with eq
- `createUpsertMock<T>(data, error?)` - Upsert with select and single
- `createSelectDateRangeMock<T>(data, error?)` - Select with gte and lte
- `createSelectIlikeMock<T>(data, error?)` - Select with ilike filter
- `createSelectMaybeSingleMock<T>(data, error?)` - Select with maybeSingle
- `createAuthMock()` - Auth operations (signUp, signIn, signOut, etc.)

**Example:**
```typescript
const mockData = [{ id: '1', name: 'Test' }];
const mock = createSelectMock(mockData);
vi.mocked(supabase.from).mockReturnValue(mock as any);
```

### React Query Mocks

Mock React Query hooks for testing custom hooks that use `useQuery` or `useMutation`.

**Available React Query Mocks:**
- `createQueryMock<T>(data, isLoading, error)` - Mock useQuery results
- `createMutationMock<T>(mutate)` - Mock useMutation results
- `createQueryWrapper()` - QueryClientProvider wrapper for hook testing

**Example:**
```typescript
// Mock successful query
const mockQuery = createQueryMock({ users: [] }, false, null);

// Mock mutation
const mockMutate = vi.fn();
const mockMutation = createMutationMock(mockMutate);
```

---

## Property-Based Testing

Located in `src/test/generators/breakScheduleGenerators.ts`, these fast-check arbitraries generate random but valid test data.

### What is Property-Based Testing?

Property-based testing validates that certain properties (invariants) hold true for all possible inputs, not just specific examples. This runs 100+ times with different random inputs, catching edge cases you might miss.

**Traditional Unit Test:**
```typescript
expect(parseTime('09:00')).toBe('09:00:00')
```

**Property-Based Test:**
```typescript
fc.assert(fc.property(timeArb, (time) => {
  const parsed = parseTime(time);
  expect(parsed).toMatch(/^\d{2}:\d{2}:\d{2}$/);
}));
```

### Available Generators

**Basic Type Generators:**
- `breakTypeArb` - Generates break types (IN, HB1, B, HB2)
- `shiftTypeArb` - Generates shift types (AM, PM, BET, OFF)
- `nonOffShiftTypeArb` - Generates working shifts (AM, PM, BET)
- `timeArb` - Generates times in HH:MM format (9:00-19:00, 15-min intervals)
- `timeWithSecondsArb` - Generates times in HH:MM:SS format
- `dateArb` - Generates dates in YYYY-MM-DD format (2024-2026)
- `uuidArb` - Generates valid UUIDs
- `agentNameArb` - Generates realistic agent names

**Composite Generators:**
- `orderedBreakTimesArb` - Generates break times ensuring HB1 < B < HB2
- `agentBreakScheduleArb` - Generates complete agent schedule objects
- `breakScheduleCSVDataArb` - Generates valid CSV data
- `invalidCSVDataArb` - Generates invalid CSV for error testing

---

## Hook Testing Patterns

### Standard Hook Test Structure

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('useMyHook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch data successfully', async () => {
    // Arrange: Setup mocks
    vi.mocked(service.getData).mockResolvedValue(mockData);

    // Act: Render hook
    const { result } = renderHook(() => useMyHook(), { wrapper });

    // Assert: Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
  });
});
```

### Testing Mutations

```typescript
it('should update data', async () => {
  vi.mocked(service.updateData).mockResolvedValue(updatedData);

  const { result } = renderHook(() => useMyHook(), { wrapper });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  // Trigger mutation
  result.current.updateMutation.mutate({ id: '1', name: 'Updated' });

  // Wait for mutation to complete
  await waitFor(() => {
    expect(service.updateData).toHaveBeenCalledWith({ id: '1', name: 'Updated' });
  });
});
```

---

## Component Testing Patterns

### Standard Component Test Structure

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('MyComponent', () => {
  const mockProps = {
    onSubmit: vi.fn(),
    data: mockData,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<MyComponent {...mockProps} />);
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
it('should handle button click', async () => {
  const handleClick = vi.fn();
  render(<MyComponent onClick={handleClick} />);

  const button = screen.getByRole('button', { name: /click me/i });
  fireEvent.click(button);

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

---

## Naming Conventions

### Test File Names

- Hook tests: `useHookName.test.tsx`
- Component tests: `ComponentName.test.tsx`
- Service tests: `serviceName.test.ts`
- Lib tests: `libName.test.ts`

### Test Names

Use descriptive names that explain what is being tested:

-  `should fetch data successfully`
-  `should handle network errors`
-  `should display loading state while fetching`
-  `test 1`
-  `works`
-  `getData`

### Variable Names

- Mock data: `mockData`, `mockUser`, `mockSchedule`
- Mock functions: `mockFn`, `handleClick`, `onSubmit`
- Test wrappers: `wrapper`, `queryClient`
- Results: `result`, `response`, `output`

---

## Best Practices

### 1. Use Arrange-Act-Assert Pattern

```typescript
it('should update user name', async () => {
  // Arrange: Setup test data and mocks
  const mockUser = { id: '1', name: 'John' };
  vi.mocked(service.updateUser).mockResolvedValue(mockUser);

  // Act: Perform the action
  const result = await service.updateUser('1', { name: 'John' });

  // Assert: Verify the outcome
  expect(result).toEqual(mockUser);
});
```

### 2. Clean Up After Each Test

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 3. Test One Thing Per Test

```typescript
//  Good: Separate tests
it('should fetch data', async () => {
  const data = await service.getData();
  expect(data).toBeDefined();
});

it('should update data', async () => {
  const updated = await service.updateData(mockData);
  expect(updated).toBeDefined();
});
```

### 4. Mock External Dependencies

```typescript
vi.mock('../../lib/supabase');
vi.mock('../../services/myService');
vi.mock('@tanstack/react-query');
```

### 5. Use waitFor for Async Operations

```typescript
await waitFor(() => {
  expect(result.current.isLoading).toBe(false);
});
```

---

## Summary

Following these patterns ensures:
- **Consistency**: All tests follow the same structure
- **Maintainability**: Tests are easy to understand and update
- **Performance**: Tests run quickly with minimal overhead
- **Reliability**: Tests are independent and don't have flaky behavior
- **Coverage**: Edge cases and error paths are tested

For more examples, refer to test files in `src/test/`.
