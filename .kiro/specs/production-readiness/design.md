# Production Readiness - Design Document

## Overview

This design document outlines the technical approach for implementing production readiness improvements across the WFM application. The implementation is organized into 10 user stories covering CI/CD, testing, observability, accessibility, and performance.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   PR Event   │──────▶│ CI Workflow  │                    │
│  └──────────────┘      └──────┬───────┘                    │
│                                │                              │
│                    ┌───────────┼───────────┐                │
│                    ▼           ▼           ▼                │
│              ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│              │  Build  │ │  Lint   │ │  Test   │           │
│              └─────────┘ └─────────┘ └─────────┘           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │  Vercel App  │◀─────│    Sentry    │                    │
│  └──────┬───────┘      └──────────────┘                    │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────┐                                           │
│  │   Supabase   │                                           │
│  └──────────────┘                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Testing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Test Suite                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Unit Tests (Vitest)                       │ │
│  │  • Components  • Hooks  • Utils  • Services           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Integration Tests (React Testing Library)     │ │
│  │  • User Flows  • API Integration  • State Management  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Backend Tests (Supabase Local)              │ │
│  │  • RLS Policies  • Stored Procedures  • Triggers      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. CI/CD Pipeline (US-1)

**GitHub Actions Workflow Structure:**

```yaml
name: CI
on: [pull_request, push]

jobs:
  build:
    - Checkout code
    - Setup Node.js
    - Install dependencies
    - Run TypeScript compilation
    
  lint:
    - Run ESLint
    - Check for errors (must be zero)
    
  test:
    - Run unit tests
    - Run integration tests
    - Generate coverage report
    - Upload coverage to artifacts
    
  validate:
    - Check bundle size
    - Validate environment variables
```

**Key Files:**
- `.github/workflows/ci.yml` - Main CI workflow
- `.github/workflows/deploy.yml` - Deployment workflow (optional)

**Configuration:**
- Node.js version: 18.x
- Cache: npm dependencies
- Timeout: 10 minutes per job
- Fail fast: true

### 2. Edge Case Testing (US-2)

**Test Categories:**

**Concurrency Tests:**
```typescript
// Test concurrent approvals
describe('Concurrent Approvals', () => {
  it('should handle two TLs approving simultaneously', async () => {
    // Setup: Create request in pending_tl state
    // Action: Simulate two approval calls with same expectedStatus
    // Assert: Only one succeeds, other gets ConcurrencyError
  })
})
```

**Race Condition Tests:**
```typescript
// Test optimistic locking
describe('Optimistic Locking', () => {
  it('should prevent lost updates with concurrent modifications', async () => {
    // Setup: Fetch request with status A
    // Action: Update to status B, then try to update from A to C
    // Assert: Second update fails with ConcurrencyError
  })
})
```

**Failure Scenario Tests:**
```typescript
// Test swap execution failures
describe('Swap Execution Failures', () => {
  it('should rollback all changes if any shift update fails', async () => {
    // Setup: Create swap request with invalid shift
    // Action: Execute swap
    // Assert: All shifts remain unchanged, error is thrown
  })
})
```

**Key Files:**
- `src/test/edge-cases/concurrency.test.ts`
- `src/test/edge-cases/race-conditions.test.ts`
- `src/test/edge-cases/failures.test.ts`
- `src/test/edge-cases/boundaries.test.ts`

### 3. Business Logic Testing (US-3)

**Test Structure:**

**Atomic Swap Execution:**
```typescript
describe('Atomic Swap Execution', () => {
  it('should update all 4 shifts or none', async () => {
    // Test the execute_shift_swap stored procedure
    // Verify all 4 shifts are updated atomically
  })
  
  it('should preserve original shift data', async () => {
    // Verify original shift types are stored in swap_requests
  })
})
```

**Leave Balance Logic:**
```typescript
describe('Leave Balance Deduction', () => {
  it('should deduct balance on approval', async () => {
    // Create leave request with sufficient balance
    // Approve request
    // Verify balance is deducted
  })
  
  it('should deny request with insufficient balance', async () => {
    // Create leave request with insufficient balance
    // Verify status is 'denied'
  })
})
```

**Approval Workflows:**
```typescript
describe('Multi-Level Approval', () => {
  it('should follow pending_tl → pending_wfm → approved flow', async () => {
    // Test normal approval flow
  })
  
  it('should skip WFM approval when auto-approve enabled', async () => {
    // Test auto-approve flow
  })
})
```

**Key Files:**
- `src/test/business-logic/swap-execution.test.ts`
- `src/test/business-logic/leave-balances.test.ts`
- `src/test/business-logic/approval-workflows.test.ts`
- `src/test/business-logic/exception-requests.test.ts`

### 4. Backend Logic Testing (US-4)

**Supabase Testing Setup:**

```typescript
// Test database configuration
const testSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL!,
  process.env.VITE_SUPABASE_TEST_ANON_KEY!
)

// Test data factory
function createTestUser(role: UserRole) {
  return testSupabase.from('users').insert({
    email: `test-${Date.now()}@dabdoob.com`,
    name: 'Test User',
    role
  })
}
```

**RLS Policy Tests:**
```typescript
describe('RLS Policies', () => {
  describe('Agent Role', () => {
    it('should allow viewing own shifts', async () => {
      // Test agent can view their shifts
    })
    
    it('should prevent viewing other users shifts', async () => {
      // Test agent cannot view other shifts
    })
  })
  
  describe('TL Role', () => {
    it('should allow approving team requests', async () => {
      // Test TL can approve requests
    })
  })
  
  describe('WFM Role', () => {
    it('should allow full access to all data', async () => {
      // Test WFM has full access
    })
  })
})
```

**Stored Procedure Tests:**
```typescript
describe('execute_shift_swap', () => {
  it('should swap all 4 shifts atomically', async () => {
    // Call RPC function
    // Verify all shifts updated
  })
  
  it('should return error for invalid inputs', async () => {
    // Call with invalid data
    // Verify error response
  })
})
```

**Key Files:**
- `src/test/backend/rls-policies.test.ts`
- `src/test/backend/stored-procedures.test.ts`
- `src/test/backend/triggers.test.ts`
- `src/test/backend/test-setup.ts`

### 5. Frontend Integration Testing (US-5)

**Integration Test Structure:**

```typescript
describe('Swap Request Flow', () => {
  it('should complete full swap request lifecycle', async () => {
    // 1. Login as agent
    // 2. Navigate to create swap request
    // 3. Fill form and submit
    // 4. Login as target user
    // 5. Accept request
    // 6. Login as TL
    // 7. Approve request
    // 8. Login as WFM
    // 9. Approve request
    // 10. Verify shifts are swapped
  })
})
```

**Authentication Flow Tests:**
```typescript
describe('Authentication Flow', () => {
  it('should login with valid credentials', async () => {
    // Test successful login
  })
  
  it('should reject invalid domain', async () => {
    // Test domain validation
  })
  
  it('should redirect to unauthorized page', async () => {
    // Test unauthorized access
  })
})
```

**Key Files:**
- `src/test/integration/swap-request-flow.test.tsx`
- `src/test/integration/leave-request-flow.test.tsx`
- `src/test/integration/authentication-flow.test.tsx`
- `src/test/integration/rbac-flow.test.tsx`

### 6. Accessibility Audit (US-6)

**Audit Process:**

1. **Automated Testing:**
   - Run axe DevTools on all pages
   - Generate accessibility report
   - Document violations by severity

2. **Manual Testing:**
   - Screen reader testing (NVDA/JAWS)
   - Keyboard navigation testing
   - Color contrast verification
   - Focus management testing

3. **Documentation:**
   - Create accessibility report
   - Prioritize issues by severity
   - Create remediation tickets

**Audit Checklist:**

```markdown
## Page: Dashboard
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announces all content correctly
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus indicators are visible
- [ ] Form labels are properly associated
- [ ] ARIA attributes are correct
- [ ] Heading hierarchy is logical
- [ ] Images have alt text

## Page: Swap Requests
[Same checklist repeated for each page]
```

**Key Files:**
- `docs/accessibility-audit.md` - Audit report
- `docs/accessibility-remediation.md` - Remediation plan
- `.github/ISSUE_TEMPLATE/accessibility.md` - Issue template

### 7. Data Fetching Optimization (US-7)

**Pagination Implementation:**

```typescript
// Consistent pagination hook
export function usePaginatedQuery<T>(
  queryKey: string[],
  fetchFn: (cursor?: string, limit?: number) => Promise<T[]>,
  options?: {
    pageSize?: number
    enabled?: boolean
  }
) {
  const [cursor, setCursor] = useState<string | undefined>()
  const pageSize = options?.pageSize ?? 20
  
  const query = useQuery({
    queryKey: [...queryKey, cursor],
    queryFn: () => fetchFn(cursor, pageSize),
    enabled: options?.enabled,
    staleTime: CACHE_TIME.MEDIUM,
  })
  
  return {
    ...query,
    nextPage: () => setCursor(/* next cursor */),
    prevPage: () => setCursor(/* prev cursor */),
  }
}
```

**Service Layer Updates:**

```typescript
// Add pagination to all list methods
export const swapRequestsService = {
  async getSwapRequests(cursor?: string, limit = 20): Promise<{
    data: SwapRequest[]
    nextCursor?: string
  }> {
    let query = supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (cursor) {
      query = query.gt('created_at', cursor)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return {
      data: data as SwapRequest[],
      nextCursor: data.length === limit ? data[data.length - 1].created_at : undefined
    }
  }
}
```

**Key Files:**
- `src/hooks/usePaginatedQuery.ts` - Pagination hook
- `src/services/swapRequestsService.ts` - Updated with pagination
- `src/services/leaveRequestsService.ts` - Updated with pagination
- `src/services/headcountService.ts` - Updated with pagination

### 8. Production Error Tracking (US-8)

**Sentry Integration:**

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not configured')
    return
  }
  
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Add user context
      if (event.user) {
        event.user.id = event.user.id
        delete event.user.email // Remove PII
      }
      return event
    },
  })
}
```

**Error Handler Integration:**

```typescript
// Update errorHandler.ts
private sendToErrorTracking(errorLog: ErrorLog): void {
  if (import.meta.env.PROD && window.Sentry) {
    Sentry.captureException(errorLog.error, {
      extra: errorLog.context,
      tags: {
        errorType: errorLog.context.type as string,
      },
    })
  }
}
```

**Key Files:**
- `src/lib/sentry.ts` - Sentry initialization
- `src/lib/errorHandler.ts` - Updated with Sentry integration
- `src/lib/securityLogger.ts` - Updated with Sentry integration
- `vite.config.ts` - Sentry plugin configuration

### 9. Technical Debt Documentation (US-9)

**Documentation Structure:**

```markdown
# Technical Debt Inventory

## High Priority

### PWA Icons Missing
- **Description**: 192x192 and 512x512 icons not generated
- **Impact**: PWA installation experience degraded
- **Effort**: 2 hours
- **Priority**: Medium
- **Tracking**: Issue #123

### Sentry Integration Incomplete
- **Description**: TODO comments remain in error tracking
- **Impact**: Production errors not fully captured
- **Effort**: 4 hours
- **Priority**: High
- **Tracking**: Issue #124

## Medium Priority

[Additional items...]

## Low Priority

[Additional items...]
```

**Key Files:**
- `docs/technical-debt.md` - Debt inventory
- `docs/debt-reduction-plan.md` - Quarterly plan
- `.github/ISSUE_TEMPLATE/tech-debt.md` - Issue template

### 10. Test Coverage Expansion (US-10)

**Coverage Goals:**

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
    },
  },
})
```

**Test Organization:**

```
src/test/
├── components/          # Component tests
│   ├── Dashboard.test.tsx
│   ├── Layout.test.tsx
│   └── ...
├── hooks/              # Hook tests
│   ├── useAuth.test.tsx
│   ├── useSwapRequests.test.tsx
│   └── ...
├── services/           # Service tests
│   ├── authService.test.ts
│   ├── swapRequestsService.test.ts
│   └── ...
├── utils/              # Utility tests (existing)
├── integration/        # Integration tests
├── edge-cases/         # Edge case tests
├── business-logic/     # Business logic tests
└── backend/            # Backend tests
```

**Key Files:**
- All test files following naming convention `*.test.ts` or `*.test.tsx`
- `vitest.config.ts` - Coverage configuration
- `src/test/setup.ts` - Test setup and utilities

## Data Models

### Test Data Factories

```typescript
// src/test/factories/userFactory.ts
export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email({ provider: 'dabdoob.com' }),
    name: faker.person.fullName(),
    role: 'agent',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// src/test/factories/swapRequestFactory.ts
export function createTestSwapRequest(overrides?: Partial<SwapRequest>): SwapRequest {
  return {
    id: faker.string.uuid(),
    requester_id: faker.string.uuid(),
    target_user_id: faker.string.uuid(),
    requester_shift_id: faker.string.uuid(),
    target_shift_id: faker.string.uuid(),
    status: 'pending_acceptance',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}
```

### Test Database Schema

```sql
-- Test database uses same schema as production
-- Seeded with test data for consistent testing
-- Cleaned between test runs
```

## API Contracts

### No API Changes Required

This spec does not introduce new API endpoints. All changes are internal improvements to testing, observability, and quality.

## Error Handling

### Enhanced Error Context

```typescript
// Add test context to errors
export function handleTestError(error: unknown, testContext: {
  testName: string
  testFile: string
  testData?: unknown
}): void {
  console.error('Test Error:', {
    ...testContext,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
  })
  throw error
}
```

## Security Considerations

### Test Data Security

1. **No Production Data**: Tests use synthetic data only
2. **Credentials**: Test credentials stored in environment variables
3. **Isolation**: Test database separate from production
4. **Cleanup**: Test data cleaned after each run

### Sentry Security

1. **PII Removal**: Email and sensitive data removed before sending
2. **Access Control**: Sentry access limited to developers
3. **Data Retention**: Configure appropriate retention period
4. **Sampling**: Use sampling to control data volume

## Performance Considerations

### CI/CD Performance

- **Caching**: Cache npm dependencies between runs
- **Parallelization**: Run tests in parallel where possible
- **Timeout**: Set reasonable timeouts (10 minutes)
- **Fail Fast**: Stop on first failure in PR checks

### Test Performance

- **Isolation**: Each test is independent
- **Cleanup**: Proper cleanup after each test
- **Mocking**: Mock external services where appropriate
- **Fixtures**: Reuse test fixtures where possible

## Accessibility Standards

### WCAG 2.1 Level AA Compliance

**Perceivable:**
- Text alternatives for non-text content
- Captions and alternatives for multimedia
- Content can be presented in different ways
- Content is easier to see and hear

**Operable:**
- All functionality available from keyboard
- Users have enough time to read and use content
- Content does not cause seizures
- Users can easily navigate and find content

**Understandable:**
- Text is readable and understandable
- Content appears and operates in predictable ways
- Users are helped to avoid and correct mistakes

**Robust:**
- Content is compatible with current and future tools
- ARIA attributes used correctly
- Valid HTML markup

## Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │   E2E (5%)  │  ← Integration tests
        ├─────────────┤
        │ Integration │  ← Component integration
        │    (15%)    │
        ├─────────────┤
        │    Unit     │  ← Unit tests
        │    (80%)    │
        └─────────────┘
```

### Test Types

1. **Unit Tests (80%)**
   - Individual functions and components
   - Fast execution (<1ms per test)
   - High coverage of edge cases

2. **Integration Tests (15%)**
   - Component interactions
   - Service layer integration
   - React Query integration

3. **E2E Tests (5%)**
   - Critical user flows
   - Full stack integration
   - Slower execution (acceptable)

### Test Execution

**Local Development:**
```bash
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage
```

**CI Pipeline:**
```bash
npm run test:run          # All tests
npm run test:coverage     # Generate coverage
```

## Deployment Strategy

### Phase 1: Foundation (Week 1-2)
1. Set up CI/CD pipeline
2. Configure Sentry
3. Set up test database
4. Document process

### Phase 2: Critical Testing (Week 3-5)
1. Write edge case tests
2. Write business logic tests
3. Write backend tests
4. Achieve 50% coverage

### Phase 3: Integration & Coverage (Week 6-7)
1. Write integration tests
2. Expand coverage to 70%
3. Optimize data fetching
4. Performance testing

### Phase 4: Quality & Documentation (Week 8)
1. Accessibility audit
2. Document technical debt
3. Create remediation plans
4. Final review

## Rollback Plan

### If CI/CD Causes Issues
1. Disable workflow temporarily
2. Fix configuration
3. Re-enable with limited scope
4. Gradually expand

### If Tests Are Flaky
1. Identify flaky tests
2. Mark as skip temporarily
3. Fix root cause
4. Re-enable tests

### If Sentry Causes Performance Issues
1. Reduce sample rate
2. Disable replay feature
3. Optimize beforeSend hook
4. Monitor performance

## Monitoring and Metrics

### CI/CD Metrics
- Build success rate
- Average build time
- Test pass rate
- Coverage percentage

### Error Tracking Metrics
- Error rate
- Error resolution time
- Unique errors
- Affected users

### Accessibility Metrics
- WCAG violations by severity
- Remediation progress
- Compliance percentage

### Performance Metrics
- Test execution time
- Coverage percentage
- Bundle size
- Page load time

## Success Criteria

This design is considered successful when:

1. ✅ CI/CD pipeline runs reliably on all PRs
2. ✅ Test suite has >150 tests with >70% coverage
3. ✅ All critical paths have >90% coverage
4. ✅ Sentry captures 100% of production errors
5. ✅ Accessibility audit shows zero critical violations
6. ✅ Data fetching is optimized with pagination
7. ✅ Technical debt is documented and tracked
8. ✅ Team confidence in production deployment is high
9. ✅ Bug detection rate in CI increases
10. ✅ Production incident response time decreases

## Open Questions

1. **Test Database**: Should we use Supabase local or separate test project?
   - **Recommendation**: Start with Supabase local, migrate to test project if needed

2. **Coverage Threshold**: Should we enforce 70% coverage in CI?
   - **Recommendation**: Start with reporting only, enforce after reaching threshold

3. **Accessibility Tools**: Which screen reader should be primary?
   - **Recommendation**: NVDA (free) for primary testing, JAWS for validation

4. **Sentry Sampling**: What sample rate should we use?
   - **Recommendation**: 10% for traces, 100% for errors

5. **Test Parallelization**: Should we run tests in parallel?
   - **Recommendation**: Yes, but ensure proper isolation

## Appendix

### A. GitHub Actions Example

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v3
        with:
          name: coverage
          path: coverage/
```

### B. Test Utilities

```typescript
// src/test/utils/testHelpers.ts

export function renderWithProviders(
  ui: React.ReactElement,
  options?: {
    user?: User
    queryClient?: QueryClient
  }
) {
  const queryClient = options?.queryClient ?? new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialUser={options?.user}>
        <ToastProvider>
          {ui}
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export async function waitForLoadingToFinish() {
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
}
```

### C. Accessibility Testing Checklist

See separate document: `docs/accessibility-checklist.md`

### D. Technical Debt Template

See separate document: `docs/tech-debt-template.md`
