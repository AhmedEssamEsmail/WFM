# Testing Guide

Complete guide for testing the WFM application, including test structure, coverage goals, and monitoring.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Coverage Goals](#coverage-goals)
6. [Coverage Monitoring](#coverage-monitoring)
7. [Coverage Validation](#coverage-validation)

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

### Service Tests Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { myService } from './myService'
import { supabase } from '../lib/supabase'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

describe('myService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getItems', () => {
    it('should fetch items successfully', async () => {
      // Arrange
      const mockData = [{ id: '1', name: 'Test' }]
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      } as any)

      // Act
      const result = await myService.getItems()

      // Assert
      expect(result).toEqual(mockData)
      expect(supabase.from).toHaveBeenCalledWith('items')
    })

    it('should handle errors', async () => {
      // Arrange
      const mockError = new Error('Database error')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      } as any)

      // Act & Assert
      await expect(myService.getItems()).rejects.toThrow('Database error')
    })
  })
})
```

---

## Coverage Goals

### Overall Coverage

**Current**: 24.42%  
**Target**: 70%  
**Gap**: 45.58 percentage points

### Critical Path Coverage

**Target**: ≥90% line coverage

**Critical Paths**:
- Authentication (login, logout, session management)
- Swap request creation and approval workflow
- Leave request creation and approval workflow
- Leave balance deduction and validation
- Shift swap execution (atomic 4-shift update)

### New Code Coverage

**Target**: ≥80% for all new code

**Enforcement**: Via CI/CD checks

### Coverage by Category

**Well-Covered Areas (>70%)**:
- ✅ Components: 72.41%
- ✅ Constants: 85.71%
- ✅ Hooks: 94.73%
- ✅ Utils (partial): validators.ts (100%), sanitize.ts (91.66%), formatters.ts (85.96%)

**Under-Covered Areas (<30%)**:
- ❌ Services: 4.31% (CRITICAL)
- ❌ Services/Validation: 0%
- ❌ Types: 0%
- ❌ Utils (partial): dateHelpers.ts (0%), validation.ts (0%)
- ❌ Lib (partial): AuthContext.tsx (1.58%)

### Priority Areas for Testing

**Priority 1: Services Layer** (4.31% → 70%)
- swapRequestsService.ts (1.11%)
- leaveRequestsService.ts (1.35%)
- authService.ts (3.33%)
- headcountService.ts (1.88%)
- leaveBalancesService.ts (2.7%)
- shiftsService.ts (2.38%)
- commentsService.ts (3.33%)
- leaveTypesService.ts (3.84%)
- settingsService.ts (3.84%)

**Priority 2: Validation Layer** (0% → 70%)
- leaveBalanceValidation.ts (0%)
- validation.ts (0%)

**Priority 3: Utils Layer** (0% → 70%)
- dateHelpers.ts (0%)

**Priority 4: Context Providers** (Low → 70%)
- AuthContext.tsx (1.58%)
- ToastContext.tsx (37.5%)

---

## Coverage Monitoring

### Metrics to Track

**Violation Count**:
- Overall coverage: X%
- Services coverage: Y%
- Components coverage: Z%
- Utils coverage: W%

**Coverage Trend**:
- Track over last 30 days
- Show target line
- Highlight milestones

**Uncovered Files**:
- File name
- Current coverage
- Lines to cover
- Priority

### Tracking Coverage

#### Local Coverage Reports

```bash
# Generate report
npm run test:coverage

# View HTML report
open coverage/index.html

# View JSON summary
cat coverage/coverage-summary.json

# Extract overall coverage
cat coverage/coverage-summary.json | jq '.total.lines.pct'
```

#### CI/CD Coverage Reports

```yaml
# .github/workflows/ci.yml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
    flags: unittests
    name: codecov-umbrella
```

### Alerting

**Critical Alerts** (Immediate):
- Coverage drops below 30%
- Coverage drops by >10% in single PR
- Critical path coverage drops below 80%

**Warning Alerts** (Daily digest):
- Coverage drops below 70%
- Coverage drops by >5% in single PR
- New file added with <50% coverage

### Coverage Improvement Process

#### 1. Identify Gaps

```bash
# Find files with low coverage
npm run test:coverage
cat coverage/coverage-summary.json | jq '.[] | select(.lines.pct < 70)'
```

#### 2. Prioritize Files

**P0 - Critical**:
- Services (API layer)
- Authentication
- Business logic
- Data transformations

**P1 - High**:
- Custom hooks
- Utility functions
- Error handlers
- Validators

**P2 - Medium**:
- Components
- UI logic
- Formatters

**P3 - Low**:
- Types
- Constants
- Styles

#### 3. Write Tests

1. Pick a file from priority list
2. Review uncovered lines
3. Write tests for uncovered code
4. Run coverage report
5. Verify improvement
6. Create PR

#### 4. Track Progress

**Weekly**:
- Update coverage dashboard
- Review progress toward goal
- Celebrate milestones
- Adjust priorities

**Monthly**:
- Review overall trends
- Identify blockers
- Plan next month's focus
- Share progress with team

---

## Coverage Validation

### Validation Process

#### Step 1: Generate Coverage Report

```bash
npm run test:coverage
```

#### Step 2: Check Overall Coverage

```bash
# Extract overall coverage percentage
cat coverage/coverage-summary.json | jq '.total.lines.pct'
```

**Expected**: ≥70.0

**Validation Checklist**:
- [ ] Overall line coverage ≥70%
- [ ] Overall function coverage ≥70%
- [ ] Overall branch coverage ≥70%
- [ ] Overall statement coverage ≥70%

#### Step 3: Check Critical Path Coverage

```bash
# Check specific file coverage
cat coverage/coverage-summary.json | jq '.["src/services/authService.ts"].lines.pct'
```

**Critical Files**:
- authService.ts: ≥90%
- swapRequestsService.ts: ≥90%
- leaveRequestsService.ts: ≥90%
- leaveBalancesService.ts: ≥90%
- shiftsService.ts: ≥90%

#### Step 4: Document Results

```markdown
# Test Coverage Validation Report

**Date**: [Date]
**Validator**: [Name]
**Commit**: [SHA]

## Overall Coverage

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Lines | X.XX% | 70% | ✅ Pass / ❌ Fail |
| Functions | X.XX% | 70% | ✅ Pass / ❌ Fail |
| Branches | X.XX% | 70% | ✅ Pass / ❌ Fail |
| Statements | X.XX% | 70% | ✅ Pass / ❌ Fail |

## Critical Path Coverage

| Component | Current | Target | Status |
|-----------|---------|--------|--------|
| authService | X.XX% | 90% | ✅ Pass / ❌ Fail |
| swapRequestsService | X.XX% | 90% | ✅ Pass / ❌ Fail |
| leaveRequestsService | X.XX% | 90% | ✅ Pass / ❌ Fail |
| leaveBalancesService | X.XX% | 90% | ✅ Pass / ❌ Fail |
| shiftsService | X.XX% | 90% | ✅ Pass / ❌ Fail |

## Summary

**Overall Status**: ✅ Pass / ❌ Fail

**Notes**: [Any notes or observations]

**Action Items**: [If failed, list action items]
```

#### Step 5: Address Gaps (If Needed)

1. Identify gaps
2. Prioritize by importance
3. Write tests
4. Re-validate

### Continuous Validation

#### In CI/CD

```yaml
# .github/workflows/ci.yml
- name: Validate coverage
  run: |
    npm run test:coverage
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 70" | bc -l) )); then
      echo "::error::Coverage below 70%: $COVERAGE%"
      exit 1
    fi
    echo "Coverage: $COVERAGE%"
```

#### In PRs

**Coverage Diff**:
- Check coverage change
- Ensure new code is tested
- Block merge if coverage drops significantly

---

## Best Practices

### Do's

✅ **Focus on quality over quantity**
- Write meaningful tests
- Test behavior, not implementation
- Cover edge cases
- Test error scenarios

✅ **Test critical paths thoroughly**
- Authentication
- Data mutations
- Business logic
- Error handling

✅ **Review coverage in PRs**
- Check coverage diff
- Ensure new code is tested
- Don't merge if coverage drops significantly

✅ **Track coverage over time**
- Monitor trends
- Set goals
- Celebrate improvements

✅ **Use descriptive test names**
```typescript
// Good
it('should reject swap request when target declines', () => {});

// Bad
it('test1', () => {});
```

✅ **Follow Arrange-Act-Assert pattern**
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

### Don'ts

❌ **Don't chase 100% coverage**
- Diminishing returns
- Focus on critical code
- Some code doesn't need tests

❌ **Don't write tests just for coverage**
- Tests should be meaningful
- Test behavior, not lines
- Quality over quantity

❌ **Don't ignore coverage drops**
- Investigate immediately
- Fix before merging
- Understand root cause

❌ **Don't test implementation details**
- Test public API
- Test user-facing behavior
- Avoid brittle tests

❌ **Don't create test interdependence**
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

1. Check Supabase is running:
   ```bash
   npx supabase status
   ```

2. Restart Supabase:
   ```bash
   npx supabase stop
   npx supabase start
   ```

3. Check environment variables:
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

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Test Coverage Best Practices](https://martinfowler.com/bliki/TestCoverage.html)

---

## Summary

Testing is essential for ensuring code quality and catching regressions. Follow this guide to write effective tests and maintain high coverage.

**Key Takeaways**:
- Target 70% overall coverage, 90% for critical paths
- Write meaningful tests that test behavior
- Track coverage over time
- Review coverage in PRs
- Focus on quality over quantity
- Test critical paths thoroughly

For questions or assistance, contact the development team.
