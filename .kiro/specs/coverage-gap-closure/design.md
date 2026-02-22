# Design: Coverage Gap Closure to 80%

## 1. Overview

This design focuses on systematically closing coverage gaps to reach the 80% target across all layers. The approach prioritizes files with the lowest coverage and highest criticality, using a phased implementation strategy.

## 2. Current State Analysis

### 2.1 Coverage Gaps by Layer

**Overall**: 44.77% → Target: 80% (Gap: 35.23%)

**By Layer**:
- Hooks: 65.47% → Target: 80% (Gap: 14.53%)
- Lib: 44.8% → Target: 80% (Gap: 35.2%)
- Components: 56.19% → Target: 80% (Gap: 23.81%)
- Services: 72.11% → Target: 80% (Gap: 7.89%)

### 2.2 Critical Files with 0% Coverage

**Pages** (All 0%):
- src/pages/BreakSchedule.tsx
- src/pages/Dashboard.tsx
- src/pages/RequestManagement.tsx
- src/pages/Auth/Login.tsx
- src/pages/Auth/Signup.tsx
- src/pages/Headcount/* (all files)
- src/pages/LeaveRequests/* (all files)
- src/pages/OvertimeRequests/* (all files)
- src/pages/Reports/* (all files)
- src/pages/Schedule/* (all files)
- src/pages/Settings/* (all files)
- src/pages/SwapRequests/* (all files)

**Components** (0% or very low):
- AutoDistributionSettings: 0%
- BreakSchedule subcomponents: 0%
- Headcount components: 0%
- OvertimeRequests components: 0%
- Schedule components: 0%

**Libs**:
- sentry: 0%
- autoDistribution: 9.23%
- performance: 13.63%

**Hooks**:
- useBreakSchedules: 19.29%
- useOvertimeRequests: 43.07%
- useHeadcount: 43.28%

**Services**:
- breakSchedulesService: 7.02%

## 3. Implementation Strategy

### 3.1 Phased Approach

**Phase 1: Critical Services & Libs (P0)**
- Focus: breakSchedulesService, autoDistribution, useBreakSchedules
- Target: Bring these from <20% to 80%
- Impact: High - these are core business logic

**Phase 2: Critical Hooks (P0)**
- Focus: useBreakSchedules, useOvertimeRequests, useHeadcount
- Target: Bring these from 19-43% to 80%
- Impact: High - these power major features

**Phase 3: Page Components (P0)**
- Focus: All page components with 0% coverage
- Target: Bring from 0% to 80%
- Impact: High - these are user-facing entry points

**Phase 4: Complex Components (P1)**
- Focus: BreakSchedule, Settings, Headcount components
- Target: Bring from 0% to 80%
- Impact: Medium - these are feature-specific

**Phase 5: Remaining Gaps (P2)**
- Focus: All remaining files below 80%
- Target: Bring all to 80%
- Impact: Medium - polish to meet targets

### 3.2 Testing Patterns

#### 3.2.1 Service Testing Pattern
```typescript
// Pattern for testing services with Supabase mocks
describe('serviceName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Mock Supabase response
      // Call method
      // Assert result
    });

    it('should handle error case', async () => {
      // Mock Supabase error
      // Call method
      // Assert error handling
    });

    it('should handle edge case', async () => {
      // Mock edge case scenario
      // Call method
      // Assert behavior
    });
  });
});
```

#### 3.2.2 Hook Testing Pattern
```typescript
// Pattern for testing hooks with React Query
describe('useHookName', () => {
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
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch data', async () => {
    // Mock service
    // Render hook
    // Wait for data
    // Assert state
  });

  it('should handle mutations', async () => {
    // Mock service
    // Render hook
    // Trigger mutation
    // Assert result
  });
});
```

#### 3.2.3 Component Testing Pattern
```typescript
// Pattern for testing components
describe('ComponentName', () => {
  it('should render with props', () => {
    // Render component
    // Assert rendered output
  });

  it('should handle user interactions', async () => {
    // Render component
    // Simulate user action
    // Assert behavior
  });

  it('should handle loading state', () => {
    // Render with loading prop
    // Assert loading UI
  });

  it('should handle error state', () => {
    // Render with error prop
    // Assert error UI
  });
});
```

#### 3.2.4 Page Testing Pattern
```typescript
// Pattern for testing page components
describe('PageName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page', () => {
    // Mock hooks/services
    // Render page
    // Assert page structure
  });

  it('should handle data loading', async () => {
    // Mock data fetch
    // Render page
    // Wait for data
    // Assert data display
  });

  it('should handle user actions', async () => {
    // Render page
    // Simulate action
    // Assert result
  });
});
```

## 4. Coverage Improvement Strategies

### 4.1 For Low Coverage Files (<20%)

**Strategy**: Comprehensive rewrite of test file
1. Analyze all exported functions/components
2. Create test for each function/component
3. Test all branches and conditions
4. Test all error paths
5. Test all edge cases

### 4.2 For Medium Coverage Files (20-60%)

**Strategy**: Gap analysis and targeted tests
1. Run coverage report to identify untested lines
2. Analyze untested code paths
3. Add tests for missing branches
4. Add tests for error handling
5. Add tests for edge cases

### 4.3 For High Coverage Files (60-79%)

**Strategy**: Polish and edge case testing
1. Identify remaining untested lines
2. Add tests for edge cases
3. Add tests for error scenarios
4. Ensure all branches are covered

## 5. Test Organization

### 5.1 File Structure
```
src/test/
├── gap-closure/
│   ├── services/
│   │   └── breakSchedulesService.comprehensive.test.ts
│   ├── hooks/
│   │   ├── useBreakSchedules.comprehensive.test.ts
│   │   ├── useOvertimeRequests.comprehensive.test.ts
│   │   └── useHeadcount.comprehensive.test.ts
│   ├── lib/
│   │   ├── autoDistribution.comprehensive.test.ts
│   │   └── performance.comprehensive.test.ts
│   ├── components/
│   │   ├── AutoDistributionSettings.test.tsx
│   │   └── BreakSchedule/
│   │       ├── AgentRow.test.tsx
│   │       ├── AutoDistributeModal.test.tsx
│   │       └── ...
│   └── pages/
│       ├── BreakSchedule.test.tsx
│       ├── Dashboard.test.tsx
│       └── ...
```

### 5.2 Naming Convention
- Comprehensive tests: `*.comprehensive.test.ts(x)`
- Gap closure tests: `*.gap.test.ts(x)`
- Edge case tests: `*.edge.test.ts(x)`

## 6. Mock Strategy

### 6.1 Service Mocks
- Mock Supabase client for all service tests
- Create reusable mock factories
- Mock both success and error responses
- Mock edge cases (empty data, null values, etc.)

### 6.2 Hook Mocks
- Mock underlying services
- Mock React Query client
- Mock context providers
- Create wrapper utilities

### 6.3 Component Mocks
- Mock child components when needed
- Mock hooks used by components
- Mock router for navigation tests
- Mock context providers

## 7. Validation Strategy

### 7.1 Per-Phase Validation
After each phase:
1. Run full test suite
2. Generate coverage report
3. Verify phase targets met
4. Identify remaining gaps
5. Adjust strategy if needed

### 7.2 Final Validation
Before completion:
1. Overall coverage >= 80%
2. All layers >= 80%
3. No file < 70%
4. All tests passing
5. Test execution < 60s

## 8. Risk Mitigation

### 8.1 Risks
- **Risk**: Test execution time exceeds 60s
  - **Mitigation**: Optimize slow tests, use parallel execution
- **Risk**: Flaky tests due to async operations
  - **Mitigation**: Use proper waitFor, avoid arbitrary timeouts
- **Risk**: Mock complexity makes tests brittle
  - **Mitigation**: Use minimal mocks, test real behavior where possible
- **Risk**: Coverage target not reached
  - **Mitigation**: Phased approach with checkpoints, adjust strategy

## 9. Success Metrics

### 9.1 Coverage Metrics
- Overall: 44.77% → 80%+ (35.23% improvement)
- Hooks: 65.47% → 80%+ (14.53% improvement)
- Lib: 44.8% → 80%+ (35.2% improvement)
- Components: 56.19% → 80%+ (23.81% improvement)
- Services: 72.11% → 80%+ (7.89% improvement)

### 9.2 Quality Metrics
- All tests passing: 100%
- Test execution time: < 60s
- No skipped tests: 0
- No flaky tests: 0

### 9.3 Completeness Metrics
- Files with 0% coverage: 0
- Files with < 70% coverage: 0
- Untested exported functions: 0
