# Testing Guide

This guide covers testing practices, structure, and workflows for the WFM application.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Database](#test-database)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### Test Framework

- **Framework**: Vitest
- **React Testing**: @testing-library/react
- **Database**: Supabase local instance
- **Coverage Tool**: Vitest coverage (c8)

### Test Categories

1. **Edge Cases** (`src/test/edge-cases/`) - 72 tests
   - Concurrency and race conditions
   - Boundary conditions
   - Failure scenarios
   - Authentication edge cases

2. **Business Logic** (`src/test/business-logic/`) - 19 tests
   - Swap execution workflows
   - Leave balance management
   - Approval workflows
   - Comment system

3. **Backend/RLS** (`src/test/backend/`) - 43 tests
   - Row Level Security policies
   - Stored procedures
   - Database triggers

4. **Integration** (`src/test/integration/`) - 33 tests
   - Complete user flows
   - Authentication workflows
   - RBAC testing
   - Error handling

5. **Unit Tests** (various locations)
   - Component tests
   - Hook tests
   - Utility function tests

**Total**: 167+ tests

---

## Test Structure

```
src/test/
├── README.md                    # Test documentation
├── setup.ts                     # Vitest setup
├── seed-test-data.ts           # Database seeding
├── edge-cases/
│   ├── test-helpers.ts         # Shared test utilities
│   ├── concurrency.test.ts
│   ├── race-conditions.test.ts
│   ├── failures.test.ts
│   ├── boundaries.test.ts
│   └── authentication.test.ts
├── business-logic/
│   ├── swap-execution.test.ts
│   ├── leave-balances.test.ts
│   ├── approval-workflows.test.ts
│   └── comments-and-exceptions.test.ts
├── backend/
│   ├── rls-users.test.ts
│   ├── rls-shifts.test.ts
│   ├── rls-swap-requests.test.ts
│   ├── rls-leave-requests.test.ts
│   ├── rls-comments.test.ts
│   ├── stored-procedures.test.ts
│   └── triggers.test.ts
├── integration/
│   ├── swap-request-flow.test.tsx
│   ├── leave-request-flow.test.tsx
│   ├── authentication-flow.test.tsx
│   ├── rbac-flow.test.tsx
│   └── errorHandling.integration.test.tsx
├── components/
│   ├── Skeleton.test.tsx
│   └── Toast.test.tsx
├── hooks/
│   └── useAuth.test.tsx
├── lib/
│   └── errorHandler.test.ts
└── utils/
    ├── csvHelpers.test.ts
    ├── dateHelpers.test.ts
    ├── formatters.test.ts
    ├── sanitize.test.ts
    └── validators.test.ts
```

---

## Running Tests

### All Tests

```bash
npm test                    # Run all tests in watch mode
npm run test:run           # Run all tests once
npm run test:coverage      # Run with coverage report
```

### Specific Test Suites

```bash
# Run specific directory
npm run test:run -- src/test/edge-cases/
npm run test:run -- src/test/business-logic/
npm run test:run -- src/test/backend/
npm run test:run -- src/test/integration/

# Run specific file
npm run test:run -- src/test/edge-cases/concurrency.test.ts

# Run tests matching pattern
npm run test:run -- --grep "swap"
```

### Watch Mode

```bash
npm test                    # Watch all tests
npm test -- src/test/edge-cases/  # Watch specific directory
```

### Coverage

```bash
npm run test:coverage       # Generate coverage report
```

Coverage reports are generated in `coverage/` directory.

**Coverage Thresholds**:
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

---

## Writing Tests

### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.tsx`
- Place tests near the code they test or in `src/test/`

### Basic Test Structure

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Feature Name', () => {
  // Setup
  beforeAll(async () => {
    // Run once before all tests
  });

  afterAll(async () => {
    // Cleanup after all tests
  });

  // Test cases
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Database Tests

```typescript
import { createClient } from '@supabase/supabase-js';

const serviceSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY || 'sb_secret_...',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

describe('Database Test', () => {
  let testUserIds: string[] = [];

  afterEach(async () => {
    // Cleanup
    if (testUserIds.length) {
      await serviceSupabase.from('users').delete().in('id', testUserIds);
    }
    testUserIds = [];
  });

  it('should create user', async () => {
    const { data, error } = await serviceSupabase
      .from('users')
      .insert({ email: 'test@dabdoob.com', name: 'Test', role: 'agent' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    testUserIds.push(data!.id);
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('should return data', async () => {
    const { result } = renderHook(() => useMyHook());
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

---

## Test Database

### Setup

1. **Install Supabase CLI**:
   ```bash
   npx supabase --version
   ```

2. **Start Local Database**:
   ```bash
   npx supabase start
   ```

3. **Seed Test Data** (optional):
   ```bash
   npm run seed-test-data
   ```

### Configuration

Test database configuration is in `.env.example`:

```env
# Test Database (Supabase Local)
VITE_SUPABASE_TEST_URL=http://127.0.0.1:54321
VITE_SUPABASE_TEST_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_TEST_SERVICE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
```

### Service Role Key

Use the service role key to bypass RLS in tests:

```typescript
const serviceSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL!,
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY!,  // Service role key
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

### Cleanup

Always clean up test data in `afterEach` or `afterAll`:

```typescript
afterEach(async () => {
  if (testIds.length) {
    await serviceSupabase.from('table').delete().in('id', testIds);
  }
  testIds = [];
});
```

---

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Clean up data after each test
- Don't rely on test execution order

### 2. Descriptive Names

```typescript
// Good
it('should reject swap request when target declines', () => {});

// Bad
it('test1', () => {});
```

### 3. Arrange-Act-Assert

```typescript
it('should calculate leave days correctly', () => {
  // Arrange
  const startDate = '2026-01-01';
  const endDate = '2026-01-05';

  // Act
  const days = calculateLeaveDays(startDate, endDate);

  // Assert
  expect(days).toBe(5);
});
```

### 4. Test Edge Cases

- Null/undefined inputs
- Empty arrays/strings
- Boundary values
- Error conditions

### 5. Mock External Dependencies

```typescript
import { vi } from 'vitest';

vi.mock('./api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: [] }))
}));
```

### 6. Use Test Helpers

Create reusable test utilities:

```typescript
// test-helpers.ts
export const createTestUser = async (role = 'agent') => {
  const { data } = await serviceSupabase
    .from('users')
    .insert({ email: `test-${Date.now()}@dabdoob.com`, name: 'Test', role })
    .select()
    .single();
  return data!;
};
```

### 7. Avoid Test Interdependence

```typescript
// Bad - tests depend on each other
let userId: string;

it('creates user', async () => {
  userId = await createUser();
});

it('updates user', async () => {
  await updateUser(userId);  // Depends on previous test
});

// Good - each test is independent
it('creates user', async () => {
  const userId = await createUser();
  // Test and cleanup
});

it('updates user', async () => {
  const userId = await createUser();
  await updateUser(userId);
  // Test and cleanup
});
```

---

## Troubleshooting

### Tests Failing Locally

1. **Check Supabase is running**:
   ```bash
   npx supabase status
   ```

2. **Restart Supabase**:
   ```bash
   npx supabase stop
   npx supabase start
   ```

3. **Check environment variables**:
   ```bash
   echo $VITE_SUPABASE_TEST_URL
   ```

### Database Connection Errors

- Ensure Supabase local instance is running
- Verify service role key is correct
- Check migrations are applied

### Flaky Tests

- Add proper wait conditions
- Increase timeouts if needed
- Check for race conditions
- Ensure proper cleanup

### Coverage Not Generated

```bash
# Install coverage dependencies
npm install --save-dev @vitest/coverage-c8

# Run with coverage
npm run test:coverage
```

### Tests Timing Out

```typescript
// Increase timeout for specific test
it('slow test', async () => {
  // test code
}, 10000);  // 10 second timeout
```

---

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch

### GitHub Actions Workflow

```yaml
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: actions/upload-artifact@v3
  with:
    name: coverage
    path: coverage/
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Test README](../src/test/README.md)

---

*Last Updated: February 10, 2026*
