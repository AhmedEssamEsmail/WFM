# Leave Requests, Comments & Settings Services Refactoring Guide
## Detailed Recommendations for AI Agent Implementation

---

# 1. src/services/leaveRequestsService.ts

## Priority 1 (Critical)

### 1. **CRITICAL: No leave balance validation or deduction**
**Issue:** Service allows creating leave requests without checking if user has sufficient balance. No automatic balance deduction on approval.

**Current Code (Line ~36):**
```typescript
async createLeaveRequest(request: Omit<LeaveRequest, ...>): Promise<LeaveRequest> {
  const { data, error } = await supabase
    .from(API_ENDPOINTS.LEAVE_REQUESTS)
    .insert(request)
    .select()
    .single()
  
  if (error) throw error
  return data as LeaveRequest
}
```

**Problem:** Creates leave request even if user has 0 balance. Approval doesn't deduct balance.

**Fix:** Add balance validation and deduction:
```typescript
/**
 * Create leave request with balance validation
 * Validates sufficient balance and reserves it temporarily
 */
async function createLeaveRequest(
  request: Omit<LeaveRequest, 'id' | 'created_at' | 'status' | 'tl_approved_at' | 'wfm_approved_at'>
): Promise<{ success: boolean; leaveRequest?: LeaveRequest; error?: string }> {
  try {
    // Step 1: Validate dates
    const validation = validateLeaveDates(request.start_date, request.end_date)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Step 2: Calculate days requested
    const daysRequested = calculateBusinessDays(request.start_date, request.end_date)
    if (daysRequested < 1) {
      return { success: false, error: 'Leave request must be at least 1 day' }
    }

    // Step 3: Check balance
    const balance = await leaveBalancesService.getBalance(request.user_id, request.leave_type)
    if (balance < daysRequested) {
      return {
        success: false,
        error: `Insufficient balance. You have ${balance} days but requested ${daysRequested} days.`
      }
    }

    // Step 4: Check for overlapping leaves
    const overlaps = await checkOverlappingLeaves(
      request.user_id,
      request.start_date,
      request.end_date
    )
    if (overlaps.length > 0) {
      return {
        success: false,
        error: 'You already have leave during this period'
      }
    }

    // Step 5: Create leave request
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .insert(request)
      .select()
      .single()

    if (error) throw error

    // Step 6: Reserve balance (mark as pending, not fully deducted yet)
    await leaveBalancesService.reserveBalance(
      request.user_id,
      request.leave_type,
      daysRequested,
      data.id
    )

    return { success: true, leaveRequest: data as LeaveRequest }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Validate leave request dates
 */
function validateLeaveDates(
  startDate: string,
  endDate: string
): { valid: boolean; error?: string } {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' }
  }

  if (start > end) {
    return { valid: false, error: 'Start date cannot be after end date' }
  }

  if (start < today) {
    return { valid: false, error: 'Cannot request leave in the past' }
  }

  const maxDays = 365 // Max 1 year in advance
  const daysUntilStart = Math.floor((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntilStart > maxDays) {
    return { valid: false, error: `Cannot request leave more than ${maxDays} days in advance` }
  }

  return { valid: true }
}

/**
 * Check for overlapping leave requests
 */
async function checkOverlappingLeaves(
  userId: string,
  startDate: string,
  endDate: string
): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from(API_ENDPOINTS.LEAVE_REQUESTS)
    .select('*')
    .eq('user_id', userId)
    .in('status', ['approved', 'pending_tl', 'pending_wfm']) // Exclude rejected/denied
    .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)

  if (error) throw error
  return data as LeaveRequest[]
}

/**
 * Calculate business days between two dates (excluding weekends)
 */
function calculateBusinessDays(startDate: string, endDate: string): number {
  let count = 0
  let current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}
```

### 2. **No leave type validation**
**Issue:** Service accepts any leave type string without checking against enum.

**Fix:**
```typescript
function validateLeaveType(leaveType: string): boolean {
  const validTypes = ['sick', 'annual', 'casual', 'public_holiday', 'bereavement']
  return validTypes.includes(leaveType)
}

// Use in createLeaveRequest:
if (!validateLeaveType(request.leave_type)) {
  return { success: false, error: 'Invalid leave type' }
}
```

### 3. **No automatic balance deduction on approval**
**Issue:** When leave is approved, balance isn't deducted. Manual tracking required.

**Fix:** Create approval function that deducts balance:
```typescript
/**
 * Approve leave request and deduct balance
 */
async function approveLeaveRequest(
  id: string,
  approvalField: 'tl_approved_at' | 'wfm_approved_at'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the leave request
    const leaveRequest = await getLeaveRequestById(id)

    // If this is WFM approval (final approval), deduct balance
    if (approvalField === 'wfm_approved_at' && leaveRequest.status === 'pending_wfm') {
      const daysRequested = calculateBusinessDays(
        leaveRequest.start_date,
        leaveRequest.end_date
      )

      // Deduct from balance
      await leaveBalancesService.deductBalance(
        leaveRequest.user_id,
        leaveRequest.leave_type,
        daysRequested,
        id,
        'leave_approved'
      )
    }

    // Update status
    const updates: Record<string, any> = {
      status: approvalField === 'wfm_approved_at' ? 'approved' : 'pending_wfm'
    }
    updates[approvalField] = new Date().toISOString()

    const { error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .update(updates)
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
```

### 4. **getLeaveRequestsByDateRange doesn't paginate**
**Issue:** Large date ranges could return thousands of records, impacting performance.

**Current Code (Line ~111):**
```typescript
async getLeaveRequestsByDateRange(startDate: string, endDate: string): Promise<LeaveRequest[]> {
  // No limit, no pagination
}
```

**Fix:**
```typescript
async function getLeaveRequestsByDateRange(
  startDate: string,
  endDate: string,
  options?: { limit?: number; offset?: number }
): Promise<{ data: LeaveRequest[]; count: number; hasMore: boolean }> {
  const limit = options?.limit || 1000
  const offset = options?.offset || 0

  let query = supabase
    .from(API_ENDPOINTS.LEAVE_REQUESTS)
    .select('*, users(id, name, email, role)', { count: 'exact' })
    .gte('start_date', startDate)
    .lte('end_date', endDate)
    .order('start_date', { ascending: true })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data as LeaveRequest[],
    count: count || 0,
    hasMore: (count || 0) > offset + limit
  }
}
```

## Priority 2 (High)

### 5. **No leave request expiry handling**
**Issue:** Unapproved requests stay forever. Should auto-expire after 90 days (per LEAVE_CONSTRAINTS).

**Fix:** Add cleanup function:
```typescript
/**
 * Expire old leave requests that haven't been approved
 * Should be called periodically (via cron job or manual trigger)
 */
async function expireOldLeaveRequests(): Promise<{ expiredCount: number }> {
  const expiryDays = 90
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() - expiryDays)

  const { data, error } = await supabase
    .from(API_ENDPOINTS.LEAVE_REQUESTS)
    .update({ status: 'rejected' })
    .in('status', ['pending_tl', 'pending_wfm'])
    .lt('created_at', expiryDate.toISOString())

  if (error) throw error

  return { expiredCount: data.length }
}
```

### 6. **Missing exception request handling**
**Issue:** Schema notes "exception_requests" for denied leaves, but service doesn't support it.

**Fix:** Add exception request creation:
```typescript
/**
 * Create exception request for denied leave
 * User can request override of auto-denial
 */
async function createExceptionRequest(
  leaveRequestId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get original leave request
    const leave = await getLeaveRequestById(leaveRequestId)

    // Check it's actually denied
    if (leave.status !== 'denied') {
      return { success: false, error: 'Can only request exceptions for denied leaves' }
    }

    // Check max attempts (2 per denied request)
    const exceptionCount = await getExceptionRequestCount(leaveRequestId)
    if (exceptionCount >= 2) {
      return { success: false, error: 'Maximum exception requests exceeded' }
    }

    // Create as comment with system flag
    const comment = await commentsService.createSystemComment(
      leaveRequestId,
      'leave',
      `Exception Request: ${reason}`,
      leave.user_id
    )

    // Reset status to pending_wfm for exception review
    const { error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .update({ status: 'pending_wfm' })
      .eq('id', leaveRequestId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
```

### 7. **No input validation**
**Issue:** Creates requests without validating user_id, notes length, etc.

**Fix:**
```typescript
function validateLeaveRequestInput(
  request: Omit<LeaveRequest, ...>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!request.user_id || !isValidUUID(request.user_id)) {
    errors.push('Invalid user_id')
  }
  if (!validateLeaveType(request.leave_type)) {
    errors.push('Invalid leave type')
  }
  if (request.notes && request.notes.length > 500) {
    errors.push('Notes cannot exceed 500 characters')
  }

  return { valid: errors.length === 0, errors }
}
```

---

# 2. src/services/commentsService.ts

## Priority 1 (Critical)

### 1. **No pagination for getComments**
**Issue:** Large discussions could return hundreds of comments, impacting performance. No limit.

**Current Code (Line ~13):**
```typescript
async getComments(requestId: string, requestType: RequestType): Promise<Comment[]> {
  // No pagination
}
```

**Fix:**
```typescript
async function getComments(
  requestId: string,
  requestType: RequestType,
  options?: { limit?: number; offset?: number }
): Promise<{ data: Comment[]; count: number; hasMore: boolean }> {
  const limit = options?.limit || 50
  const offset = options?.offset || 0

  let query = supabase
    .from(API_ENDPOINTS.COMMENTS)
    .select('*, users(id, name, email, role)', { count: 'exact' })
    .eq('request_id', requestId)
    .eq('request_type', requestType)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data as Comment[],
    count: count || 0,
    hasMore: (count || 0) > offset + limit
  }
}
```

### 2. **System comments are mutable**
**Issue:** System comments (auto-generated status updates) should be immutable. Currently users can delete/edit them.

**Current Code (Line ~45-52):**
```typescript
async deleteComment(commentId: string): Promise<void> {
  // No check if comment is system
}

async updateComment(commentId: string, content: string): Promise<Comment> {
  // No check if comment is system
}
```

**Fix:**
```typescript
async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch comment to check if system
    const comment = await getCommentById(commentId) // Need to implement this

    if (comment.is_system) {
      return { success: false, error: 'System comments cannot be deleted' }
    }

    const { error } = await supabase
      .from(API_ENDPOINTS.COMMENTS)
      .delete()
      .eq('id', commentId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function updateComment(
  commentId: string,
  content: string
): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  try {
    // Fetch to check if system
    const comment = await getCommentById(commentId)

    if (comment.is_system) {
      return { success: false, error: 'System comments cannot be edited' }
    }

    // Validate content length
    if (!content || content.length > 1000) {
      return { success: false, error: 'Comment must be between 1 and 1000 characters' }
    }

    const { data, error } = await supabase
      .from(API_ENDPOINTS.COMMENTS)
      .update({ content })
      .eq('id', commentId)
      .select('*, users(id, name, email, role)')
      .single()

    if (error) throw error
    return { success: true, comment: data as Comment }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Helper function
async function getCommentById(commentId: string): Promise<Comment> {
  const { data, error } = await supabase
    .from(API_ENDPOINTS.COMMENTS)
    .select('*')
    .eq('id', commentId)
    .single()

  if (error) throw error
  return data as Comment
}
```

### 3. **No input validation for comments**
**Issue:** Creates comments without validating content, request_id, or request_type.

**Fix:**
```typescript
function validateCommentInput(
  comment: Omit<Comment, 'id' | 'created_at'>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!comment.request_id || !isValidUUID(comment.request_id)) {
    errors.push('Invalid request_id')
  }
  if (!['swap', 'leave'].includes(comment.request_type)) {
    errors.push('Invalid request_type')
  }
  if (!comment.user_id || !isValidUUID(comment.user_id)) {
    errors.push('Invalid user_id')
  }
  if (!comment.content || comment.content.length === 0) {
    errors.push('Comment cannot be empty')
  }
  if (comment.content.length > 1000) {
    errors.push('Comment cannot exceed 1000 characters')
  }

  return { valid: errors.length === 0, errors }
}

// Use in createComment:
async function createComment(
  comment: Omit<Comment, 'id' | 'created_at'>
): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  const validation = validateCommentInput(comment)
  if (!validation.valid) {
    return { success: false, error: validation.errors.join('; ') }
  }

  // ... rest of function
}
```

## Priority 2 (High)

### 4. **No audit trail for deleted comments**
**Issue:** Deleted comments are permanently removed. No record of what was deleted or when.

**Fix:** Soft delete instead:
```typescript
// Add soft delete support
async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const comment = await getCommentById(commentId)

    if (comment.is_system) {
      return { success: false, error: 'System comments cannot be deleted' }
    }

    // Soft delete - keep record but mark as deleted
    const { error } = await supabase
      .from(API_ENDPOINTS.COMMENTS)
      .update({
        content: '[deleted]',
        deleted_at: new Date().toISOString()
      })
      .eq('id', commentId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
```

Requires adding `deleted_at` column to comments table:
```sql
ALTER TABLE comments ADD COLUMN deleted_at TIMESTAMPTZ;

-- Update RLS policies to exclude deleted comments
CREATE POLICY "comments_select_not_deleted"
    ON comments FOR SELECT
    USING (deleted_at IS NULL);
```

### 5. **No edit timestamp tracking**
**Issue:** When comment is edited, no timestamp recorded. Unclear if content is original.

**Fix:** Add edited_at column tracking:
```typescript
// First add column to DB:
// ALTER TABLE comments ADD COLUMN edited_at TIMESTAMPTZ;

async function updateComment(
  commentId: string,
  content: string
): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  try {
    const comment = await getCommentById(commentId)

    if (comment.is_system) {
      return { success: false, error: 'System comments cannot be edited' }
    }

    if (!content || content.length > 1000) {
      return { success: false, error: 'Invalid comment' }
    }

    const { data, error } = await supabase
      .from(API_ENDPOINTS.COMMENTS)
      .update({
        content,
        edited_at: new Date().toISOString() // Track edit time
      })
      .eq('id', commentId)
      .select('*, users(id, name, email, role)')
      .single()

    if (error) throw error
    return { success: true, comment: data as Comment }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
```

---

# 3. src/services/settingsService.ts

## Priority 1 (Critical)

### 1. **Boolean parsing is fragile**
**Issue:** Settings stored as strings. Boolean parsing with `=== 'true'` could fail with unexpected inputs.

**Current Code (Line ~62-73):**
```typescript
async getAutoApproveSetting(): Promise<boolean> {
  const value = await this.getSetting('wfm_auto_approve')
  return value === 'true'
}
```

**Problem:** `'True'`, `'TRUE'`, `'1'`, `true` (boolean) all fail. Returns false for all non-matching values.

**Fix:** Create robust parsing utility:
```typescript
/**
 * Settings schema and validation
 */
export const SETTINGS_SCHEMA = {
  wfm_auto_approve: {
    type: 'boolean',
    default: 'false',
    description: 'Automatically approve shift swaps'
  },
  allow_leave_exceptions: {
    type: 'boolean',
    default: 'true',
    description: 'Allow leave exception requests'
  },
  max_swaps_per_month: {
    type: 'number',
    default: '4',
    description: 'Maximum swaps per user per month'
  },
  min_swap_notice_days: {
    type: 'number',
    default: '1',
    description: 'Minimum days notice for swaps'
  },
  leave_request_expiry_days: {
    type: 'number',
    default: '90',
    description: 'Days until unapproved leave expires'
  }
} as const

/**
 * Parse setting value by type
 */
function parseSetting(key: string, value: string | null): any {
  if (!value) return null

  const schema = SETTINGS_SCHEMA[key as keyof typeof SETTINGS_SCHEMA]
  if (!schema) {
    console.warn(`Unknown setting: ${key}`)
    return value
  }

  switch (schema.type) {
    case 'boolean':
      return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
    case 'number':
      const num = parseInt(value, 10)
      return isNaN(num) ? null : num
    default:
      return value
  }
}

/**
 * Get typed setting value
 */
async function getSetting<T extends keyof typeof SETTINGS_SCHEMA>(
  key: T
): Promise<ReturnType<typeof parseSetting>> {
  const { data, error } = await supabase
    .from(API_ENDPOINTS.SETTINGS)
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found, return default
      const schema = SETTINGS_SCHEMA[key]
      return parseSetting(key, schema.default)
    }
    throw error
  }

  return parseSetting(key, data.value)
}

async function getAutoApproveSetting(): Promise<boolean> {
  return await getSetting('wfm_auto_approve')
}

async function getAllowLeaveExceptionsSetting(): Promise<boolean> {
  return await getSetting('allow_leave_exceptions')
}
```

### 2. **No settings validation on update**
**Issue:** Can set arbitrary values without checking if they're valid.

**Current Code (Line ~42):**
```typescript
async updateSetting(key: string, value: string): Promise<void> {
  // No validation that key is known, value is valid for its type
}
```

**Fix:**
```typescript
/**
 * Validate setting before update
 */
function validateSetting(key: string, value: string): { valid: boolean; error?: string } {
  const schema = SETTINGS_SCHEMA[key as keyof typeof SETTINGS_SCHEMA]

  if (!schema) {
    return { valid: false, error: `Unknown setting: ${key}` }
  }

  switch (schema.type) {
    case 'boolean':
      if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
        return { valid: false, error: `${key} must be a boolean` }
      }
      break

    case 'number':
      const num = parseInt(value, 10)
      if (isNaN(num) || num < 0) {
        return { valid: false, error: `${key} must be a positive number` }
      }
      break
  }

  return { valid: true }
}

async function updateSetting(
  key: string,
  value: string
): Promise<{ success: boolean; error?: string }> {
  const validation = validateSetting(key, value)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  try {
    const { error } = await supabase
      .from(API_ENDPOINTS.SETTINGS)
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
```

### 3. **No permission checks**
**Issue:** No verification that only WFM can update settings. Anyone with DB access can modify.

**Note:** This should be enforced at RLS level, but service can add extra check:

**Fix:**
```typescript
async function updateSetting(
  key: string,
  value: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  // Validate setting
  const validation = validateSetting(key, value)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  try {
    // Get current user's role (if userId provided)
    // This is optional - RLS should handle it, but good for API protection
    if (userId) {
      const userRole = await getUserRole(userId)
      if (userRole !== 'wfm') {
        return { success: false, error: 'Only WFM can update settings' }
      }
    }

    const { error } = await supabase
      .from(API_ENDPOINTS.SETTINGS)
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
```

## Priority 2 (High)

### 4. **No caching - every call hits database**
**Issue:** Settings are frequently read (e.g., auto_approve on every swap approval), but no caching.

**Fix:** Add in-memory cache with TTL:
```typescript
interface CachedSetting {
  value: any
  timestamp: number
  ttl: number // milliseconds
}

class SettingsCache {
  private cache: Map<string, CachedSetting> = new Map()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, value: any, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.value
  }

  clear(): void {
    this.cache.clear()
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }
}

const settingsCache = new SettingsCache()

async function getSetting<T extends keyof typeof SETTINGS_SCHEMA>(
  key: T
): Promise<ReturnType<typeof parseSetting>> {
  // Check cache first
  const cached = settingsCache.get(key)
  if (cached !== null) {
    return cached
  }

  // Fetch from DB
  const { data, error } = await supabase
    .from(API_ENDPOINTS.SETTINGS)
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      const schema = SETTINGS_SCHEMA[key]
      const parsed = parseSetting(key, schema.default)
      settingsCache.set(key, parsed) // Cache default
      return parsed
    }
    throw error
  }

  const parsed = parseSetting(key, data.value)
  settingsCache.set(key, parsed) // Cache result
  return parsed
}

async function updateSetting(key: string, value: string): Promise<{ success: boolean }> {
  const validation = validateSetting(key, value)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  try {
    const { error } = await supabase
      .from(API_ENDPOINTS.SETTINGS)
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) throw error

    // Invalidate cache for this key
    settingsCache.invalidate(key)

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
```

### 5. **No audit trail for setting changes**
**Issue:** WFM changes settings with no record of what changed or when.

**Fix:** Add audit logging:
```typescript
/**
 * Create audit log entry for setting change
 */
async function logSettingChange(
  key: string,
  previousValue: string | null,
  newValue: string,
  changedBy: string
): Promise<void> {
  const { error } = await supabase
    .from('settings_audit_log')
    .insert({
      key,
      previous_value: previousValue,
      new_value: newValue,
      changed_by: changedBy,
      changed_at: new Date().toISOString()
    })

  if (error) {
    console.error('Failed to log setting change:', error)
    // Don't throw - setting should still update even if audit fails
  }
}

async function updateSetting(
  key: string,
  value: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const validation = validateSetting(key, value)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  try {
    // Get old value for audit
    const oldValue = await getSetting(key as any)

    const { error } = await supabase
      .from(API_ENDPOINTS.SETTINGS)
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) throw error

    // Log change
    await logSettingChange(key, String(oldValue), value, userId)

    // Invalidate cache
    settingsCache.invalidate(key)

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
```

Requires creating audit table:
```sql
CREATE TABLE settings_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_changed_by FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE INDEX idx_settings_audit_key ON settings_audit_log(key);
CREATE INDEX idx_settings_audit_changed_at ON settings_audit_log(changed_at DESC);
```

### 6. **getAllSettings returns all settings (even future ones)**
**Issue:** When new settings are added, this method returns everything including undocumented ones.

**Fix:** Only return known settings:
```typescript
async function getAllSettings(): Promise<Record<string, any>> {
  const settings: Record<string, any> = {}

  // Initialize with defaults
  for (const [key, schema] of Object.entries(SETTINGS_SCHEMA)) {
    settings[key] = parseSetting(key, schema.default)
  }

  // Fetch all from DB
  const { data, error } = await supabase
    .from(API_ENDPOINTS.SETTINGS)
    .select('key, value')

  if (error) throw error

  // Override defaults with DB values (only known settings)
  data.forEach(setting => {
    if (setting.key in SETTINGS_SCHEMA) {
      settings[setting.key] = parseSetting(setting.key, setting.value)
    }
  })

  return settings
}
```

---

# Summary Table

| File | Issue | Severity | Impact |
|------|-------|----------|--------|
| leaveRequestsService | No balance validation | CRITICAL | Allow leave without balance |
| leaveRequestsService | No overlap detection | CRITICAL | Same dates approved twice |
| leaveRequestsService | No auto balance deduction | CRITICAL | Balances never deducted |
| commentsService | No pagination | HIGH | Performance issues >100 comments |
| commentsService | System comments mutable | HIGH | Auto-generated updates deleted |
| commentsService | No input validation | HIGH | Inject malicious comments |
| settingsService | Fragile boolean parsing | CRITICAL | Wrong approval behavior |
| settingsService | No validation on update | HIGH | Corrupt setting values |
| settingsService | No audit trail | HIGH | No accountability for changes |
| settingsService | No caching | MEDIUM | DB overload on frequent reads |

---

# Integration Notes

These services interact with:
- **leaveBalancesService**: Need to create this service if it doesn't exist
- **errorHandler**: Use handleDatabaseError() for consistency
- **Database schema**: Needs new tables (settings_audit_log) and indexes
- **RLS policies**: Need to restrict settings updates to WFM only

All fixes maintain backward compatibility while adding new error handling and validation layers.
