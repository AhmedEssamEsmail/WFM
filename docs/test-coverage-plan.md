# Test Coverage Expansion Plan

## Current Status

**Test Count**: 299 passing tests  
**Overall Coverage**: 24.42%  
**Target Coverage**: 70%  
**Gap**: 45.58 percentage points

## Coverage by Category

### Well-Covered Areas (>70%)
- ✅ **Components**: 72.41% coverage
  - Skeleton.tsx: 56.25%
  - Toast.tsx: 100%
  - ToastContainer.tsx: 50%
- ✅ **Constants**: 85.71% coverage
- ✅ **Hooks**: 94.73% coverage
  - useAuth.ts: 94.73%
- ✅ **Utils (partial)**: 36.79% overall
  - validators.ts: 100%
  - sanitize.ts: 91.66%
  - formatters.ts: 85.96%
  - csvHelpers.ts: 56.57%

### Under-Covered Areas (<30%)
- ❌ **Services**: 4.31% coverage (CRITICAL)
  - authService.ts: 3.33%
  - commentsService.ts: 3.33%
  - headcountService.ts: 1.88%
  - leaveBalancesService.ts: 2.7%
  - leaveRequestsService.ts: 1.35%
  - leaveTypesService.ts: 3.84%
  - settingsService.ts: 3.84%
  - shiftsService.ts: 2.38%
  - swapRequestsService.ts: 1.11%
- ❌ **Services/Validation**: 0% coverage
  - leaveBalanceValidation.ts: 0%
- ❌ **Types**: 0% coverage
  - errors.ts: 0%
- ❌ **Utils (partial)**: 
  - dateHelpers.ts: 0%
  - validation.ts: 0%
- ❌ **Lib (partial)**: 41.33% overall
  - AuthContext.tsx: 1.58%
  - ToastContext.tsx: 37.5%
  - errorHandler.ts: 82.75% ✅

## Priority Areas for Testing

### Priority 1: Services Layer (4.31% → 70%)
**Impact**: Highest - Services contain critical business logic  
**Effort**: High - 9 service files need comprehensive tests  
**Tests Needed**: ~90-120 tests

#### Files to Test:
1. **swapRequestsService.ts** (1.11% coverage)
   - Test all CRUD operations
   - Test executeSwap with valid/invalid data
   - Test optimistic locking
   - Test error handling
   - **Estimated**: 15-20 tests

2. **leaveRequestsService.ts** (1.35% coverage)
   - Test all CRUD operations
   - Test status updates with optimistic locking
   - Test validation integration
   - Test error handling
   - **Estimated**: 15-20 tests

3. **authService.ts** (3.33% coverage)
   - Test login/logout
   - Test domain validation
   - Test session management
   - Test error handling
   - **Estimated**: 10-12 tests

4. **headcountService.ts** (1.88% coverage)
   - Test employee CRUD operations
   - Test department operations
   - Test audit logging
   - **Estimated**: 12-15 tests

5. **leaveBalancesService.ts** (2.7% coverage)
   - Test balance retrieval
   - Test balance updates
   - Test history tracking
   - **Estimated**: 10-12 tests

6. **shiftsService.ts** (2.38% coverage)
   - Test shift CRUD operations
   - Test shift queries
   - **Estimated**: 10-12 tests

7. **commentsService.ts** (3.33% coverage)
   - Test comment creation
   - Test system vs user comments
   - Test comment protection
   - **Estimated**: 8-10 tests

8. **leaveTypesService.ts** (3.84% coverage)
   - Test leave type retrieval
   - Test leave type management
   - **Estimated**: 6-8 tests

9. **settingsService.ts** (3.84% coverage)
   - Test settings CRUD
   - Test settings validation
   - **Estimated**: 6-8 tests

### Priority 2: Validation Layer (0% → 70%)
**Impact**: High - Validation prevents bad data  
**Effort**: Medium - 2 files need tests  
**Tests Needed**: ~20-30 tests

#### Files to Test:
1. **leaveBalanceValidation.ts** (0% coverage)
   - Test balance validation logic
   - Test insufficient balance detection
   - Test overlapping request detection
   - **Estimated**: 12-15 tests

2. **validation.ts** (0% coverage)
   - Test all validation functions
   - Test edge cases
   - Test error messages
   - **Estimated**: 15-20 tests

### Priority 3: Utils Layer (0% → 70%)
**Impact**: Medium - Utilities used throughout app  
**Effort**: Medium - 1 file needs tests  
**Tests Needed**: ~15-20 tests

#### Files to Test:
1. **dateHelpers.ts** (0% coverage)
   - Test date formatting
   - Test date calculations
   - Test business day calculations
   - Test timezone handling
   - **Estimated**: 15-20 tests

### Priority 4: Context Providers (Low → 70%)
**Impact**: Medium - Core app functionality  
**Effort**: Medium - 2 files need tests  
**Tests Needed**: ~15-20 tests

#### Files to Test:
1. **AuthContext.tsx** (1.58% coverage)
   - Test authentication state management
   - Test login/logout flows
   - Test session persistence
   - **Estimated**: 10-12 tests

2. **ToastContext.tsx** (37.5% coverage)
   - Test toast creation
   - Test toast dismissal
   - Test multiple toasts
   - **Estimated**: 8-10 tests

### Priority 5: Error Types (0% → 70%)
**Impact**: Low - Mostly type definitions  
**Effort**: Low - 1 file needs tests  
**Tests Needed**: ~10-15 tests

#### Files to Test:
1. **errors.ts** (0% coverage)
   - Test error class instantiation
   - Test error properties
   - Test error serialization
   - **Estimated**: 10-15 tests

## Implementation Plan

### Phase 1: Services Layer (Week 1-2)
**Goal**: Increase services coverage from 4.31% to 70%

1. **Week 1**: Core services
   - swapRequestsService.ts
   - leaveRequestsService.ts
   - authService.ts
   - **Target**: 45 tests, ~15% overall coverage increase

2. **Week 2**: Supporting services
   - headcountService.ts
   - leaveBalancesService.ts
   - shiftsService.ts
   - commentsService.ts
   - leaveTypesService.ts
   - settingsService.ts
   - **Target**: 60 tests, ~20% overall coverage increase

### Phase 2: Validation & Utils (Week 3)
**Goal**: Increase validation and utils coverage to 70%

1. **Days 1-2**: Validation layer
   - leaveBalanceValidation.ts
   - validation.ts
   - **Target**: 30 tests, ~8% overall coverage increase

2. **Days 3-5**: Utils layer
   - dateHelpers.ts
   - **Target**: 20 tests, ~5% overall coverage increase

### Phase 3: Context & Error Types (Week 4)
**Goal**: Increase context and error coverage to 70%

1. **Days 1-3**: Context providers
   - AuthContext.tsx
   - ToastContext.tsx
   - **Target**: 20 tests, ~5% overall coverage increase

2. **Days 4-5**: Error types
   - errors.ts
   - **Target**: 15 tests, ~2% overall coverage increase

## Test Writing Guidelines

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

### Validation Tests Template

```typescript
import { describe, it, expect } from 'vitest'
import { validateEmail, validateRequired } from './validation'

describe('validation', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('missing@domain')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail(null as any)).toBe(false)
      expect(validateEmail(undefined as any)).toBe(false)
    })
  })
})
```

### Context Tests Template

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

describe('AuthContext', () => {
  it('should provide auth state', () => {
    const TestComponent = () => {
      const { user, isLoading } = useAuth()
      return (
        <div>
          <div data-testid="loading">{isLoading ? 'Loading' : 'Loaded'}</div>
          <div data-testid="user">{user ? user.name : 'No user'}</div>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
  })
})
```

## Coverage Thresholds

Update `vitest.config.ts` to enforce coverage thresholds:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      // Per-file thresholds
      perFile: true,
      // Fail CI if coverage drops below threshold
      thresholdAutoUpdate: false,
    },
  },
})
```

## Success Metrics

### Quantitative Metrics
- **Overall Coverage**: 24.42% → 70% (+45.58%)
- **Test Count**: 299 → 450+ tests (+150 tests)
- **Services Coverage**: 4.31% → 70% (+65.69%)
- **Validation Coverage**: 0% → 70% (+70%)
- **Utils Coverage**: 36.79% → 70% (+33.21%)

### Qualitative Metrics
- All critical business logic tested
- All CRUD operations tested
- All validation functions tested
- All error paths tested
- All edge cases covered

## Monitoring

### CI Integration
- Run coverage on every PR
- Block merge if coverage drops
- Generate coverage reports
- Track coverage trends

### Coverage Reports
- HTML report: `coverage/index.html`
- JSON report: `coverage/coverage-final.json`
- LCOV report: `coverage/lcov.info`

### Tools
- Vitest coverage (v8)
- GitHub Actions integration
- Coverage badges in README

## Notes

- Focus on critical paths first (services, validation)
- Write tests for new code as it's developed
- Refactor existing code to be more testable
- Use mocks sparingly - prefer integration tests
- Test behavior, not implementation
- Keep tests simple and readable
- Use descriptive test names
- Group related tests with describe blocks

## References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Test Coverage Best Practices](https://martinfowler.com/bliki/TestCoverage.html)
- [Writing Testable Code](https://testing.googleblog.com/2008/08/by-miko-hevery-so-you-decided-to.html)
