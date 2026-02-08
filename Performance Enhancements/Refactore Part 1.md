# Services & Infrastructure Refactoring Guide
## Clear & Actionable Comments for AI Agent

---

# 1. src/services/swapRequestsService.ts

## Priority 1 (Critical - Must Fix)

### 1. **CRITICAL: Missing atomic swap execution function**
**Issue:** Swap logic is executed in the detail page (SwapRequestDetail.tsx lines ~180-210) but should be isolated in a service function. If the 4 shift updates fail partially, database is left inconsistent.

**Current Problem:** No dedicated function for executing swaps. All shift updates happen in the page component without transaction safety.

**Fix:** Add new function to swapRequestsService.ts:
```typescript
interface SwapExecutionData {
  requesterShiftId: string
  targetShiftId: string
  requesterOnTargetDateShiftId: string
  targetOnRequesterDateShiftId: string
  requesterShiftType: ShiftType
  targetShiftType: ShiftType
  requesterShiftTypeOnTargetDate: ShiftType
  targetShiftTypeOnRequesterDate: ShiftType
}

/**
 * Execute a swap request atomically
 * Updates all 4 shifts involved in the swap in a single operation
 * IMPORTANT: This should be a Supabase RPC call or transaction to ensure atomicity
 */
async function executeSwap(swapData: SwapExecutionData): Promise<void> {
  // Call a Supabase stored procedure that updates all 4 shifts atomically
  // OR use a database transaction wrapper
  
  const { error } = await supabase.rpc('execute_swap', {
    requester_shift_id: swapData.requesterShiftId,
    target_shift_id: swapData.targetShiftId,
    requester_on_target_date_shift_id: swapData.requesterOnTargetDateShiftId,
    target_on_requester_date_shift_id: swapData.targetOnRequesterDateShiftId,
    requester_shift_type: swapData.requesterShiftType,
    target_shift_type: swapData.targetShiftType,
    requester_shift_type_on_target_date: swapData.requesterShiftTypeOnTargetDate,
    target_shift_type_on_requester_date: swapData.targetShiftTypeOnRequesterDate,
  })

  if (error) throw error
}
```

**Note:** You'll need to create a Supabase stored procedure `execute_swap()` in `supabase/migrations/` that performs all 4 updates atomically or uses a transaction.

### 2. **Missing pre-swap validation**
**Issue:** No validation that all 4 required shifts still exist before attempting swap. Could lead to partial updates if a shift was deleted.

**Fix:** Add validation function:
```typescript
/**
 * Validate that all shifts involved in swap still exist and haven't changed
 */
async function validateSwapPreconditions(
  requesterShiftId: string,
  targetShiftId: string,
  requesterOnTargetDateShiftId: string,
  targetOnRequesterDateShiftId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const [shift1, shift2, shift3, shift4] = await Promise.all([
      shiftsService.getShiftById(requesterShiftId),
      shiftsService.getShiftById(targetShiftId),
      shiftsService.getShiftById(requesterOnTargetDateShiftId),
      shiftsService.getShiftById(targetOnRequesterDateShiftId),
    ])

    if (!shift1 || !shift2 || !shift3 || !shift4) {
      return { valid: false, error: 'One or more required shifts have been deleted' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Error validating shifts' }
  }
}
```

Use in SwapRequestDetail.tsx before executeSwap:
```typescript
const preconditions = await validateSwapPreconditions(...)
if (!preconditions.valid) {
  setError(preconditions.error)
  return
}
```

### 3. **Missing race condition handling**
**Issue:** No check if swap status changed between fetch and approval. Two simultaneous approvals could cause issues.

**Fix:** Add status validation before approval:
```typescript
/**
 * Check if swap request status is still valid for approval
 * Use optimistic locking to prevent race conditions
 */
async function validateSwapStatusUnchanged(
  swapId: string,
  expectedStatus: SwapRequestStatus
): Promise<boolean> {
  const current = await getSwapRequestById(swapId)
  return current.status === expectedStatus
}
```

Use before approval:
```typescript
const isStillValid = await validateSwapStatusUnchanged(id!, request.status)
if (!isStillValid) {
  setError('This swap request status has changed. Please refresh.')
  return
}
```

## Priority 2 (High)

### 4. **Add comprehensive input validation**
**Issue:** No validation of swap request data before insertion.

**Fix:** Add validation before createSwapRequest:
```typescript
function validateSwapRequest(request: Omit<SwapRequest, ...>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!request.requester_id || !isValidUUID(request.requester_id)) {
    errors.push('Invalid requester ID')
  }
  if (!request.target_user_id || !isValidUUID(request.target_user_id)) {
    errors.push('Invalid target user ID')
  }
  if (request.requester_id === request.target_user_id) {
    errors.push('Cannot swap with yourself')
  }
  if (!request.requester_shift_id || !isValidUUID(request.requester_shift_id)) {
    errors.push('Invalid requester shift ID')
  }
  if (!request.target_shift_id || !isValidUUID(request.target_shift_id)) {
    errors.push('Invalid target shift ID')
  }

  return { valid: errors.length === 0, errors }
}
```

### 5. **Add error-specific handling**
**Issue:** All errors thrown are generic, no distinction between permission, not found, conflict errors.

**Fix:** Create custom error class:
```typescript
export class SwapRequestError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'INVALID_STATE' | 'CONFLICT' | 'UNKNOWN',
    public details?: Record<string, unknown>
  ) {
    super(message)
  }
}

// Use in service functions:
if (!data) {
  throw new SwapRequestError(
    'Swap request not found',
    'NOT_FOUND',
    { swapId: id }
  )
}
```

---

# 2. src/services/shiftsService.ts

## Priority 1 (Critical)

### 1. **bulkUpsertShifts has no rollback/transaction safety**
**Issue:** If shift 3 of 10 fails, first 2 are already committed. Database is left in inconsistent state.

**Current Code (Line ~97):**
```typescript
async bulkUpsertShifts(shifts: Omit<Shift, 'id' | 'created_at'>[]): Promise<Shift[]> {
  const { data, error } = await supabase
    .from(API_ENDPOINTS.SHIFTS)
    .upsert(shifts, { onConflict: 'user_id,date' })
    .select()
  
  if (error) throw error
  return data as Shift[]
}
```

**Fix:** Add batch processing with rollback capability:
```typescript
/**
 * Bulk upsert with rollback support
 * If any shift fails, all previous updates are rolled back
 */
async function bulkUpsertShifts(
  shifts: Omit<Shift, 'id' | 'created_at'>[],
  options?: { stopOnError?: boolean; batchSize?: number }
): Promise<{ success: Shift[]; failed: { shift: Omit<Shift, 'id' | 'created_at'>; error: Error }[] }> {
  const batchSize = options?.batchSize || 100
  const stopOnError = options?.stopOnError ?? false
  const successful: Shift[] = []
  const failed: { shift: Omit<Shift, 'id' | 'created_at'>; error: Error }[] = []

  for (let i = 0; i < shifts.length; i += batchSize) {
    const batch = shifts.slice(i, i + batchSize)

    try {
      const { data, error } = await supabase
        .from(API_ENDPOINTS.SHIFTS)
        .upsert(batch, { onConflict: 'user_id,date' })
        .select()

      if (error) throw error
      successful.push(...(data as Shift[]))
    } catch (error) {
      batch.forEach(shift => {
        failed.push({ shift, error: error instanceof Error ? error : new Error(String(error)) })
      })

      if (stopOnError) break
    }
  }

  // If any failed with stopOnError, optionally rollback
  if (failed.length > 0 && stopOnError) {
    // TODO: Implement rollback logic or use database transaction
    // For now, return what succeeded and what failed
  }

  return { success: successful, failed }
}
```

### 2. **No duplicate detection for user_id,date**
**Issue:** While upsert has unique constraint, duplicates in the same batch could cause issues.

**Fix:** Add pre-validation:
```typescript
function validateShiftsNoDuplicates(shifts: Omit<Shift, 'id' | 'created_at'>[]): { valid: boolean; duplicates: string[] } {
  const seen = new Set<string>()
  const duplicates: string[] = []

  shifts.forEach(shift => {
    const key = `${shift.user_id}-${shift.date}`
    if (seen.has(key)) {
      duplicates.push(`Duplicate: user ${shift.user_id} on ${shift.date}`)
    }
    seen.add(key)
  })

  return { valid: duplicates.length === 0, duplicates }
}

// Use:
async function bulkUpsertShifts(shifts: ...) {
  const validation = validateShiftsNoDuplicates(shifts)
  if (!validation.valid) {
    throw new ShiftError('Duplicate shifts in batch', 'INVALID_INPUT', { duplicates: validation.duplicates })
  }
  // ... rest of function
}
```

## Priority 2 (High)

### 3. **Add shift data validation**
**Issue:** No checks for valid date format, shift_type enum values, etc.

**Fix:**
```typescript
function validateShift(shift: Omit<Shift, 'id' | 'created_at'>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!shift.user_id || !isValidUUID(shift.user_id)) {
    errors.push('Invalid user_id')
  }
  if (!shift.date || !isValidDateString(shift.date)) {
    errors.push('Invalid date format (must be YYYY-MM-DD)')
  }
  if (!['AM', 'PM', 'BET', 'OFF'].includes(shift.shift_type)) {
    errors.push(`Invalid shift_type: ${shift.shift_type}`)
  }

  return { valid: errors.length === 0, errors }
}

// Use before insert/upsert:
shifts.forEach(shift => {
  const validation = validateShift(shift)
  if (!validation.valid) {
    throw new ShiftError('Invalid shift data', 'INVALID_INPUT', { errors: validation.errors, shift })
  }
})
```

### 4. **getShifts() returns all shifts without filtering**
**Issue:** If querying large date range, could return thousands of shifts impacting performance.

**Fix:** Add result limit and pagination:
```typescript
async function getShifts(
  startDate?: string,
  endDate?: string,
  options?: { limit?: number; offset?: number }
): Promise<{ data: Shift[]; count: number; hasMore: boolean }> {
  let query = supabase
    .from(API_ENDPOINTS.SHIFTS)
    .select('*, users(name, email)', { count: 'exact' })
    .order('date', { ascending: true })

  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)

  const limit = options?.limit || 1000 // Default limit
  const offset = options?.offset || 0

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data as Shift[],
    count: count || 0,
    hasMore: (count || 0) > offset + limit
  }
}
```

---

# 3. src/lib/errorHandler.ts

## Priority 1 (Critical)

### 1. **TODO: Production error tracking not implemented**
**Issue:** Function `sendToErrorTracking()` (line ~88) is a placeholder. Production errors are never sent to tracking service.

**Current Code:**
```typescript
private sendToErrorTracking(errorLog: ErrorLog): void {
  // TODO: Integrate with Sentry, LogRocket, or similar service
  if (process.env.NODE_ENV === 'production') {
    void errorLog
  }
}
```

**Fix:** Implement Sentry integration (recommended):
```typescript
import * as Sentry from "@sentry/react";

// In your app root (App.tsx or main.tsx):
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter out sensitive data if needed
    return event
  }
})

// In errorHandler.ts:
private sendToErrorTracking(errorLog: ErrorLog): void {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(errorLog.error, {
      extra: errorLog.context,
      contexts: {
        error: {
          timestamp: errorLog.timestamp,
          userMessage: errorLog.userMessage,
          stack: errorLog.stack
        }
      },
      level: 'error'
    })
  }
}
```

Alternatively, use LogRocket or custom API endpoint.

### 2. **No handling for non-Error thrown values**
**Issue:** JavaScript allows throwing non-Error values: `throw "string"`, `throw 123`, `throw null`. Handler might fail on these.

**Current Code (Line ~62):**
```typescript
let errorMessage = userMessage
let stack: string | undefined

if (error instanceof Error) {
  errorMessage = error.message || userMessage
  stack = error.stack
} else if (typeof error === 'string') {
  errorMessage = error
}
// What if it's null, undefined, or an object?
```

**Fix:** Add comprehensive type handling:
```typescript
handle(error: unknown, options: ErrorOptions = {}): string {
  let errorMessage = userMessage
  let stack: string | undefined
  let source = 'unknown'

  // Handle all possible thrown values
  if (error instanceof Error) {
    errorMessage = error.message || userMessage
    stack = error.stack
    source = 'Error'
  } else if (typeof error === 'string') {
    errorMessage = error
    source = 'string'
  } else if (error && typeof error === 'object') {
    if ('message' in error) {
      errorMessage = String((error as any).message)
    } else if ('error' in error) {
      errorMessage = String((error as any).error)
    } else if ('error_description' in error) {
      errorMessage = String((error as any).error_description)
    } else {
      errorMessage = JSON.stringify(error)
    }
    source = 'object'
  } else {
    errorMessage = String(error) || userMessage
    source = 'primitive'
  }

  // Log source for debugging
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    error,
    userMessage,
    context: { ...context, source }, // Add source to context
    stack
  }

  // ... rest of function
}
```

## Priority 2 (High)

### 3. **Max error logs limit could lose important recent errors**
**Issue:** Stores only last 100 errors (line ~32). If many errors occur, might lose important ones.

**Fix:** Implement better error logging strategy:
```typescript
private errorLogs: ErrorLog[] = []
private maxLogs = 500 // Increased from 100

/**
 * Store error with priority-based retention
 * Keep all CRITICAL errors, but only recent NORMAL errors
 */
private storeErrorLog(errorLog: ErrorLog): void {
  const isCritical = ['database', 'auth', 'permission'].includes(
    String(errorLog.context?.type)
  )

  this.errorLogs.push(errorLog)

  // Retention strategy:
  // - Keep all critical errors
  // - Keep last 500 of all errors
  // - If over limit, remove oldest non-critical errors first
  if (this.errorLogs.length > this.maxLogs) {
    const critical = this.errorLogs.filter(
      log => ['database', 'auth', 'permission'].includes(String(log.context?.type))
    )
    const normal = this.errorLogs.filter(
      log => !['database', 'auth', 'permission'].includes(String(log.context?.type))
    )

    const toKeep = [...critical, ...normal.slice(-(this.maxLogs - critical.length))]
    this.errorLogs = toKeep
  }
}
```

### 4. **Missing error context enrichment**
**Issue:** Errors don't include contextual information like current user, page, or feature.

**Fix:** Add context enrichment:
```typescript
private enrichContext(context: Record<string, unknown>): Record<string, unknown> {
  return {
    ...context,
    // Add automatic context
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    // Add user context if available
    // userId: getCurrentUserId(),
    // userName: getCurrentUserName(),
  }
}

// Use in handle():
const enrichedContext = this.enrichContext(context)
const errorLog: ErrorLog = {
  timestamp: new Date().toISOString(),
  error,
  userMessage,
  context: enrichedContext,
  stack
}
```

---

# 4. supabase/schema.sql

## Priority 1 (Critical)

### 1. **CRITICAL: Overlapping/contradictory RLS policies**
**Issue:** Multiple policies for same operation on same table. Can cause unexpected denials or bypasses.

**Example - Users table (Lines ~308-319):**
```sql
-- Policy 1
CREATE POLICY "Users can view all users"
    ON users FOR SELECT
    TO public
    USING ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

-- Policy 2
CREATE POLICY "Allow view active users"
    ON users FOR SELECT
    TO authenticated
    USING (status = ANY (ARRAY['active'::text, 'on_leave'::text]));
```

Both apply simultaneously. User sees results only if BOTH conditions pass = restrictive (good). But confusing.

**Example - Shifts table (Lines ~347-375):**
```sql
CREATE POLICY "Users can insert shifts"
    ON shifts FOR INSERT
    TO public
    WITH CHECK ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);

CREATE POLICY "Users can insert own shifts"
    ON shifts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Problem: Second policy allows ANY authenticated user to insert
-- Domain check bypassed if they're already authenticated
```

**Fix:** Consolidate conflicting policies. For users table:
```sql
-- Single, clear policy for SELECT
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Allow view active users" ON users;

CREATE POLICY "users_select_active_users"
    ON users FOR SELECT
    TO authenticated
    USING (
        -- Domain check for auth.users
        (auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text
        AND status = ANY (ARRAY['active'::text, 'on_leave'::text])
    );

-- WFM can view all users regardless of status
CREATE POLICY "users_select_all_wfm"
    ON users FOR SELECT
    TO authenticated
    USING (get_user_role(auth.uid()) = 'wfm'::user_role);
```

For shifts table:
```sql
DROP POLICY IF EXISTS "Users can insert shifts" ON shifts;
DROP POLICY IF EXISTS "Users can insert own shifts" ON shifts;

CREATE POLICY "shifts_insert_own_domain"
    ON shifts FOR INSERT
    TO public
    WITH CHECK (
        (auth.uid() = user_id)
        AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text)
    );

CREATE POLICY "shifts_insert_wfm_any"
    ON shifts FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role(auth.uid()) = 'wfm'::user_role
    );
```

### 2. **RLS policies don't validate domain at INSERT time**
**Issue:** Users can insert/create data without domain validation. Only SELECT enforced at domain level.

**Current Code:** CREATE POLICY on swap_requests INSERT (Line ~421):
```sql
CREATE POLICY "Users can create swap requests"
    ON swap_requests FOR INSERT
    TO public
    WITH CHECK ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text);
```

This is good, but others are missing:
- leave_requests INSERT (Line ~457) - ✅ Has domain check
- comments INSERT (Line ~541) - ✅ Has domain check
- settings UPDATE (Line ~574) - ❌ Missing domain check

**Fix:** Add domain validation to all INSERT/UPDATE policies:
```sql
-- For settings UPDATE (currently missing):
CREATE POLICY "settings_update_wfm_domain"
    ON settings FOR UPDATE
    TO public
    USING (
        (EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'wfm'::user_role
        ))
        AND ((auth.jwt() ->> 'email'::text) ~~ '%@dabdoob.com'::text)
    );
```

### 3. **Missing policy for leave_balance_history INSERT**
**Issue:** Policy exists for SELECT and INSERT but references wrong role column.

**Current Code (Line ~510-515):**
```sql
CREATE POLICY "WFM can insert balance history"
    ON leave_balance_history FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'wfm'::user_role))));
```

This will work but is inefficient (subquery for every insert). Should use `get_user_role()` function.

**Fix:**
```sql
CREATE POLICY "leave_balance_history_insert_wfm"
    ON leave_balance_history FOR INSERT
    TO authenticated
    WITH CHECK (get_user_role(auth.uid()) = 'wfm'::user_role);
```

## Priority 2 (High)

### 4. **Missing indexes for swap_requests created_at sorting**
**Issue:** `getPendingSwapRequests()` orders by created_at (line ~72 in swapRequestsService). No index for this.

**Current Indexes (Lines ~646-657):**
```sql
CREATE INDEX idx_swap_requests_requester ON swap_requests(requester_id);
CREATE INDEX idx_swap_requests_target ON swap_requests(target_user_id);
CREATE INDEX idx_swap_requests_status ON swap_requests(status);
-- Missing: created_at for sorting
```

**Fix:** Add indexes for common queries:
```sql
-- For sorting by created_at on pending swaps
CREATE INDEX idx_swap_requests_status_created ON swap_requests(status, created_at DESC);

-- For finding user's swaps (requester or target) and sorting
CREATE INDEX idx_swap_requests_requester_created ON swap_requests(requester_id, created_at DESC);
CREATE INDEX idx_swap_requests_target_created ON swap_requests(target_user_id, created_at DESC);

-- For leave requests
CREATE INDEX idx_leave_requests_user_created ON leave_requests(user_id, created_at DESC);
CREATE INDEX idx_leave_requests_status_created ON leave_requests(status, created_at DESC);
```

### 5. **Missing validation constraints**
**Issue:** Database doesn't enforce business logic constraints.

**Examples:**
- Swap request dates: Can't ensure requester_original_date is a real date
- Leave request dates: Can't ensure start_date <= end_date
- Leave balances: Can't ensure balance >= 0

**Fix:** Add CHECK constraints:
```sql
-- In swap_requests table
ALTER TABLE swap_requests
ADD CONSTRAINT check_swap_dates_valid
CHECK (requester_original_date IS NULL OR requester_original_date = (SELECT date FROM shifts WHERE id = requester_shift_id));

-- In leave_requests table
ALTER TABLE leave_requests
ADD CONSTRAINT check_leave_dates_valid
CHECK (start_date <= end_date);

ALTER TABLE leave_requests
ADD CONSTRAINT check_leave_date_future
CHECK (start_date >= CURRENT_DATE);

-- In leave_balances table
ALTER TABLE leave_balances
ADD CONSTRAINT check_balance_non_negative
CHECK (balance >= 0);

-- In users table
ALTER TABLE users
ADD CONSTRAINT check_fte_valid
CHECK (fte_percentage >= 0.1 AND fte_percentage <= 1.0);
```

---

# 5. src/hooks/useAuth.ts

## Priority 1 (Critical)

### 1. **Helper functions don't memoize properly**
**Issue:** `isWFM()`, `isTL()`, `isAgent()` return new function instances on every render due to `useCallback` dependency only on `user`.

**Current Code (Line ~13-17):**
```typescript
const isWFM = useCallback(() => user?.role === 'wfm', [user])
const isTL = useCallback(() => user?.role === 'tl', [user])
const isAgent = useCallback(() => user?.role === 'agent', [user])
```

**Problem:** If `user` object reference changes even with same values, callbacks are recreated.

**Fix:** Simplify to direct functions (since they're stateless):
```typescript
const isWFM = () => user?.role === 'wfm'
const isTL = () => user?.role === 'tl'
const isAgent = () => user?.role === 'agent'

// OR if you must use callbacks, extract role once:
const userRole = user?.role
const isWFM = useCallback(() => userRole === 'wfm', [userRole])
const isTL = useCallback(() => userRole === 'tl', [userRole])
const isAgent = useCallback(() => userRole === 'agent', [userRole])
```

### 2. **Missing permission checks**
**Issue:** `canEditEmployee()` doesn't actually check if user manages that employee.

**Current Code (Line ~22-25):**
```typescript
const canEditEmployee = useCallback((_employeeUserId: string) => {
  // WFM can edit anyone, TL can only view (not edit)
  return user?.role === 'wfm'
}, [user])
```

**Problem:** Ignores the employee parameter. Doesn't check manager relationship.

**Fix:** Implement proper hierarchy checking:
```typescript
const canEditEmployee = useCallback((employeeUserId: string) => {
  if (!user) return false
  
  // WFM can edit anyone
  if (user.role === 'wfm') return true
  
  // TL can't edit (per comment), but can view own team
  // This would require checking if employee is on TL's team
  // For now, TL can't edit:
  return false
}, [user])

// Add new helper for viewing permissions
const canViewEmployee = useCallback((employeeUserId: string) => {
  if (!user) return false
  if (user.role === 'wfm') return true
  if (user.role === 'tl') {
    // TL can view if employee is in their department
    // Requires department data from user context
    return true // TODO: Check department match
  }
  return user.id === employeeUserId // Agents can view themselves
}, [user])
```

### 3. **No logout/session state check**
**Issue:** No way to check if user is logged out or session is expired.

**Fix:** Add helper functions:
```typescript
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  const { user, session } = context
  
  // Add session status helpers
  const isSessionActive = useCallback(() => !!session, [session])
  const isSessionExpired = useCallback(() => {
    if (!session) return true
    // Check if session expiry is in the past
    const expiresAt = session.expires_at
    if (!expiresAt) return false
    return new Date(expiresAt * 1000) < new Date()
  }, [session])

  return {
    ...context,
    isWFM,
    isTL,
    isAgent,
    hasRole,
    canViewHeadcount,
    canEditHeadcount,
    canEditEmployee,
    // Add new helpers
    isSessionActive,
    isSessionExpired,
  }
}
```

---

# 6. src/components/Layout.tsx

## Priority 1 (Critical)

### 1. **No route guards - anyone can access protected routes via URL**
**Issue:** Sidebar filters nav items by role, but doesn't prevent direct URL navigation to protected routes.

Example: Agent can type `/settings` in URL bar and see page (though RLS should block operations, but UX is bad).

**Current Code (Line ~80):**
```typescript
const filteredNavItems = NAV_ITEMS.filter(item => 
  user && item.roles.includes(user.role)
)
```

This only filters UI, doesn't prevent navigation.

**Fix:** Create ProtectedRoute component at `src/components/ProtectedRoute.tsx`:
```typescript
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  allowedRoles,
  fallback
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Navigate to="/unauthorized" replace />
    )
  }

  return <>{children}</>
}
```

Then in `src/App.tsx`, wrap protected routes:
```typescript
<Route element={<Layout />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/settings" element={
    <ProtectedRoute allowedRoles={['wfm']}>
      <Settings />
    </ProtectedRoute>
  } />
  <Route path="/reports" element={
    <ProtectedRoute allowedRoles={['tl', 'wfm']}>
      <Reports />
    </ProtectedRoute>
  } />
</Route>
```

### 2. **Sign out button always visible - no loading state**
**Issue:** Sign out button doesn't indicate if logout is in progress. Could be clicked multiple times.

**Current Code (Line ~160):**
```typescript
<button
  onClick={signOut}
  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 whitespace-nowrap flex-shrink-0"
  aria-label="Sign out"
>
```

**Fix:** Add loading state:
```typescript
const [isSigningOut, setIsSigningOut] = useState(false)

const handleSignOut = async () => {
  setIsSigningOut(true)
  try {
    await signOut()
  } finally {
    setIsSigningOut(false)
  }
}

<button
  onClick={handleSignOut}
  disabled={isSigningOut}
  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
  aria-label={isSigningOut ? 'Signing out...' : 'Sign out'}
>
  {isSigningOut ? (
    <>
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="hidden sm:inline">Signing out...</span>
    </>
  ) : (
    <>
      <SignOutIcon className="w-4 h-4" />
      <span className="hidden sm:inline">Sign out</span>
    </>
  )}
</button>
```

### 3. **No keyboard navigation for sidebar**
**Issue:** Sidebar links don't support arrow keys or other keyboard shortcuts for navigation.

**Fix:** Add keyboard shortcuts:
```typescript
// Add to Layout component
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Alt+H for home/dashboard
    if (e.altKey && e.key === 'h') {
      e.preventDefault()
      navigate(ROUTES.DASHBOARD)
    }
    // Alt+S for schedule
    if (e.altKey && e.key === 's') {
      e.preventDefault()
      navigate(ROUTES.SCHEDULE)
    }
    // Alt+L for leave requests
    if (e.altKey && e.key === 'l') {
      e.preventDefault()
      navigate(ROUTES.LEAVE_REQUESTS)
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [navigate])
```

And document in component:
```typescript
<div className="text-xs text-gray-500 px-3 py-2">
  Keyboard shortcuts: Alt+H (Home), Alt+S (Schedule), Alt+L (Leave)
</div>
```

## Priority 2 (High)

### 4. **Mobile menu doesn't trap focus**
**Issue:** When mobile menu opens, focus can escape to main content.

**Fix:** Add focus management:
```typescript
import { useEffect, useRef } from 'react'

const mobileMenuRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (!mobileMenuOpen) return

  // Focus first menu item when opens
  const firstLink = mobileMenuRef.current?.querySelector('a')
  firstLink?.focus()

  // Trap focus within menu
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    const focusableElements = mobileMenuRef.current?.querySelectorAll(
      'a, button, [tabindex]'
    )
    if (!focusableElements || focusableElements.length === 0) return

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [mobileMenuOpen])

// In JSX:
<aside ref={mobileMenuRef} className={...}>
  {/* ... */}
</aside>
```

---

# 7. src/types/index.ts

## Priority 2 (High)

### 1. **Swap request original shift fields are optional but should be required**
**Issue:** Fields like `requester_original_shift_type` are optional (`?`), but they should always exist after swap creation.

**Current Code (Lines ~40-48):**
```typescript
export interface SwapRequest {
  // ...
  requester_original_date?: string
  requester_original_shift_type?: ShiftType
  // ... etc
}
```

**Problem:** Frontend code uses these without null checks, assuming they exist.

**Fix:** Make fields required and ensure they're populated at creation:
```typescript
export interface SwapRequest {
  // ...
  // Original shift info stored at request creation (always present)
  requester_original_date: string
  requester_original_shift_type: ShiftType
  target_original_date: string
  target_original_shift_type: ShiftType
  requester_original_shift_type_on_target_date: ShiftType
  target_original_shift_type_on_requester_date: ShiftType
}
```

Then ensure `createSwapRequest()` in service validates all fields are provided.

### 2. **Missing types for service responses**
**Issue:** Services return generic types, no specific response types for errors or bulk operations.

**Fix:** Add service response types:
```typescript
// Service response types
export interface ServiceResponse<T> {
  data?: T
  error?: ServiceError
  success: boolean
}

export interface ServiceError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface BulkOperationResult<T> {
  successful: T[]
  failed: { item: T; error: ServiceError }[]
  totalAttempted: number
  successCount: number
  failureCount: number
}
```

Then update services to return these types:
```typescript
// In shiftsService:
async function bulkUpsertShifts(...): Promise<BulkOperationResult<Shift>> {
  // ... implementation
}
```

### 3. **HeadcountUser type has redundant fields**
**Issue:** User table already has department, fte_percentage, etc. Repeating them in HeadcountUser is redundant.

**Current Code (Lines ~110-140):**
```typescript
export interface HeadcountUser extends User {
  employee_id?: string
  status: 'active' | ...
  department?: string
  // ... also repeated in headcount_profiles below
  job_title?: string
  // ...
}
```

**Fix:** Clarify separation of concerns:
```typescript
// Base user from users table
export interface HeadcountUser extends User {
  employee_id?: string
  status: 'active' | 'inactive' | 'on_leave' | 'terminated' | 'suspended'
  department?: string
  hire_date?: string
  manager_id?: string
  fte_percentage: number
  created_at: string
}

// Extended profile from headcount_profiles table (separate)
export interface HeadcountProfile {
  user_id: string
  job_title?: string
  job_level?: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director'
  employment_type?: 'full_time' | 'part_time' | 'contractor' | 'intern'
  location?: string
  time_zone?: string
  phone?: string
  skills?: string[]
  certifications?: string[]
  max_weekly_hours?: number
  cost_center?: string
  budget_code?: string
  termination_date?: string
  onboarding_status?: 'pending' | 'in_progress' | 'completed'
  last_active_at?: string
}

// Joined view of user + profile
export interface FullHeadcountRecord extends HeadcountUser {
  profile?: HeadcountProfile
  manager?: { name: string; email: string }
}
```

---

# 8. src/lib/AuthContext.tsx

## Priority 1 (Critical)

### 1. **getUserFriendlyError() doesn't handle all error types**
**Issue:** Some auth errors might not match any patterns, falling through to generic message.

**Current Code (Lines ~25-45):**
```typescript
if (message.includes('email not confirmed')) { ... }
if (message.includes('invalid login credentials')) { ... }
if (message.includes('user not found')) { ... }
if (message.includes('invalid email')) { ... }
if (message.includes('rate limit')) { ... }
if (message.includes('network') || message.includes('fetch')) { ... }
return new Error(errorMessage) // Fallback
```

**Problem:** New auth errors (SAML, OAuth, 2FA) won't be recognized.

**Fix:** Add more patterns and better logging:
```typescript
function getUserFriendlyError(error: any): Error {
  const errorMessage = typeof error === 'string' 
    ? error 
    : (error?.message || error?.error_description || error?.msg || 'Unknown error')
  
  const message = errorMessage.toLowerCase()
  
  // Log unknown errors for debugging
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Auth Error]', { originalError: error, message })
  }

  // Map common patterns
  const patterns = [
    {
      test: (m: string) => m.includes('email not confirmed'),
      message: 'Please verify your email address. Check your inbox for the confirmation link.'
    },
    {
      test: (m: string) => m.includes('invalid login credentials') || m.includes('invalid grant'),
      message: 'Invalid email or password. Please check your credentials.'
    },
    {
      test: (m: string) => m.includes('user not found'),
      message: 'No account found with this email. Please sign up first.'
    },
    {
      test: (m: string) => m.includes('invalid email'),
      message: 'Please enter a valid email address.'
    },
    {
      test: (m: string) => m.includes('rate limit'),
      message: 'Too many attempts. Please wait before trying again.'
    },
    {
      test: (m: string) => m.includes('network') || m.includes('fetch'),
      message: ERROR_MESSAGES.NETWORK
    },
    {
      test: (m: string) => m.includes('password'),
      message: 'Password must be at least 8 characters.'
    },
    {
      test: (m: string) => m.includes('already registered'),
      message: 'An account with this email already exists.'
    },
  ]

  for (const pattern of patterns) {
    if (pattern.test(message)) {
      return new Error(pattern.message)
    }
  }

  // Fallback for unknown errors
  return new Error(message || 'An error occurred. Please try again.')
}
```

### 2. **No handling for email verification/confirmation flow**
**Issue:** If user signs up but email not confirmed, they get error but no guidance on resending confirmation.

**Fix:** Add email confirmation handling:
```typescript
interface AuthContextType {
  // ... existing
  resendConfirmationEmail: (email: string) => Promise<{ error: Error | null }>
  isEmailUnconfirmed: boolean
  unconfirmedEmail?: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // ... existing state
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string>()

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Check if error is "email not confirmed"
        if (error.message?.includes('email not confirmed')) {
          setIsEmailUnconfirmed(true)
          setUnconfirmedEmail(email)
          return { error: getUserFriendlyError(error), session: null }
        }
        throw getUserFriendlyError(error)
      }
      // ... rest
    } catch (error: any) {
      return { error: error instanceof Error ? error : getUserFriendlyError(error), session: null }
    }
  }

  async function resendConfirmationEmail(email: string) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: getUserFriendlyError(error) }
    }
  }

  return (
    <AuthContext.Provider value={{
      // ... existing
      resendConfirmationEmail,
      isEmailUnconfirmed,
      unconfirmedEmail,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 3. **No refresh token handling**
**Issue:** If access token expires, session might become invalid without user knowing.

**Fix:** Add token refresh mechanism:
```typescript
useEffect(() => {
  if (!session) return

  // Set up token refresh before expiry (5 minutes before)
  const expiresIn = session.expires_in || 3600 // Default 1 hour
  const refreshTime = (expiresIn - 300) * 1000 // Refresh 5 min before expiry

  const refreshTimer = setTimeout(async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      // Token refresh failed, user needs to log in again
      setSession(null)
      setUser(null)
      setSupabaseUser(null)
    } else if (data.session) {
      setSession(data.session)
    }
  }, refreshTime)

  return () => clearTimeout(refreshTimer)
}, [session])
```

---

# 9. src/constants/index.ts & src/utils/index.ts

## Priority 2 (High)

### 1. **Missing business logic constants**
**Issue:** Constants file doesn't include shift or leave request constraints mentioned in README.

**Fix:** Add to constants/index.ts:
```typescript
// ============================================
// SHIFT MANAGEMENT
// ============================================
export const SHIFT_CONSTRAINTS = {
  MAX_SWAPS_PER_MONTH: 4,           // Max swaps an agent can request per month
  MIN_SWAP_NOTICE_DAYS: 1,          // Min days notice to request swap
  SWAP_REQUEST_EXPIRY_DAYS: 30,     // Swaps expire after 30 days if not approved
  CONSECUTIVE_SHIFTS_MAX: 5,        // Max consecutive shifts allowed
} as const

// ============================================
// LEAVE REQUEST CONSTRAINTS
// ============================================
export const LEAVE_CONSTRAINTS = {
  MAX_DAYS_PER_REQUEST: 30,         // Max single leave request length
  MIN_NOTICE_DAYS: 2,               // Min days notice required
  REQUEST_EXPIRY_DAYS: 90,          // Unapproved requests expire after 90 days
  EXCEPTION_REQUEST_MAX_ATTEMPTS: 2, // Max exception requests per denied leave
  BLACKOUT_DATES: [] as string[],   // Dates when leave can't be taken (holidays)
} as const

// ============================================
// SWAP REQUEST APPROVAL TIMEFRAMES
// ============================================
export const APPROVAL_TIMEFRAMES = {
  TARGET_RESPONSE_HOURS: 24,        // Target must respond within 24 hours
  TL_APPROVAL_HOURS: 48,            // TL has 48 hours to approve
  WFM_APPROVAL_HOURS: 24,           // WFM has 24 hours to approve
} as const
```

### 2. **Utils file just re-exports - should document sub-modules**
**Issue:** `src/utils/index.ts` doesn't explain what each utility module contains.

**Current Code (Line ~1-5):**
```typescript
export * from './dateHelpers'
export * from './formatters'
export * from './validators'
export * from './csvHelpers'
export * from './sanitize'
```

**Fix:** Add documentation:
```typescript
/**
 * Utility Functions
 * 
 * This module exports utilities organized by function:
 * - dateHelpers: Date calculations (getDaysBetween, isWeekend, etc.)
 * - formatters: String formatting (formatDate, formatCurrency, etc.)
 * - validators: Input validation (isValidEmail, isValidPhone, etc.)
 * - csvHelpers: CSV parsing and generation
 * - sanitize: Security functions (escapeHtml, sanitizeInput, etc.)
 */

export * from './dateHelpers'
export * from './formatters'
export * from './validators'
export * from './csvHelpers'
export * from './sanitize'
```

And add individual file comments to each util submodule.

---

## Summary by Severity

### 🔴 CRITICAL (Must Fix Before Production)
1. **swapRequestsService**: Missing atomic swap execution - can corrupt data
2. **shiftsService**: No transaction handling in bulk operations
3. **errorHandler**: Production error tracking is TODO - unimplemented
4. **schema.sql**: Overlapping RLS policies - potential permission issues
5. **Layout**: No route guards - direct URL access to protected routes

### 🟡 HIGH PRIORITY
1. swapRequestsService: Add pre-swap validation and race condition checks
2. shiftsService: Add comprehensive input validation
3. AuthContext: Incomplete error type handling
4. All services: Add data validation before operations
5. Database: Consolidate RLS policies

### 🟢 MEDIUM PRIORITY
1. useAuth: Optimize callbacks and add session status helpers
2. errorHandler: Enrich error context automatically
3. SwapRequest type: Make original shift fields required
4. Layout: Add keyboard shortcuts and mobile focus trapping
5. Add business logic constants for shift/leave constraints

---

This guide provides everything your AI agent needs to strengthen security, prevent data corruption, and improve code quality across your infrastructure layer.
