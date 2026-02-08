# Design Document: Security & Access Control

## Overview

This design addresses critical security vulnerabilities in the WFM system related to authentication and authorization. Currently, the application has three major security issues:

1. **Missing Route Guards**: Routes are not protected at the routing level. Users can navigate directly to any URL, with role checks only happening in UI components after rendering.

2. **System Comment Protection**: System-generated comments (audit trail entries) can be modified or deleted via API calls, compromising data integrity and audit trails.

3. **Inconsistent Authorization**: Authorization checks are scattered across UI components rather than enforced consistently at the route and service layers.

This design implements a comprehensive security layer with:
- Route-level authentication and authorization using a ProtectedRoute component
- Role-based access control (RBAC) enforced at the routing layer
- RLS policies to protect system comments from modification
- Service-layer authorization checks for comment operations
- Proper error handling and user feedback for unauthorized access

The implementation will use React Router v6 with TypeScript, Supabase RLS policies, and maintain backward compatibility with existing functionality.

## Architecture

### Current Architecture Issues

**Route Protection Problem:**
```
Current Flow:
User enters URL → React Router renders component → Component checks auth → Redirects if unauthorized

Issues:
- Component briefly renders before auth check
- Inconsistent auth checks across components
- Direct URL navigation bypasses some checks
- Role checks happen in UI, not at route level
```

**System Comment Problem:**
```
Current Flow:
User calls commentsService.updateComment(systemCommentId) → Supabase updates comment → Success

Issues:
- No check for is_system flag before update
- No RLS policy preventing system comment modification
- Audit trail can be tampered with
- System-generated notifications can be altered
```

**Authorization Problem:**
```
Current Flow:
User navigates to /settings → Settings component renders → useAuth checks role → Shows error if not WFM

Issues:
- Component renders before authorization check
- Inconsistent patterns across different routes
- Authorization logic duplicated in components
- No centralized authorization enforcement
```

### Proposed Architecture

**1. Route-Level Protection with ProtectedRoute Component:**

```
New Flow:
User enters URL → React Router invokes ProtectedRoute → Check auth → Check role → Render component or redirect

┌─────────────────────────────────────────────────────────────┐
│  React Router                                               │
│  <Route path="/settings" element={                          │
│    <ProtectedRoute requiredRoles={['wfm']}>                 │
│      <Settings />                                           │
│    </ProtectedRoute>                                        │
│  } />                                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  ProtectedRoute Component                                   │
│  1. Check if user is authenticated (session exists)         │
│  2. If not authenticated → redirect to /login               │
│  3. Check if user email domain is authorized                │
│  4. If not authorized → redirect to /unauthorized           │
│  5. Check if user role matches requiredRoles (if provided)  │
│  6. If role mismatch → redirect to /dashboard               │
│  7. If all checks pass → render children                    │
└─────────────────────────────────────────────────────────────┘
```

**2. System Comment Protection via RLS Policies:**

```
New Flow:
User calls commentsService.updateComment(systemCommentId) → Service checks is_system → RLS policy blocks → Error returned

┌─────────────────────────────────────────────────────────────┐
│  UI Layer (Comment Component)                               │
│  - User clicks edit on comment                              │
│  - Calls commentsService.updateComment()                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Service Layer (commentsService.ts)                         │
│  - updateComment() checks if comment.is_system === true     │
│  - If system comment, throw SystemCommentProtectedError     │
│  - If not system comment, proceed to database update        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Database Layer (Supabase RLS)                              │
│  - RLS policy: USING (is_system = false OR user is admin)   │
│  - Blocks UPDATE/DELETE on rows where is_system = true      │
│  - Returns error if policy check fails                      │
└─────────────────────────────────────────────────────────────┘
```

**3. Centralized Authorization Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│  Route Configuration (App.tsx)                              │
│  - Define routes with required roles                        │
│  - Wrap routes with ProtectedRoute component                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  ProtectedRoute Component                                   │
│  - Single source of truth for route authorization           │
│  - Consistent auth/authz checks across all routes           │
│  - Handles loading states and redirects                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  AuthContext (useAuth hook)                                 │
│  - Provides user, session, loading state                    │
│  - Provides role checking helpers                           │
│  - Single source of truth for authentication state          │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. ProtectedRoute Component

**Location:** `src/components/ProtectedRoute.tsx`

**Purpose:** Centralized route protection with authentication and authorization checks

**Component Interface:**

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]  // Optional: if provided, checks user has one of these roles
  requireAuth?: boolean        // Default: true
}

function ProtectedRoute({ 
  children, 
  requiredRoles, 
  requireAuth = true 
}: ProtectedRouteProps): JSX.Element
```

**Logic Flow:**

1. Get auth state from useAuth hook (user, loading, session, signOut)
2. If loading, render loading spinner
3. If requireAuth && !user, redirect to /login with return URL
4. If user exists, check email domain (@dabdoob.com)
5. If domain invalid, call signOut() and redirect to /unauthorized
6. If requiredRoles provided, check if user.role is in requiredRoles
7. If role check fails, redirect to /dashboard
8. If all checks pass, render children wrapped in Layout

**Loading State:**
```typescript
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
}
```

**Redirect Logic:**
```typescript
// Not authenticated
if (requireAuth && !user) {
  return <Navigate to="/login" state={{ from: location.pathname }} replace />
}

// Invalid domain
if (user && !user.email.endsWith('@dabdoob.com')) {
  signOut()
  return <Navigate to="/unauthorized" replace />
}

// Role check failed
if (requiredRoles && user && !requiredRoles.includes(user.role)) {
  return <Navigate to="/dashboard" replace />
}

// All checks passed
return <Layout>{children}</Layout>
```

### 2. Enhanced Comments Service

**Location:** `src/services/commentsService.ts`

**Purpose:** Add authorization checks for system comment protection

**Enhanced Functions:**

```typescript
// Enhanced: Check if comment is system-generated before updating
async function updateComment(commentId: string, content: string): Promise<Comment>
  - Validate commentId is valid UUID
  - Fetch comment from database to check is_system flag
  - If comment.is_system === true, throw SystemCommentProtectedError
  - If not system comment, proceed with update
  - Return updated comment

// Enhanced: Check if comment is system-generated before deleting
async function deleteComment(commentId: string): Promise<void>
  - Validate commentId is valid UUID
  - Fetch comment from database to check is_system flag
  - If comment.is_system === true, throw SystemCommentProtectedError
  - If not system comment, proceed with delete
  - Return void on success

// Unchanged: System comment creation (already restricted)
async function createSystemComment(
  requestId: string, 
  requestType: RequestType, 
  content: string, 
  userId: string
): Promise<Comment>
  - Insert comment with is_system: true
  - Only callable by service layer, not exposed to UI
  - Return created comment
```

**Error Handling:**
```typescript
class SystemCommentProtectedError extends Error {
  constructor(commentId: string) {
    super(
      `Cannot modify system-generated comment ${commentId}. ` +
      `System comments are protected to maintain audit trail integrity.`
    )
    this.name = 'SystemCommentProtectedError'
    this.code = 'SYSTEM_COMMENT_PROTECTED'
  }
}
```

### 3. RLS Policy for System Comments

**Location:** `supabase/migrations/009_system_comment_protection.sql`

**Purpose:** Database-level protection for system comments

**Policy Definitions:**

```sql
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- New policy: Users can only update their own non-system comments
CREATE POLICY "Users can update own non-system comments"
    ON comments FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id 
        AND is_system = false
    );

-- New policy: Users can only delete their own non-system comments
CREATE POLICY "Users can delete own non-system comments"
    ON comments FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id 
        AND is_system = false
    );

-- New policy: WFM can view all comments including system comments
CREATE POLICY "WFM can view all comments"
    ON comments FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'wfm'::user_role
        OR auth.uid() = user_id
    );
```

**Policy Explanation:**
- UPDATE policy: Only allows updates if user owns comment AND is_system = false
- DELETE policy: Only allows deletes if user owns comment AND is_system = false
- SELECT policy: Allows viewing system comments but not modifying them
- WFM role can view all comments for audit purposes but still cannot modify system comments

### 4. Route Configuration Updates

**Location:** `src/App.tsx`

**Purpose:** Apply ProtectedRoute to all routes with appropriate role requirements

**Route Patterns:**

```typescript
// Public routes (no protection)
<Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
<Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
<Route path="/unauthorized" element={<Unauthorized />} />

// Protected routes (authentication only)
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
<Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
<Route path="/swap-requests" element={<ProtectedRoute><SwapRequests /></ProtectedRoute>} />
<Route path="/leave-requests" element={<ProtectedRoute><LeaveRequests /></ProtectedRoute>} />
// ... other employee-accessible routes

// Manager routes (TL and WFM only)
<Route path="/reports" element={
  <ProtectedRoute requiredRoles={['tl', 'wfm']}>
    <Reports />
  </ProtectedRoute>
} />
<Route path="/headcount/employees" element={
  <ProtectedRoute requiredRoles={['tl', 'wfm']}>
    <EmployeeDirectory />
  </ProtectedRoute>
} />
<Route path="/headcount/employees/:id" element={
  <ProtectedRoute requiredRoles={['tl', 'wfm']}>
    <EmployeeDetail />
  </ProtectedRoute>
} />

// Admin routes (WFM only)
<Route path="/settings" element={
  <ProtectedRoute requiredRoles={['wfm']}>
    <Settings />
  </ProtectedRoute>
} />
<Route path="/schedule/upload" element={
  <ProtectedRoute requiredRoles={['wfm']}>
    <ScheduleUpload />
  </ProtectedRoute>
} />
```

**Removed Components:**
- Remove `WFMOnlyRoute` component (replaced by ProtectedRoute with requiredRoles)
- Remove `HeadcountRoute` component (replaced by ProtectedRoute with requiredRoles)
- Keep `PublicRoute` component for login/signup redirects

### 5. PublicRoute Component (Enhanced)

**Location:** `src/components/PublicRoute.tsx` (extracted from App.tsx)

**Purpose:** Redirect authenticated users away from login/signup pages

**Component Interface:**

```typescript
interface PublicRouteProps {
  children: React.ReactNode
}

function PublicRoute({ children }: PublicRouteProps): JSX.Element
```

**Logic:**
```typescript
function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  
  if (loading) {
    return <PageLoader />
  }
  
  if (user) {
    // If user came from a protected route, redirect there
    const from = location.state?.from || '/dashboard'
    return <Navigate to={from} replace />
  }
  
  return <>{children}</>
}
```

## Data Models

### Existing Models (No Changes)

The existing data models remain unchanged:
- `User` (from `src/types/index.ts`)
- `Comment` (from `src/types/index.ts`)
- `UserRole` type: 'agent' | 'tl' | 'wfm'

### New Error Types

**Location:** `src/types/errors.ts`

```typescript
// Error for system comment protection
export class SystemCommentProtectedError extends Error {
  public readonly code = 'SYSTEM_COMMENT_PROTECTED'
  
  constructor(
    public commentId: string,
    message?: string
  ) {
    super(
      message || 
      `Cannot modify system-generated comment ${commentId}. ` +
      `System comments are protected to maintain audit trail integrity.`
    )
    this.name = 'SystemCommentProtectedError'
  }
}

// Error for unauthorized route access (for logging)
export class UnauthorizedAccessError extends Error {
  public readonly code = 'UNAUTHORIZED_ACCESS'
  
  constructor(
    public userId: string,
    public requestedRoute: string,
    public userRole: string,
    public requiredRoles: string[]
  ) {
    super(
      `User ${userId} with role '${userRole}' attempted to access ` +
      `route '${requestedRoute}' which requires roles: ${requiredRoles.join(', ')}`
    )
    this.name = 'UnauthorizedAccessError'
  }
}
```

### Enhanced Comment Type

**Location:** `src/types/index.ts`

The Comment type already includes `is_system` field (added in Phase 1):

```typescript
export interface Comment {
  id: string
  request_id: string
  request_type: RequestType
  user_id: string
  content: string
  created_at: string
  is_system: boolean  // Already exists
  users?: {
    id: string
    name: string
    email: string
    role: UserRole
  }
}
```

### Route Configuration Types

**Location:** `src/types/routes.ts` (new file)

```typescript
import { UserRole } from './index'

// Route protection configuration
export interface RouteConfig {
  path: string
  requireAuth: boolean
  requiredRoles?: UserRole[]
  component: React.ComponentType
}

// Location state for redirects
export interface LocationState {
  from?: string  // Original URL before redirect
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all 50 acceptance criteria, I identified significant redundancy:

**Redundant Requirements:**
- Requirements 3.1-3.6 are specific examples of the general role-based access control properties in 2.1-2.5
- Requirements 4.1-4.4 duplicate the manager route access already covered by 2.2, 2.4, and 2.5
- Requirements 6.2-6.4 describe implementation details (checking before rendering) whose outcomes are already tested by 1.1 and 2.1-2.5
- Requirements 7.1, 7.3, 7.4 test error messages or duplicate redirect behavior already covered by other properties
- Requirements 8.4-8.5 duplicate the domain authorization check in 8.1
- Requirements 9.1-9.3 describe implementation details whose outcomes are tested by 5.1-5.2
- Requirements 10.3-10.5 describe UI consistency or meta-testing concerns that aren't programmatically testable

**Combined Properties:**
- Requirements 5.1 and 5.2 (API-level protection) can be combined with 5.3 and 5.4 (database-level protection) into comprehensive system comment immutability properties
- Requirements 1.1 and 1.4 both test unauthenticated access redirect behavior
- Requirements 2.1 and 2.3 both test non-admin access to admin routes

The following properties provide unique validation value without redundancy:

### Property 1: Unauthenticated Access Redirect

*For any* protected route, when an unauthenticated user (no valid session) attempts to access it, the system should redirect them to the login page.

**Validates: Requirements 1.1, 1.4**

### Property 2: Post-Authentication Redirect

*For any* protected route that was originally requested before authentication, after successful authentication, the system should redirect the user to that originally requested route (or dashboard if no original route was stored).

**Validates: Requirements 1.2**

### Property 3: Authenticated User Public Route Redirect

*For any* public route (login, signup), when an authenticated user attempts to access it, the system should redirect them to the dashboard or their originally requested protected route.

**Validates: Requirements 1.5**

### Property 4: Agent Role Admin Route Denial

*For any* admin-only route (Settings, Schedule Upload), when a user with role 'agent' attempts to access it, the system should redirect them to the dashboard.

**Validates: Requirements 2.1, 3.1, 3.3**

### Property 5: Agent Role Manager Route Denial

*For any* manager route (Reports, Employee Directory, Employee Detail), when a user with role 'agent' attempts to access it, the system should redirect them to the dashboard.

**Validates: Requirements 2.2, 3.2, 3.4, 3.5, 4.4**

### Property 6: TL Role Admin Route Denial

*For any* admin-only route (Settings, Schedule Upload), when a user with role 'tl' attempts to access it, the system should redirect them to the dashboard.

**Validates: Requirements 2.3, 3.1, 3.3**

### Property 7: TL Role Manager Route Access

*For any* manager route (Reports, Employee Directory, Employee Detail), when a user with role 'tl' attempts to access it, the system should allow access and render the route content.

**Validates: Requirements 2.4, 4.1, 4.2, 4.3**

### Property 8: WFM Role Universal Access

*For any* protected route (including admin routes and manager routes), when a user with role 'wfm' attempts to access it, the system should allow access and render the route content.

**Validates: Requirements 2.5, 3.6**

### Property 9: System Comment Update Protection

*For any* comment where `is_system = true`, attempting to update the comment content through either the service layer API or direct database access should be rejected with an error indicating system comments are protected.

**Validates: Requirements 5.1, 5.3, 9.1, 9.3**

### Property 10: System Comment Delete Protection

*For any* comment where `is_system = true`, attempting to delete the comment through either the service layer API or direct database access should be rejected with an error indicating system comments are protected.

**Validates: Requirements 5.2, 5.4, 9.2, 9.3**

### Property 11: System Comment Read Access

*For any* authenticated user with access to a request, querying comments for that request should return all comments including system-generated comments (is_system = true), allowing users to read but not modify system comments.

**Validates: Requirements 5.6**

### Property 12: Non-System Comment Ownership Enforcement

*For any* comment where `is_system = false`, attempting to update or delete the comment should only succeed if the requesting user is the comment owner (user_id matches authenticated user ID).

**Validates: Requirements 9.4**

### Property 13: Domain-Based Access Control

*For any* user authentication attempt, if the user's email address does not end with '@dabdoob.com', the system should sign them out and redirect them to the unauthorized page, preventing access to any protected routes.

**Validates: Requirements 8.1**

## Error Handling

### Error Types and Handling Strategy

**1. SystemCommentProtectedError**
- Thrown when attempting to modify or delete a system comment
- Contains: comment ID, descriptive message
- HTTP Status: 403 Forbidden
- User Action: Cannot modify system comments (read-only)

**2. UnauthorizedAccessError**
- Thrown when user attempts to access route without proper role
- Contains: user ID, requested route, user role, required roles
- HTTP Status: 403 Forbidden
- User Action: Redirect to dashboard (logged for security monitoring)

**3. UnauthenticatedAccessError**
- Thrown when unauthenticated user attempts to access protected route
- Contains: requested route, session status
- HTTP Status: 401 Unauthorized
- User Action: Redirect to login with return URL

**4. InvalidDomainError**
- Thrown when user email domain is not authorized
- Contains: email address, required domain
- HTTP Status: 403 Forbidden
- User Action: Sign out and redirect to unauthorized page

### Error Propagation

```
Route Layer (ProtectedRoute checks)
        ↓
Redirect (no error thrown to user)
        ↓
Security Logging (log unauthorized attempts)
```

```
Service Layer (commentsService checks)
        ↓
Throw SystemCommentProtectedError
        ↓
Error Handler Middleware
        ↓
HTTP Response (403 with error details)
        ↓
UI Layer (display error message)
```

### Security Logging

All authorization failures should be logged with:
- Timestamp
- User ID and role
- Requested resource (route or comment ID)
- Failure reason (no auth, wrong role, invalid domain, system comment)
- IP address (if available)
- User agent

### Graceful Degradation

- If auth check fails during loading, show loading spinner until resolved
- If session expires mid-navigation, preserve requested URL for post-login redirect
- If RLS policy blocks operation, service layer should catch and return user-friendly error
- If domain check fails, immediately sign out to prevent any data access

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Specific examples of route access with different roles
- Edge cases (expired sessions, invalid domains, missing auth tokens)
- Error message format verification
- Component rendering with different auth states
- RLS policy behavior with specific comment scenarios

**Property-Based Tests:**
- Universal properties across all routes and roles (see Correctness Properties section)
- Randomized route and role combinations
- Each property test runs minimum 100 iterations
- Tests validate behavior across wide range of scenarios

### Property-Based Testing Configuration

**Library:** fast-check (for TypeScript/JavaScript)

**Test Structure:**
```typescript
// Example property test structure
test('Property 1: Unauthenticated Access Redirect', async () => {
  // Feature: security-access-control, Property 1: Unauthenticated Access Redirect
  await fc.assert(
    fc.asyncProperty(
      // Generators for routes, auth states, etc.
      protectedRouteArbitrary(),
      async (route) => {
        // Test redirect behavior for unauthenticated access
        // ...
      }
    ),
    { numRuns: 100 }
  )
})
```

**Each property test must:**
1. Reference its design document property number in a comment
2. Use the tag format: `Feature: security-access-control, Property {number}: {property_text}`
3. Run minimum 100 iterations
4. Generate randomized inputs covering edge cases
5. Verify the universal property holds for all generated inputs

### Test Coverage Goals

- **Unit Test Coverage:** 90%+ of ProtectedRoute component and commentsService authorization code
- **Property Test Coverage:** All 13 correctness properties
- **Integration Test Coverage:** End-to-end route navigation flows with different roles
- **Edge Case Coverage:** Session expiration, invalid domains, concurrent comment modifications

### Testing Environments

**Local Development:**
- Use Supabase local development environment
- Mock authentication state for fast feedback
- Test RLS policies with test database

**CI/CD Pipeline:**
- Run all unit tests and property tests
- Use test database with known seed data
- Fail build on any test failure
- Run security audit checks

**Staging:**
- Run integration tests against staging database
- Test with production-like authentication flow
- Verify RLS policies with real Supabase instance

### Test Data Generation

**For Property Tests:**
- Use fast-check generators for routes, roles, auth states
- Create custom generators for User objects with different roles
- Create custom generators for Comment objects with is_system flag
- Ensure generators produce both valid and invalid scenarios

**For Unit Tests:**
- Use factory functions for User creation with specific roles
- Use factory functions for Comment creation (system and non-system)
- Maintain test fixtures for common route configurations
- Use realistic data that mirrors production

### Regression Testing

- Maintain existing test suite (all tests must pass)
- Add new tests for each security fix
- Run full test suite before each deployment
- Monitor test execution time and optimize slow tests
- Add security-specific test suite for authorization checks

### Security Testing

**Additional Security Tests:**
- Penetration testing: Attempt to bypass route guards with direct URL navigation
- Session hijacking: Test behavior with expired/invalid tokens
- Role escalation: Attempt to access admin routes with modified role claims
- RLS bypass: Attempt direct database access to system comments
- Domain spoofing: Test with various email formats and domains

**Security Audit Checklist:**
- [ ] All protected routes have ProtectedRoute wrapper
- [ ] All admin routes specify requiredRoles=['wfm']
- [ ] All manager routes specify requiredRoles=['tl', 'wfm']
- [ ] RLS policies prevent system comment modification
- [ ] Domain check happens on every protected route
- [ ] Authorization failures are logged
- [ ] No sensitive data in error messages
- [ ] Session expiration triggers proper cleanup
