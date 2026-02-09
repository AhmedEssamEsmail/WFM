# Design Document: Code Cleanup and Fixes

## Overview

This design addresses systematic code quality improvements for a React + TypeScript + Vite + Supabase WFM application. The solution focuses on four main areas: (1) fixing critical configuration issues that could cause runtime failures or security problems, (2) resolving TypeScript type safety issues, (3) eliminating ESLint errors and warnings, and (4) ensuring production readiness through proper PWA configuration and documentation.

The approach prioritizes fixes by severity: critical configuration issues first (environment variables, Vite compatibility), then high-priority structural issues (duplicate types, migration numbering), followed by code quality improvements (ESLint errors and warnings), and finally polish items (documentation, PWA icons).

## Architecture

### Component Organization

The codebase follows a standard React application structure:

```
src/
├── components/        # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/              # Core libraries (Auth, Toast contexts)
├── pages/            # Page-level components
├── services/         # API service layer
├── test/             # Test files and utilities
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

### Fix Categories

**Category 1: Critical Configuration Fixes**
- Environment variable security (.env.example)
- Vite API compatibility (process.env → import.meta.env)

**Category 2: High Priority Structural Fixes**
- TypeScript type definition deduplication
- Database migration file numbering

**Category 3: Medium Priority Code Quality Fixes**
- ESLint @typescript-eslint/no-explicit-any errors (44 instances)
- ESLint @typescript-eslint/no-unused-vars errors (6 instances)
- ESLint react-hooks/exhaustive-deps warnings (16 instances)

**Category 4: Low Priority Polish Fixes**
- Documentation consolidation
- PWA icon configuration

## Components and Interfaces

### Environment Configuration Module

**Purpose**: Ensure .env.example contains only safe placeholder values

**Interface**:
```typescript
// No code interface - this is a configuration file fix
// .env.example should follow this pattern:
interface EnvExamplePattern {
  VITE_SUPABASE_URL: "https://your-project-id.supabase.co"
  VITE_SUPABASE_ANON_KEY: "your-supabase-anon-key-here"
  VITE_SENTRY_DSN: ""
  VITE_SENTRY_ENVIRONMENT: "development"
}
```

**Implementation Strategy**:
- Review .env.example for any real credentials
- Replace with generic placeholders
- Verify format matches "your-*" pattern

### Vite Environment Variable Adapter

**Purpose**: Replace Node.js process.env with Vite import.meta.env

**Current Pattern** (incorrect for Vite):
```typescript
if (process.env.NODE_ENV === 'production') {
  // production logic
}
```

**Target Pattern** (correct for Vite):
```typescript
if (import.meta.env.PROD) {
  // production logic
}

// Or for mode checking:
if (import.meta.env.MODE === 'production') {
  // production logic
}
```

**Affected Files**:
- src/test/lib/errorHandler.test.ts

### TypeScript Type Deduplication Module

**Purpose**: Ensure single source of truth for LeaveTypeConfig type

**Current State**: Potential duplicate definitions in:
- src/types/index.ts
- src/services/leaveTypesService.ts

**Target State**: Single canonical definition

**Strategy**:
1. Locate all LeaveTypeConfig definitions
2. Identify the most complete/correct version
3. Remove duplicates
4. Update imports to reference canonical location

### Migration File Renumbering Module

**Purpose**: Ensure unique sequential migration numbers

**Current State**:
- 007_add_denied_status_to_leave_requests.sql
- 007_swap_requests_additional_original_shift_types.sql (duplicate)

**Target State**:
- Rename second file to next available number (014)
- Maintain chronological order based on file creation time

**Strategy**:
1. Check file creation timestamps
2. Rename newer file to 014
3. Verify no other duplicates exist

### TypeScript Any Type Elimination Module

**Purpose**: Replace all 'any' types with specific TypeScript types

**Pattern for Fixes**:

**Event Handlers**:
```typescript
// Before
const handleClick = (e: any) => { }

// After
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { }
```

**API Responses**:
```typescript
// Before
const data: any = await response.json()

// After
interface ApiResponse {
  id: string
  name: string
}
const data: ApiResponse = await response.json()
```

**Error Objects**:
```typescript
// Before
catch (error: any) {
  console.error(error.message)
}

// After
catch (error) {
  if (error instanceof Error) {
    console.error(error.message)
  }
}
```

**Generic Objects**:
```typescript
// Before
const config: any = { }

// After
const config: Record<string, unknown> = { }
// Or better: define specific interface
interface Config {
  key: string
  value: number
}
const config: Config = { }
```

**Affected Files** (44 errors across 20 files):
- src/components/Layout.tsx (11 errors)
- src/components/PublicRoute.tsx (1 error)
- src/lib/AuthContext.tsx (2 errors)
- src/lib/performance.ts (6 errors)
- src/pages/Dashboard.tsx (3 errors)
- src/pages/Headcount/EmployeeDetail.tsx (3 errors)
- src/pages/Headcount/EmployeeDirectory.tsx (4 errors)
- src/pages/Headcount/HeadcountDashboard.tsx (1 error)
- src/pages/LeaveRequests/LeaveRequestDetail.tsx (1 error)
- src/pages/LeaveRequests/LeaveRequests.tsx (1 error)
- src/pages/Reports.tsx (1 error)
- src/pages/Schedule/Schedule.tsx (1 error)
- src/pages/Settings.tsx (1 error)
- src/pages/SwapRequests/SwapRequestDetail.tsx (1 error)
- src/pages/SwapRequests/SwapRequests.tsx (3 errors)
- src/test/integration/errorHandling.integration.test.tsx (3 errors)
- src/test/lib/errorHandler.test.ts (1 error)
- src/test/utils/sanitize.test.ts (1 error)
- src/types/errors.ts (3 errors)
- src/types/index.ts (2 errors)

### Unused Variable Elimination Module

**Purpose**: Remove or use all declared but unused variables

**Pattern for Fixes**:

**Option 1: Use the variable**:
```typescript
// Before
const _employeeUserId = user.id  // unused

// After
const employeeUserId = user.id
console.log('User ID:', employeeUserId)
```

**Option 2: Remove the variable**:
```typescript
// Before
const { data, error } = await query()  // error unused

// After
const { data } = await query()
```

**Option 3: Prefix with underscore (intentionally unused)**:
```typescript
// Before
catch (error) {  // error unused but needed for syntax

// After
catch (_error) {  // explicitly marked as intentionally unused
```

**Affected Files** (6 errors):
- src/hooks/useAuth.ts (1 error: '_employeeUserId')
- src/test/integration/errorHandling.integration.test.tsx (3 errors: 'vi', 'waitFor', 'initializeErrorHandler')
- src/utils/dateHelpers.ts (3 errors: 'error' in catch blocks)

### React Hooks Dependency Module

**Purpose**: Ensure all React hooks have complete dependency arrays

**Pattern for Fixes**:

**Option 1: Add missing dependencies**:
```typescript
// Before
useEffect(() => {
  fetchData(userId)
}, [])  // Missing userId

// After
useEffect(() => {
  fetchData(userId)
}, [userId])
```

**Option 2: Wrap functions in useCallback**:
```typescript
// Before
const fetchData = () => { /* ... */ }
useEffect(() => {
  fetchData()
}, [])  // Missing fetchData

// After
const fetchData = useCallback(() => { /* ... */ }, [])
useEffect(() => {
  fetchData()
}, [fetchData])
```

**Option 3: Use functional updates for state**:
```typescript
// Before
useEffect(() => {
  setCount(count + 1)
}, [])  // Missing count

// After
useEffect(() => {
  setCount(prev => prev + 1)
}, [])  // No dependency needed
```

**Affected Files** (16 warnings across 13 files):
- src/lib/AuthContext.tsx (1 warning)
- src/lib/ToastContext.tsx (1 warning)
- src/pages/Dashboard.tsx (1 warning)
- src/pages/Headcount/EmployeeDetail.tsx (1 warning)
- src/pages/Headcount/EmployeeDirectory.tsx (3 warnings)
- src/pages/Headcount/HeadcountDashboard.tsx (1 warning)
- src/pages/LeaveRequests/LeaveBalances.tsx (1 warning)
- src/pages/LeaveRequests/LeaveRequestDetail.tsx (1 warning)
- src/pages/Reports.tsx (1 warning)
- src/pages/Schedule/Schedule.tsx (1 warning)
- src/pages/Settings.tsx (1 warning)
- src/pages/SwapRequests/CreateSwapRequest.tsx (2 warnings)
- src/pages/SwapRequests/SwapRequestDetail.tsx (1 warning)

### Documentation Consolidation Module

**Purpose**: Ensure README.md has no duplicate sections

**Strategy**:
1. Search for "Getting Started" sections in README.md
2. If duplicates found, merge into single comprehensive section
3. Ensure logical flow and completeness

### PWA Icon Configuration Module

**Purpose**: Add proper PWA icons for installable web app

**Current State**: Only favicon sizes (16x16, 32x32, 180x180)

**Target State**: Add PWA-required sizes (192x192, 512x512)

**Icon Specifications**:
```typescript
interface PWAIconRequirements {
  sizes: ['192x192', '512x512']
  location: 'public/icons/'
  format: 'PNG'
  purpose: 'any maskable'  // Support both regular and maskable
}
```

**Manifest Update**:
```json
{
  "icons": [
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Implementation Options**:
1. Create new icons from existing logo/branding
2. Use icon generation tool (e.g., PWA Asset Generator)
3. Resize existing apple-touch-icon.png (180x180) to required sizes

## Data Models

### ESLint Error Tracking Model

```typescript
interface ESLintError {
  file: string
  line: number
  column: number
  rule: string
  message: string
  severity: 'error' | 'warning'
}

interface ErrorSummary {
  totalErrors: number
  totalWarnings: number
  errorsByRule: Record<string, number>
  errorsByFile: Record<string, number>
}
```

### Migration File Model

```typescript
interface MigrationFile {
  number: string  // e.g., "007"
  name: string    // e.g., "add_denied_status_to_leave_requests"
  fullName: string  // e.g., "007_add_denied_status_to_leave_requests.sql"
  path: string
  createdAt: Date
}
```

### Type Definition Location Model

```typescript
interface TypeDefinition {
  typeName: string
  file: string
  lineNumber: number
  definition: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Environment File Safety

*For any* environment variable entry in .env.example, the value should be either a generic placeholder (matching patterns like "your-*"), an empty string, or a generic URL template, ensuring no real credentials or project-specific identifiers are exposed.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Vite Environment API Usage

*For all* source files in the codebase, environment variable access should use Vite's import.meta.env API (MODE, DEV, PROD) and should not use Node.js process.env API.

**Validates: Requirements 2.1, 2.2**

### Property 3: Type Definition Uniqueness

*For any* TypeScript type or interface name, there should be exactly one definition in the codebase, and all references should import from that canonical location.

**Validates: Requirements 3.1, 3.2**

### Property 4: Migration File Sequential Integrity

*For all* migration files in supabase/migrations, the numeric prefixes should be unique and should increase monotonically with file creation timestamps, ensuring proper execution order.

**Validates: Requirements 4.1, 4.3**

### Property 5: TypeScript Explicit Typing

*For all* TypeScript source files, no variables, parameters, or return types should use the 'any' type, ensuring full type safety and compile-time error detection.

**Validates: Requirements 5.1**

### Property 6: No Unused Variables

*For all* TypeScript source files, no variables should be declared but never used, ensuring clean and maintainable code.

**Validates: Requirements 6.1**

### Property 7: React Hooks Dependency Completeness

*For all* useEffect and useCallback hooks, the dependency array should include all external variables and functions referenced in the hook body, ensuring effects run when dependencies change.

**Validates: Requirements 7.1**

### Property 8: Documentation Section Uniqueness

*For any* section heading in README.md, there should be exactly one occurrence, ensuring clear and non-repetitive documentation.

**Validates: Requirements 8.1**

### Property 9: PWA Icon Configuration Completeness

*For all* required PWA icon sizes (192x192, 512x512), icon files should exist in public/icons/ with correct dimensions, and site.webmanifest should correctly reference these icons with matching paths and sizes.

**Validates: Requirements 9.1, 9.2, 9.3**

## Error Handling

### ESLint Error Handling

**Strategy**: Fix errors incrementally by category to avoid introducing new issues

**Error Categories**:
1. **no-explicit-any**: Replace with specific types
2. **no-unused-vars**: Remove or use variables
3. **exhaustive-deps**: Add dependencies or use useCallback

**Verification**: Run `npm run lint` after each category of fixes

### TypeScript Compilation Error Handling

**Strategy**: Fix type errors revealed after removing 'any' types

**Common Scenarios**:
- Missing type definitions → Create interfaces
- Incompatible types → Add type guards or assertions
- Implicit any → Add explicit types

**Verification**: Run `npm run build` after type fixes

### Test Failure Handling

**Strategy**: Ensure all tests pass after each change

**Risk Areas**:
- Changing hook dependencies may affect test behavior
- Removing unused variables may affect test setup
- Type changes may require test updates

**Verification**: Run `npm run test:run` after each significant change

### Migration Renumbering Error Handling

**Strategy**: Verify migration hasn't been applied before renumbering

**Steps**:
1. Check if migration 007 has been applied to any database
2. If applied, document which version was applied
3. Rename file and update any references
4. Test migration sequence on clean database

## Testing Strategy

### Dual Testing Approach

This feature requires both **unit tests** and **property-based tests** for comprehensive coverage:

- **Unit tests**: Verify specific examples (e.g., build succeeds, lint passes, specific files fixed)
- **Property tests**: Verify universal properties (e.g., no 'any' types exist across all files, all migration numbers unique)

### Property-Based Testing

**Library**: Use `fast-check` for JavaScript/TypeScript property-based testing

**Configuration**: Each property test should run minimum 100 iterations

**Test Tagging**: Each test must reference its design document property:
```typescript
// Feature: code-cleanup-and-fixes, Property 1: Environment File Safety
```

### Unit Testing Focus

Unit tests should focus on:
- **Specific command executions**: Build, lint, test commands succeed
- **Specific file fixes**: errorHandler.test.ts uses import.meta.env
- **Edge cases**: Empty .env values, catch blocks with unused errors
- **Integration points**: Type imports work correctly after deduplication

### Property Testing Focus

Property tests should focus on:
- **Universal code patterns**: No 'any' types across all files
- **Collection properties**: All migration numbers unique
- **Configuration consistency**: All PWA icons properly configured
- **Dependency completeness**: All hooks have correct dependencies

### Test Implementation Requirements

1. **Minimum 100 iterations** per property test (due to randomization)
2. **Tag format**: `Feature: code-cleanup-and-fixes, Property {number}: {property_text}`
3. **One test per property**: Each correctness property implemented by a single property-based test
4. **Early validation**: Place property tests close to implementation to catch errors early

### Verification Tests

**Build Verification Test**:
```typescript
test('Build completes without errors', () => {
  const result = execSync('npm run build', { encoding: 'utf-8' })
  expect(result).not.toContain('error')
  expect(result).not.toContain('warning')
})
```

**Lint Verification Test**:
```typescript
test('Lint passes with zero errors and warnings', () => {
  const result = execSync('npm run lint', { encoding: 'utf-8' })
  expect(result).toContain('0 errors')
  expect(result).toContain('0 warnings')
})
```

**Test Suite Verification Test**:
```typescript
test('All 139 tests pass', () => {
  const result = execSync('npm run test:run', { encoding: 'utf-8' })
  expect(result).toContain('139 passed')
})
```

### Testing Priorities

1. **Critical**: Verify build, lint, and test commands succeed
2. **High**: Verify no 'any' types, no unused variables, correct hook dependencies
3. **Medium**: Verify type uniqueness, migration numbering
4. **Low**: Verify documentation, PWA icons

### Test Maintenance

- Run full test suite after each category of fixes
- Update tests if requirements change
- Document any intentional ESLint suppressions
- Keep test execution time reasonable (< 5 minutes for full suite)
