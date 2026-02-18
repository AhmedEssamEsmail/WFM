# Design Document: Role-Based Visibility Controls

## Overview

This feature implements fine-grained role-based visibility controls for the workforce management system. The system currently has basic role-based route protection through the `ProtectedRoute` component, but lacks granular control over individual UI components and specific page access patterns. This design extends the existing authorization infrastructure to support:

1. Role-specific page access (beyond the current all-or-nothing approach)
2. Conditional rendering of dashboard components based on user roles
3. Navigation menu filtering to hide inaccessible routes
4. Comprehensive security logging for unauthorized access attempts

The implementation will leverage the existing authentication context, route protection mechanisms, and security logging infrastructure while adding new capabilities for component-level visibility control.

## Architecture

### High-Level Design

The role-based visibility system follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Dashboard   │  │  Navigation  │  │    Routes    │  │
│  │  Components  │  │     Menu     │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Authorization Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ useRoleCheck │  │ ProtectedRte │  │ useNavigation│  │
│  │     Hook     │  │  Component   │  │     Hook     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Authentication Layer                   │
│              ┌──────────────────────┐                    │
│              │   AuthContext        │                    │
│              │   (User, Role)       │                    │
│              └──────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     Security Layer                       │
│              ┌──────────────────────┐                    │
│              │  Security Logger     │                    │
│              └──────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns**: Authorization logic is separated from presentation logic
2. **Reusability**: Common role-checking logic is encapsulated in reusable hooks
3. **Security by Default**: All access attempts are logged; unauthorized access is denied by default
4. **Backward Compatibility**: Existing route protection and authentication mechanisms remain unchanged
5. **Performance**: Role checks are memoized to avoid unnecessary re-renders

## Components and Interfaces

### 1. useRoleCheck Hook

A custom React hook that provides role-checking utilities for component-level visibility control.

```typescript
interface UseRoleCheckReturn {
  hasRole: (roles: UserRole | UserRole[]) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  hasAllRoles: (roles: UserRole[]) => boolean
  isManager: boolean
  isAgent: boolean
  isWFM: boolean
  isTL: boolean
}

function useRoleCheck(): UseRoleCheckReturn
```

**Purpose**: Provides a declarative API for checking user roles in components.

**Usage Example**:
```typescript
const { hasRole, isManager } = useRoleCheck()

if (isManager) {
  return <CoverageOverview />
}
```

### 2. Enhanced ProtectedRoute Component

The existing `ProtectedRoute` component will be updated to support more granular role configurations.

**Current Interface**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
}
```

**No changes needed** - the current interface already supports the required functionality. We will update the route definitions in `App.tsx` to specify the correct role requirements.

### 3. Enhanced useNavigation Hook

The existing `useNavigation` hook already filters navigation items based on user roles. We will update the `NAV_ITEMS` configuration to reflect the new access requirements.

**Current Interface**:
```typescript
interface NavItem {
  name: string
  href: string
  roles: UserRole[]
  icon: React.ElementType
}
```

**Updates Required**:
- Modify the `roles` array for "Requests" to `['wfm']`
- Modify the `roles` array for "Swap Requests" to `['agent', 'tl']`

### 4. Dashboard Component Updates

The Dashboard component will be refactored to conditionally render statistics cards and the coverage overview based on user roles.

**Conditional Rendering Pattern**:
```typescript
const { isManager } = useRoleCheck()

// Statistics cards - only show to managers
{isManager && (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatCard title="Total Staff" ... />
    <StatCard title="Active Shifts" ... />
    <StatCard title="Pending Requests" ... />
    <StatCard title="Open Swaps" ... />
  </div>
)}

// Coverage overview - only show to managers
{isManager && coverageData && (
  <CoverageChart data={coverageData} />
)}
```

### 5. Security Logging Integration

The existing `securityLogger` module will be used to log unauthorized access attempts. No new interfaces are required.

**Existing Interface**:
```typescript
function logUnauthorizedAccess(
  userId: string,
  userRole: UserRole,
  requestedPath: string,
  reason: string,
  violationType: 'role_violation' | 'domain_violation'
): void
```

## Data Models

No new data models are required. The feature uses existing types:

```typescript
type UserRole = 'agent' | 'tl' | 'wfm'

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
  department?: string
}
```

The role-based visibility logic operates entirely on the client side using the authenticated user's role from the `AuthContext`.


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Unauthorized Route Access Redirects to Dashboard

*For any* user with a role that is not in the required roles list for a protected route, attempting to access that route should result in a redirect to the dashboard.

**Validates: Requirements 1.2, 1.3, 2.3**

### Property 2: Unauthorized Access Attempts Are Logged

*For any* unauthorized access attempt to a protected route, the system should log the event with user ID, user role, requested path, and violation type.

**Validates: Requirements 1.4, 2.4, 6.1, 6.2**

### Property 3: Manager-Visible Dashboard Cards Are Hidden from Agents

*For any* dashboard statistics card designated as manager-only (Total Staff, Active Shifts, Pending Requests, Open Swaps), when an agent views the dashboard, the card should not be rendered in the DOM.

**Validates: Requirements 3.3, 3.6, 3.9, 3.12**

### Property 4: Manager-Visible Dashboard Cards Are Shown to Managers

*For any* dashboard statistics card designated as manager-only (Total Staff, Active Shifts, Pending Requests, Open Swaps), when a user with tl or wfm role views the dashboard, the card should be rendered in the DOM.

**Validates: Requirements 3.1, 3.2, 3.4, 3.5, 3.7, 3.8, 3.10, 3.11**

### Property 5: Navigation Items Match User Role Permissions

*For any* navigation item with role restrictions, the item should appear in the navigation menu if and only if the current user's role is included in the item's allowed roles list.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 6: Log Entries Do Not Expose Sensitive Information to Client

*For any* security log entry created by an unauthorized access attempt, the log entry should not be included in any client-side state, API response, or browser console output visible to the user.

**Validates: Requirements 6.4**

### Property 7: Authentication Check Precedes Role Check

*For any* protected route access attempt, if the user is not authenticated, the system should redirect to login without executing role-based authorization logic.

**Validates: Requirements 7.4**

### Property 8: Existing Authentication Mechanisms Are Preserved

*For any* unauthenticated user attempting to access a protected route, the system should redirect to the login page with the requested URL preserved for post-login redirect, regardless of role-based visibility changes.

**Validates: Requirements 7.1, 7.3**

### Property 9: Domain-Based Access Control Is Preserved

*For any* authenticated user whose email domain does not match the allowed domain, the system should sign them out and redirect to the unauthorized page, regardless of their role or the route they're accessing.

**Validates: Requirements 7.2**

## Error Handling

### Route Access Errors

**Scenario**: User attempts to access a route they don't have permission for

**Handling**:
1. Log the unauthorized access attempt using `logUnauthorizedAccess()`
2. Redirect to dashboard (not an error page, to avoid exposing route structure)
3. Do not display error messages to the user (security by obscurity)

**Implementation**:
```typescript
if (requiredRoles && !requiredRoles.includes(user.role)) {
  logUnauthorizedAccess(
    user.id,
    user.role,
    location.pathname,
    `Insufficient role permissions. Required: ${requiredRoles.join(', ')}, Has: ${user.role}`,
    'role_violation'
  )
  return <Navigate to="/dashboard" replace />
}
```

### Component Visibility Errors

**Scenario**: Role-checking hook is used in a component outside the AuthContext

**Handling**:
1. Throw a descriptive error during development
2. Return safe defaults (no permissions) in production
3. Log the error for monitoring

**Implementation**:
```typescript
export function useRoleCheck(): UseRoleCheckReturn {
  const { user } = useAuth()
  
  if (!user) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error('useRoleCheck must be used within AuthContext')
    }
    // Safe defaults in production
    return {
      hasRole: () => false,
      hasAnyRole: () => false,
      hasAllRoles: () => false,
      isManager: false,
      isAgent: false,
      isWFM: false,
      isTL: false,
    }
  }
  
  // Normal implementation...
}
```

### Navigation Filtering Errors

**Scenario**: Navigation hook is called before user is loaded

**Handling**:
1. Return empty navigation array during loading
2. Navigation will populate once user is authenticated
3. No error is thrown (this is expected behavior)

**Implementation**:
```typescript
const filteredNavItems = useMemo(() => {
  if (!user) return []
  return NAV_ITEMS.filter(item => item.roles.includes(user.role))
}, [user])
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property tests**: Verify universal properties across all role combinations and routes

### Unit Testing Focus

Unit tests should cover:

1. **Specific role-route combinations**: Test that wfm can access /requests, agent cannot access /requests, etc.
2. **Component rendering**: Test that specific dashboard cards render or don't render for specific roles
3. **Navigation filtering**: Test that specific navigation items appear or don't appear for specific roles
4. **Security logging integration**: Test that the security logger is called with correct parameters
5. **Error boundaries**: Test that errors in role-checking logic don't crash the application

### Property-Based Testing Configuration

Property tests will use **fast-check** (TypeScript/JavaScript property-based testing library) with the following configuration:

- **Minimum 100 iterations per test** (to ensure comprehensive coverage through randomization)
- **Custom generators** for User objects with different roles
- **Tag format**: `Feature: role-based-visibility, Property {number}: {property_text}`

### Property Test Implementation

Each correctness property will be implemented as a property-based test:

**Property 1 Example**:
```typescript
// Feature: role-based-visibility, Property 1: Unauthorized Route Access Redirects to Dashboard
test('unauthorized users are redirected to dashboard', () => {
  fc.assert(
    fc.property(
      fc.record({
        route: fc.constantFrom('/requests', '/swap-requests'),
        userRole: fc.constantFrom('agent', 'tl', 'wfm'),
        requiredRoles: fc.constantFrom(['wfm'], ['agent', 'tl'])
      }),
      ({ route, userRole, requiredRoles }) => {
        // Test that if userRole is not in requiredRoles, redirect occurs
        if (!requiredRoles.includes(userRole)) {
          const result = checkRouteAccess(userRole, requiredRoles)
          expect(result.shouldRedirect).toBe(true)
          expect(result.redirectTo).toBe('/dashboard')
        }
      }
    ),
    { numRuns: 100 }
  )
})
```

**Property 2 Example**:
```typescript
// Feature: role-based-visibility, Property 2: Unauthorized Access Attempts Are Logged
test('all unauthorized access attempts are logged', () => {
  fc.assert(
    fc.property(
      fc.record({
        userId: fc.uuid(),
        userRole: fc.constantFrom('agent', 'tl', 'wfm'),
        requestedPath: fc.constantFrom('/requests', '/swap-requests', '/settings'),
        requiredRoles: fc.array(fc.constantFrom('agent', 'tl', 'wfm'), { minLength: 1 })
      }),
      ({ userId, userRole, requestedPath, requiredRoles }) => {
        const mockLogger = jest.fn()
        
        // Attempt access
        attemptRouteAccess(userId, userRole, requestedPath, requiredRoles, mockLogger)
        
        // If unauthorized, verify logging occurred
        if (!requiredRoles.includes(userRole)) {
          expect(mockLogger).toHaveBeenCalledWith(
            userId,
            userRole,
            requestedPath,
            expect.stringContaining('Insufficient role permissions'),
            'role_violation'
          )
        }
      }
    ),
    { numRuns: 100 }
  )
})
```

### Test Coverage Goals

- **Route protection**: 100% coverage of all protected routes with role requirements
- **Component visibility**: 100% coverage of all conditionally rendered components
- **Navigation filtering**: 100% coverage of all role-restricted navigation items
- **Security logging**: 100% coverage of all unauthorized access scenarios
- **Error handling**: 100% coverage of all error scenarios

### Integration Testing

Integration tests should verify:

1. **End-to-end route access**: Navigate to protected routes and verify correct behavior
2. **Dashboard rendering**: Render dashboard with different user roles and verify correct components appear
3. **Navigation menu**: Render navigation with different user roles and verify correct items appear
4. **Security logging**: Verify that unauthorized access attempts result in log entries in the security log

### Manual Testing Checklist

Before deployment, manually verify:

- [ ] Login as agent, verify /requests is not accessible
- [ ] Login as agent, verify /swap-requests is accessible
- [ ] Login as wfm, verify /requests is accessible
- [ ] Login as wfm, verify /swap-requests is not accessible
- [ ] Login as agent, verify dashboard shows only action cards (no stats)
- [ ] Login as tl, verify dashboard shows all stats cards
- [ ] Login as wfm, verify dashboard shows all stats cards
- [ ] Login as agent, verify navigation menu does not show "Requests"
- [ ] Login as agent, verify navigation menu shows "Swap Requests"
- [ ] Login as wfm, verify navigation menu shows "Requests"
- [ ] Login as wfm, verify navigation menu does not show "Swap Requests"
- [ ] Verify unauthorized access attempts appear in security logs
