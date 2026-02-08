# Complete Refactoring Guide for WFM Pages
## Clear & Actionable Comments for AI Agent

---

# 1. Schedule.tsx

## Priority 1 (Critical - Fix First)

### 1. Add missing useEffect dependencies
**Issue:** The first useEffect is missing `monthStart` and `monthEnd` in the dependency array, which could cause stale closures.

**Current Code:**
```typescript
useEffect(() => {
  fetchScheduleData()
  if (canEdit) {
    fetchLeaveTypes()
  }
}, [currentDate, user, canEdit])  // ❌ Missing monthStart, monthEnd
```

**Fix:** Add all values used in the effect to the dependency array:
```typescript
useEffect(() => {
  fetchScheduleData()
  if (canEdit) {
    fetchLeaveTypes()
  }
}, [currentDate, user, canEdit])
// monthStart and monthEnd are derived from currentDate, so currentDate is sufficient
// But add explicit dependencies if monthStart/monthEnd are recalculated elsewhere
```

### 2. Add useMemo for filteredUsers
**Issue:** `filteredUsers` is recalculated on every render even when `selectedUserId` and `users` haven't changed, causing unnecessary re-renders of child components.

**Current Code:**
```typescript
const filteredUsers = selectedUserId === 'all' ? users : users.filter(u => u.id === selectedUserId)
```

**Fix:** Wrap in useMemo to prevent unnecessary recalculations:
```typescript
import { useMemo } from 'react'

const filteredUsers = useMemo(
  () => selectedUserId === 'all' ? users : users.filter(u => u.id === selectedUserId),
  [selectedUserId, users]
)
```

### 3. Move leave type descriptions to designSystem
**Issue:** Leave type labels and descriptions are hardcoded in multiple places (line ~260 and throughout the file), creating duplication and maintenance burden.

**Current Code:**
```typescript
{type === 'sick' && 'Sick Leave'}
{type === 'annual' && 'Annual Leave'}
{type === 'casual' && 'Casual Leave'}
{type === 'public_holiday' && 'Public Holiday'}
{type === 'bereavement' && 'Bereavement'}
```

**Fix:** Create centralized configuration in `src/lib/designSystem.ts`:
```typescript
// Add to designSystem.ts
export const LEAVE_TYPE_CONFIGS: Record<LeaveType, { 
  label: string
  shortLabel: string
  description: string 
}> = {
  sick: { label: 'Sick Leave', shortLabel: 'Sick', description: 'Sick Leave' },
  annual: { label: 'Annual Leave', shortLabel: 'Annual', description: 'Annual Leave' },
  casual: { label: 'Casual Leave', shortLabel: 'Casual', description: 'Casual Leave' },
  public_holiday: { label: 'Public Holiday', shortLabel: 'Holiday', description: 'Public Holiday' },
  bereavement: { label: 'Bereavement Leave', shortLabel: 'Bereav.', description: 'Bereavement' }
}

export function getLeaveEnumFromLabel(label: string): LeaveType | null {
  const entry = Object.entries(LEAVE_TYPE_CONFIGS).find(
    ([_, config]) => config.label === label || config.shortLabel === label
  )
  return (entry?.[0] as LeaveType) || null
}
```

Then in Schedule.tsx, replace the hardcoded legend with:
```typescript
{Object.entries(LEAVE_TYPE_CONFIGS).map(([type, config]) => (
  <div key={type} className="flex items-center gap-2">
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${LEAVE_COLORS[type as LeaveType]}`}>
      {config.shortLabel}
    </span>
    <span className="text-sm text-gray-600">{config.description}</span>
  </div>
))}
```

Also remove the `labelToLeaveTypeEnum` object entirely and replace all usages with `getLeaveEnumFromLabel()`.

### 4. Fix modal accessibility
**Issue:** Modal doesn't trap focus, allow escape key, or prevent background scroll. Screen readers won't recognize it as a modal dialog.

**Current Code:**
```typescript
{editingShift && (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {editingShift.existingLeave ? 'Edit Leave/Shift' : editingShift.shiftId ? 'Edit Shift' : 'Add Shift/Leave'}
      </h3>
      {/* ... rest of modal */}
    </div>
  </div>
)}
```

**Fix:** Enhance the modal with proper accessibility attributes and keyboard handling:
```typescript
{editingShift && (
  <>
    {/* Backdrop with click handler */}
    <div
      className="fixed inset-0 bg-gray-500 bg-opacity-75 z-40"
      onClick={() => setEditingShift(null)}
      aria-hidden="true"
    />
    {/* Modal dialog */}
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-modal-title"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setEditingShift(null)
        }}
      >
        <h3 id="shift-modal-title" className="text-lg font-medium text-gray-900 mb-4">
          {editingShift.existingLeave ? 'Edit Leave/Shift' : editingShift.shiftId ? 'Edit Shift' : 'Add Shift/Leave'}
        </h3>
        {/* ... rest of modal */}
      </div>
    </div>
  </>
)}
```

Also add this useEffect to prevent background scroll and trap focus:
```typescript
useEffect(() => {
  if (!editingShift) return

  // Prevent background scrolling
  const originalOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  return () => {
    document.body.style.overflow = originalOverflow
  }
}, [editingShift])
```

### 5. Create proper selection state type instead of using 'as any'
**Issue:** Using `setSelectedShiftType(null as any)` is a type safety hack that masks real typing issues and makes code harder to maintain.

**Current Code:**
```typescript
const [selectedShiftType, setSelectedShiftType] = useState<ShiftType>('AM')
const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(null)

// Later in code:
onClick={() => { setSelectedLeaveType(leaveType.label); setSelectedShiftType(null as any); }}
```

**Fix:** Create a proper union type that represents the actual state:
```typescript
type ScheduleSelection = 
  | { type: 'shift'; value: ShiftType }
  | { type: 'leave'; value: string }
  | null

const [selection, setSelection] = useState<ScheduleSelection>(null)

// Usage becomes clear and type-safe:
const selectShift = (shiftType: ShiftType) => {
  setSelection({ type: 'shift', value: shiftType })
}

const selectLeave = (leaveLabel: string) => {
  setSelection({ type: 'leave', value: leaveLabel })
}

const clearSelection = () => {
  setSelection(null)
}

// In modal:
{selection?.type === 'shift' && <ShiftOptions selectedValue={selection.value} />}
{selection?.type === 'leave' && <LeaveOptions selectedValue={selection.value} />}
```

## Priority 2 (High - Important Improvements)

### 6. Extract modal into <ShiftEditModal /> component
**Issue:** The shift editing modal takes up ~150 lines of complex logic inside the main component, making Schedule.tsx harder to read and test.

**Fix:** Create new file `src/components/ShiftEditModal.tsx`:
```typescript
import { useEffect } from 'react'
import { format } from 'date-fns'
import { ShiftType, LeaveRequest, LeaveTypeConfig } from '../types'
import { SHIFT_COLORS, SHIFT_LABELS, LEAVE_COLORS, LEAVE_TYPE_CONFIGS } from '../lib/designSystem'

interface ShiftEditModalProps {
  isOpen: boolean
  date: string
  existingShift: { id: string } | null
  existingLeave: LeaveRequest | null
  onClose: () => void
  onSave: (shiftType: ShiftType | null, leaveType: string | null) => Promise<void>
  onDelete: () => Promise<void>
  leaveTypes: LeaveTypeConfig[]
  loadingLeaveTypes: boolean
  selectedShiftType: ShiftType | null
  selectedLeaveType: string | null
  onShiftTypeChange: (type: ShiftType) => void
  onLeaveTypeChange: (type: string | null) => void
  isSaving: boolean
}

export default function ShiftEditModal({
  isOpen,
  date,
  existingShift,
  existingLeave,
  onClose,
  onSave,
  onDelete,
  leaveTypes,
  loadingLeaveTypes,
  selectedShiftType,
  selectedLeaveType,
  onShiftTypeChange,
  onLeaveTypeChange,
  isSaving,
}: ShiftEditModalProps) {
  // Add escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center z-50" role="presentation">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shift-modal-title"
        >
          <h3 id="shift-modal-title" className="text-lg font-medium text-gray-900 mb-4">
            {existingLeave ? 'Edit Leave/Shift' : existingShift ? 'Edit Shift' : 'Add Shift/Leave'}
          </h3>

          {/* ... modal content here - move all shift/leave selection UI from Schedule.tsx */}

          <div className="mt-6 flex justify-between">
            {(existingShift || existingLeave) && (
              <button onClick={onDelete} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50">
                Delete
              </button>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                Cancel
              </button>
              <button onClick={() => onSave(selectedShiftType, selectedLeaveType)} disabled={isSaving} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
```

Then in Schedule.tsx, replace the entire modal JSX (lines ~950-1050) with:
```typescript
<ShiftEditModal
  isOpen={!!editingShift}
  date={editingShift?.date || ''}
  existingShift={editingShift?.shiftId ? { id: editingShift.shiftId } : null}
  existingLeave={editingShift?.existingLeave || null}
  onClose={() => setEditingShift(null)}
  onSave={saveShift}
  onDelete={deleteShift}
  leaveTypes={leaveTypes}
  loadingLeaveTypes={loadingLeaveTypes}
  selectedShiftType={selectedShiftType}
  selectedLeaveType={selectedLeaveType}
  onShiftTypeChange={setSelectedShiftType}
  onLeaveTypeChange={setSelectedLeaveType}
  isSaving={savingShift}
/>
```

### 7. Extract leave types tab into <LeaveTypesTab /> component
**Issue:** The leave types management section takes up ~200 lines and should be isolated for better maintainability.

**Fix:** Create new file `src/components/LeaveTypesTab.tsx` with all the leave type management UI and logic. This cleans up Schedule.tsx significantly.

### 8. Use React Query hooks instead of raw Supabase calls
**Issue:** Currently using raw Supabase queries directly in fetchScheduleData(). Should leverage React Query for consistency with other parts of the codebase.

**Current Code:**
```typescript
const shiftsQuery = supabase
  .from('shifts')
  .select('*, users!inner(role)')
  .gte('date', startDate)
  .lte('date', endDate)
```

**Fix:** Create custom hooks in `src/hooks/useScheduleData.ts`:
```typescript
import { useQuery } from '@tanstack/react-query'
import { shiftsService, leaveRequestsService, authService } from '../services'

export function useScheduleShifts(startDate: string, endDate: string, userRole: string) {
  return useQuery({
    queryKey: ['shifts', startDate, endDate, userRole],
    queryFn: async () => {
      let shiftsQuery = supabase
        .from('shifts')
        .select('*, users!inner(role)')
        .gte('date', startDate)
        .lte('date', endDate)

      if (userRole === 'agent') {
        shiftsQuery = shiftsQuery.eq('users.role', 'agent')
      }

      const { data, error } = await shiftsQuery
      if (error) throw error
      return data
    }
  })
}

export function useScheduleLeaves(startDate: string, endDate: string, userRole: string) {
  return useQuery({
    queryKey: ['leaves', startDate, endDate, userRole],
    queryFn: async () => {
      let leavesQuery = supabase
        .from('leave_requests')
        .select('*, users!inner(role)')
        .eq('status', 'approved')
        .lte('start_date', endDate)
        .gte('end_date', startDate)

      if (userRole === 'agent') {
        leavesQuery = leavesQuery.eq('users.role', 'agent')
      }

      const { data, error } = await leavesQuery
      if (error) throw error
      return data
    }
  })
}

export function useScheduleUsers(userRole: string) {
  return useQuery({
    queryKey: ['users', userRole],
    queryFn: async () => {
      let usersQuery = supabase.from('users').select('*')
      
      if (userRole === 'agent') {
        usersQuery = usersQuery.eq('role', 'agent')
      }

      const { data, error } = await usersQuery.order('name')
      if (error) throw error
      return data
    }
  })
}
```

Then use in Schedule.tsx:
```typescript
const { data: users = [], isLoading: usersLoading } = useScheduleUsers(user?.role || 'agent')
const { data: shifts = [], isLoading: shiftsLoading } = useScheduleShifts(
  formatDateISO(monthStart),
  formatDateISO(monthEnd),
  user?.role || 'agent'
)
const { data: approvedLeaves = [], isLoading: leavesLoading } = useScheduleLeaves(
  formatDateISO(monthStart),
  formatDateISO(monthEnd),
  user?.role || 'agent'
)

const isLoading = usersLoading || shiftsLoading || leavesLoading
```

### 9. Split into multiple components
**Issue:** Schedule.tsx is 480+ lines. Should be broken into smaller, focused components.

**Suggested structure:**
```
src/pages/
├── Schedule/
│   ├── Schedule.tsx (main orchestrator ~150 lines)
│   ├── ScheduleTable.tsx (calendar grid ~200 lines)
│   ├── MonthNavigation.tsx (month prev/next ~50 lines)
│   ├── ScheduleLegend.tsx (legend display ~50 lines)
│   └── useScheduleLogic.ts (shared logic)

src/components/
├── ShiftEditModal.tsx (already extracted)
└── LeaveTypesTab.tsx (already extracted)
```

Create `src/pages/Schedule/ScheduleTable.tsx`:
```typescript
interface ScheduleTableProps {
  daysInMonth: Date[]
  filteredUsers: User[]
  canEdit: boolean
  shifts: ShiftWithSwap[]
  approvedLeaves: LeaveRequest[]
  swappedUserNames: Record<string, string>
  onShiftClick: (userId: string, date: Date) => void
}

export default function ScheduleTable({
  daysInMonth,
  filteredUsers,
  canEdit,
  shifts,
  approvedLeaves,
  swappedUserNames,
  onShiftClick,
}: ScheduleTableProps) {
  // Move all table rendering logic here
}
```

## Priority 3 (Nice to Have)

### 10. Consider state management (useReducer for complex modal logic)
**Issue:** Multiple state variables for the edit modal (`editingShift`, `selectedShiftType`, `selectedLeaveType`, `savingShift`) make the logic hard to follow.

**Fix:** Use useReducer to manage modal state:
```typescript
interface ModalState {
  isOpen: boolean
  userId: string | null
  date: string | null
  shiftId: string | null
  existingLeave: LeaveRequest | null
  selectedShiftType: ShiftType
  selectedLeaveType: string | null
  isSaving: boolean
  error: string | null
}

type ModalAction =
  | { type: 'OPEN_MODAL'; payload: { userId: string; date: string; shiftId?: string; existingLeave?: LeaveRequest | null } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_SHIFT_TYPE'; payload: ShiftType }
  | { type: 'SET_LEAVE_TYPE'; payload: string | null }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' }

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        isOpen: true,
        userId: action.payload.userId,
        date: action.payload.date,
        shiftId: action.payload.shiftId || null,
        existingLeave: action.payload.existingLeave || null
      }
    case 'CLOSE_MODAL':
      return { ...state, isOpen: false }
    case 'SET_SHIFT_TYPE':
      return { ...state, selectedShiftType: action.payload, selectedLeaveType: null }
    case 'SET_LEAVE_TYPE':
      return { ...state, selectedLeaveType: action.payload, selectedShiftType: null as any }
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'RESET':
      return { ...state, isOpen: false, error: null }
    default:
      return state
  }
}

const [modalState, dispatch] = useReducer(modalReducer, initialModalState)
```

### 11. Create custom hooks for all data fetching
**Issue:** All fetching is done in fetchScheduleData() which mixes concerns and makes testing harder.

**Fix:** Already covered in Priority 2 item #8. Create separate hooks for users, shifts, and leaves.

---

# 2. LeaveRequests.tsx

## Priority 1 (Critical - Fix First)

### 1. Fix type casting ('as any')
**Issue:** Using `(request as any).users?.name` indicates a mismatch between the interface and actual data structure. This masks real typing problems.

**Current Code (Line ~30):**
```typescript
interface LeaveRequestWithUser extends LeaveRequest {
  user: User
}

// Later in code (Line ~90):
{(request as any).users?.name || 'Unknown'}
```

**Problem:** The interface says `user` (singular) but code accesses `users` (plural).

**Fix:** Ensure consistency between interface and data fetching. Either:
```typescript
// Option A: Fix the interface to match actual API response
interface LeaveRequestWithUser extends LeaveRequest {
  users: User  // Match actual response field name
}
// Then use:
{request.users?.name || 'Unknown'}

// OR Option B: Transform the response to match interface
const requestsData = await leaveRequestsService.getLeaveRequests()
const transformedRequests = requestsData.map(r => ({
  ...r,
  user: r.users  // Normalize the field name
}))
setRequests(transformedRequests)
```

### 2. Add proper error handling (currently silent failures)
**Issue:** Errors are only logged to console. Users won't know something failed.

**Current Code (Line ~45-50):**
```typescript
catch (error) {
  console.error('Error fetching leave requests:', error)  // ❌ Silent failure
} finally {
  setLoading(false)
}
```

**Fix:** Use the existing toast/error handling system:
```typescript
import { handleDatabaseError } from '../lib/errorHandler'

catch (error) {
  handleDatabaseError(error, 'fetch leave requests')
  setRequests([])
  // Optionally show toast:
  // toast.error('Failed to load leave requests. Please try again.')
} finally {
  setLoading(false)
}
```

### 3. Handle unauthenticated state properly
**Issue:** If `user` is null, `fetchRequests` returns silently and page shows empty state without indicating the problem.

**Current Code (Line ~34):**
```typescript
const fetchRequests = useCallback(async () => {
  if (!user) return  // Returns undefined, loading stays true
```

**Fix:** Set appropriate state when user is not available:
```typescript
const fetchRequests = useCallback(async () => {
  if (!user) {
    setRequests([])
    setLoading(false)
    return
  }
  // ... rest of function
}, [user, isManager, startDate, endDate, leaveType])
```

### 4. Improve filter dependencies - separate data fetching from filtering
**Issue:** Having `startDate, endDate, leaveType` in the dependency array causes a full refetch every time a filter changes. For large datasets, this is inefficient.

**Current Code (Line ~48-50):**
```typescript
const fetchRequests = useCallback(async () => {
  // ... fetch all data
  let filteredRequests = requests
  if (startDate) {
    filteredRequests = filteredRequests.filter(r => r.start_date >= startDate)
  }
  // ...
}, [user, isManager, startDate, endDate, leaveType])  // ❌ Refetch on every filter change
```

**Fix:** Separate fetching from filtering:
```typescript
// Fetch data only when user or role changes
const fetchRequests = useCallback(async () => {
  if (!user) {
    setRequests([])
    setLoading(false)
    return
  }
  setLoading(true)

  try {
    const requests = isManager
      ? await leaveRequestsService.getLeaveRequests()
      : await leaveRequestsService.getUserLeaveRequests(user.id)

    // Store unfiltered data
    setAllRequests(requests)
    setLoading(false)
  } catch (error) {
    handleDatabaseError(error, 'fetch leave requests')
    setLoading(false)
  }
}, [user, isManager])  // ✅ Only fetch when user/role changes

// Apply filters in a separate effect
useEffect(() => {
  let filtered = allRequests

  if (startDate) {
    filtered = filtered.filter(r => r.start_date >= startDate)
  }
  if (endDate) {
    filtered = filtered.filter(r => r.end_date <= endDate)
  }
  if (leaveType !== 'all') {
    filtered = filtered.filter(r => r.leave_type === leaveType)
  }

  // Sort if manager
  if (isManager) {
    filtered = [...filtered].sort((a, b) => {
      const aPending = a.status.startsWith('pending')
      const bPending = b.status.startsWith('pending')
      if (aPending && !bPending) return -1
      if (!aPending && bPending) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  setRequests(filtered)
}, [allRequests, startDate, endDate, leaveType, isManager])
```

### 5. Fix date comparison - use proper Date objects instead of string comparison
**Issue:** String comparison works for ISO dates but is fragile and semantically incorrect.

**Current Code (Line ~50-55):**
```typescript
if (startDate) {
  filteredRequests = filteredRequests.filter(r => r.start_date >= startDate)  // ❌ String comparison
}
if (endDate) {
  filteredRequests = filteredRequests.filter(r => r.end_date <= endDate)
}
```

**Fix:** Use proper date objects:
```typescript
import { parseISO, isBefore, isAfter } from 'date-fns'

if (startDate) {
  const filterDate = parseISO(startDate)
  filtered = filtered.filter(r => isAfter(parseISO(r.start_date), filterDate))
}
if (endDate) {
  const filterDate = parseISO(endDate)
  filtered = filtered.filter(r => isBefore(parseISO(r.end_date), filterDate))
}
```

## Priority 2 (High - Important)

### 6. Use React Query hooks instead of raw Supabase calls
**Issue:** Inconsistent with Schedule.tsx and other pages. Should use React Query for consistency and better caching.

**Fix:** Create `src/hooks/useLeaveRequests.ts`:
```typescript
import { useQuery } from '@tanstack/react-query'
import { leaveRequestsService } from '../services'
import { useAuth } from './useAuth'

export function useLeaveRequestsList() {
  const { user } = useAuth()
  const isManager = user?.role === 'tl' || user?.role === 'wfm'

  return useQuery({
    queryKey: ['leaveRequests', user?.id, isManager],
    queryFn: async () => {
      if (!user) return []

      if (isManager) {
        return await leaveRequestsService.getLeaveRequests()
      } else {
        return await leaveRequestsService.getUserLeaveRequests(user.id)
      }
    },
    enabled: !!user
  })
}
```

Then simplify LeaveRequests.tsx:
```typescript
const { data: allRequests = [], isLoading, error } = useLeaveRequestsList()

// ... apply filtering as shown in Priority 1 item #4
```

### 7. Implement server-side filtering instead of client-side
**Issue:** Fetching all requests then filtering client-side is inefficient for large datasets.

**Fix:** Update `leaveRequestsService` to accept filter parameters:
```typescript
// In leaveRequestsService:
export async function getLeaveRequests(filters?: {
  startDate?: string
  endDate?: string
  leaveType?: string
}) {
  let query = supabase
    .from('leave_requests')
    .select('*, users!inner(role)')
    .eq('status', 'approved')

  if (filters?.startDate) {
    query = query.gte('start_date', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte('end_date', filters.endDate)
  }
  if (filters?.leaveType && filters.leaveType !== 'all') {
    query = query.eq('leave_type', filters.leaveType)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// In hook:
export function useLeaveRequestsList(filters?: {
  startDate?: string
  endDate?: string
  leaveType?: string
}) {
  const { user } = useAuth()
  const isManager = user?.role === 'tl' || user?.role === 'wfm'

  return useQuery({
    queryKey: ['leaveRequests', user?.id, isManager, filters],
    queryFn: async () => {
      if (!user) return []
      return isManager
        ? await leaveRequestsService.getLeaveRequests(filters)
        : await leaveRequestsService.getUserLeaveRequests(user.id, filters)
    },
    enabled: !!user
  })
}
```

### 8. Add keyboard navigation to request cards
**Issue:** Clickable request cards don't support keyboard navigation (should support Enter/Space keys).

**Current Code (Line ~95):**
```typescript
<div
  key={request.id}
  onClick={() => navigate(`${ROUTES.LEAVE_REQUESTS}/${request.id}`)}
  className="p-4 hover:bg-gray-50 cursor-pointer"
>
```

**Fix:** Add proper keyboard support:
```typescript
<div
  key={request.id}
  onClick={() => navigate(`${ROUTES.LEAVE_REQUESTS}/${request.id}`)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`${ROUTES.LEAVE_REQUESTS}/${request.id}`)
    }
  }}
  role="button"
  tabIndex={0}
  aria-label={`Leave request for ${request.user?.name || 'Unknown'} - ${request.leave_type} from ${formatDate(request.start_date)} to ${formatDate(request.end_date)}`}
  className="p-4 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
>
```

## Priority 3 (Nice to Have)

### 9. Add pagination or infinite scroll
**Issue:** Loading all requests at once won't scale. Should limit initial load.

**Fix:** Add pagination support to service and component:
```typescript
interface PaginationParams {
  page: number
  pageSize: number
}

export async function getLeaveRequests(filters?: {...}, pagination?: PaginationParams) {
  let query = supabase
    .from('leave_requests')
    .select('*, users!inner(role)', { count: 'exact' })
    // ... apply filters

  if (pagination) {
    const { page, pageSize } = pagination
    query = query.range(page * pageSize, (page + 1) * pageSize - 1)
  }

  const { data, count, error } = await query
  return { data, totalCount: count || 0 }
}
```

### 10. Add loading state for filter changes
**Issue:** When filters change with server-side filtering, there's no indication data is being refetched.

**Fix:** Track loading state from React Query:
```typescript
const { data: allRequests = [], isLoading, isFetching, error } = useLeaveRequestsList({
  startDate,
  endDate,
  leaveType
})

// Show subtle loading indicator when isFetching
{isFetching && <div className="text-xs text-gray-400">Updating...</div>}
```

---

# 3. SwapRequests.tsx

## Priority 1 (Critical - Fix First)

### 1. Fix type casting mismatch
**Issue:** Same issue as LeaveRequests - interface vs actual data mismatch.

**Current Code (Line ~85-90):**
```typescript
interface SwapRequestWithUsers extends SwapRequest {
  requester: User
  target_user: User
}

// Later:
{(request as any).requester?.name || 'Unknown'}
{(request as any).target?.name || 'Unknown'}
{(request as any).requester?.email || 'N/A'}
```

**Problem:** Accessing `requester` and `target_user` (correct) but also accessing `target` (wrong) and `requester.email` (which may not exist).

**Fix:** Verify exact field names from API response and ensure consistency:
```typescript
interface SwapRequestWithUsers extends SwapRequest {
  requester: User
  target_user: User
}

// Remove 'as any' casts:
{request.requester?.name || 'Unknown'}
{request.target_user?.name || 'Unknown'}  // Note: target_user, not target
{request.requester?.email || 'N/A'}
```

### 2. Add error handling with toast notifications
**Issue:** Errors are silently logged to console.

**Fix:** Same as LeaveRequests Priority 1 item #2:
```typescript
import { handleDatabaseError } from '../lib/errorHandler'

catch (error) {
  handleDatabaseError(error, 'fetch swap requests')
  setRequests([])
} finally {
  setLoading(false)
}
```

### 3. Fix date range filtering logic
**Issue:** The endDate filter uses string concatenation which is fragile.

**Current Code (Line ~56-60):**
```typescript
if (endDate) {
  filteredRequests = filteredRequests.filter(r => r.created_at <= endDate + 'T23:59:59')  // ❌ Fragile
}
```

**Fix:** Use proper date handling:
```typescript
import { parseISO, endOfDay } from 'date-fns'

if (endDate) {
  const endDateTime = endOfDay(parseISO(endDate)).toISOString()
  filteredRequests = filteredRequests.filter(r => r.created_at <= endDateTime)
}
```

### 4. Separate data fetching from filtering (same as LeaveRequests)
**Issue:** Filter changes trigger full refetches instead of filtering in-memory data.

**Fix:** Apply same solution as LeaveRequests Priority 1 item #4 - separate `fetchRequests` from filter application in useEffect.

## Priority 2 (High)

### 5. Add keyboard navigation to swap request cards
**Issue:** No keyboard support for clickable rows.

**Fix:** Same as LeaveRequests Priority 2 item #8:
```typescript
<div
  key={request.id}
  onClick={() => navigate(`${ROUTES.SWAP_REQUESTS}/${request.id}`)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`${ROUTES.SWAP_REQUESTS}/${request.id}`)
    }
  }}
  role="button"
  tabIndex={0}
  aria-label={`Swap request from ${request.requester?.name} to ${request.target_user?.name}`}
  className="p-4 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
>
```

### 6. Add accessible arrow icon
**Issue:** The swap arrow SVG doesn't have accessibility attributes.

**Current Code (Line ~100):**
```typescript
<svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
</svg>
```

**Fix:** Add `aria-hidden` since it's purely decorative:
```typescript
<svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
</svg>
```

### 7. Use React Query hooks
**Fix:** Create `src/hooks/useSwapRequests.ts` following same pattern as useLeaveRequests.

### 8. Implement server-side filtering
**Fix:** Same approach as LeaveRequests - move filter logic to service layer.

---

# 4. LeaveRequestDetail.tsx

## Priority 1 (Critical - Fix First)

### 1. Fix type casting in comments section
**Issue:** Same `as any` problem as other pages.

**Current Code (Line ~220):**
```typescript
{comment.is_system ? 'System' : (comment as any).users?.name || 'Unknown User'}
```

**Fix:** Ensure interface matches actual data:
```typescript
interface CommentWithSystem extends Comment {
  is_system?: boolean
  user?: User  // Ensure this matches API response field name
}

// Then use without casting:
{comment.is_system ? 'System' : comment.user?.name || 'Unknown User'}
```

### 2. Extract overly complex timeline logic into helper functions
**Issue:** The approval timeline has deeply nested ternary operators (lines ~170-210) that are hard to read and maintain.

**Current Code:**
```typescript
className={`w-8 h-8 rounded-full flex items-center justify-center ${
  request.status === 'rejected' ? 'bg-red-100 text-red-600' :
  request.tl_approved_at ? 'bg-green-100 text-green-600' :
  request.status === 'pending_tl' ? 'bg-yellow-100 text-yellow-600' :
  'bg-gray-100 text-gray-400'
}`}
```

**Fix:** Create helper functions at top of component:
```typescript
type ApprovalState = 'approved' | 'rejected' | 'pending' | 'not_started'

function getTLApprovalState(request: LeaveRequest): {
  state: ApprovalState
  label: string
  color: string
  icon: 'check' | 'x' | 'clock' | null
} {
  if (request.status === 'rejected' && !request.tl_approved_at) {
    return { state: 'rejected', label: 'Rejected by TL', color: 'bg-red-100 text-red-600', icon: 'x' }
  }
  if (request.tl_approved_at) {
    return { state: 'approved', label: 'TL Approved', color: 'bg-green-100 text-green-600', icon: 'check' }
  }
  if (request.status === 'pending_tl') {
    return { state: 'pending', label: 'Awaiting TL Approval', color: 'bg-yellow-100 text-yellow-600', icon: 'clock' }
  }
  return { state: 'not_started', label: 'TL Approval', color: 'bg-gray-100 text-gray-400', icon: null }
}

function getWFMApprovalState(request: LeaveRequest): {
  state: ApprovalState
  label: string
  color: string
  icon: 'check' | 'x' | 'clock' | null
} {
  // Similar logic for WFM approval
}

// Then use:
const tlState = getTLApprovalState(request)
<div className={`w-8 h-8 rounded-full flex items-center justify-center ${tlState.color}`}>
  {tlState.icon === 'check' && <CheckIcon />}
  {tlState.icon === 'x' && <XIcon />}
  {tlState.icon === 'clock' && <ClockIcon />}
</div>
<p className="font-medium text-gray-900">{tlState.label}</p>
```

### 3. Parallelize initial data fetching
**Issue:** Makes 3 sequential API calls (request, user, comments) that could be done in parallel.

**Current Code (Line ~55-65):**
```typescript
async function fetchRequestDetails() {
  try {
    const requestData = await leaveRequestsService.getLeaveRequestById(id!)  // Wait 1
    setRequest(requestData)

    const userData = await authService.getUserProfile(requestData.user_id)  // Wait 2
    setRequester(userData)

    await fetchComments()  // Wait 3
  } catch (err) {
    // ...
  }
}
```

**Fix:** Fetch in parallel:
```typescript
async function fetchRequestDetails() {
  try {
    const requestData = await leaveRequestsService.getLeaveRequestById(id!)
    setRequest(requestData)

    // Fetch user and comments in parallel
    const [userData, commentsData] = await Promise.all([
      authService.getUserProfile(requestData.user_id),
      commentsService.getComments(id!, 'leave')
    ])

    setRequester(userData)
    setComments(commentsData as CommentWithSystem[])
  } catch (err) {
    handleDatabaseError(err, 'fetch request details')
    setError(ERROR_MESSAGES.NOT_FOUND)
  } finally {
    setLoading(false)
  }
}
```

### 4. Add null safety checks for optional fields
**Issue:** If timestamps are ever undefined, timeline breaks without warning.

**Current Code (Line ~148):**
```typescript
<p className="text-sm text-gray-500">
  Created on {formatDateTime(request.created_at)}  // Could crash if undefined
</p>
```

**Fix:** Add guards:
```typescript
{request.created_at && (
  <p className="text-sm text-gray-500">
    Created on {formatDateTime(request.created_at)}
  </p>
)}
```

## Priority 2 (High)

### 5. Extract approval timeline into separate component
**Issue:** The timeline section (lines ~140-220) is complex and takes up significant space.

**Fix:** Create `src/components/LeaveApprovalTimeline.tsx`:
```typescript
interface LeaveApprovalTimelineProps {
  request: LeaveRequest
}

export default function LeaveApprovalTimeline({ request }: LeaveApprovalTimelineProps) {
  // Move all timeline rendering here
}
```

### 6. Extract comments section into separate component
**Issue:** Comments UI (lines ~225-260) could be reusable.

**Fix:** Create `src/components/CommentsSection.tsx`:
```typescript
interface CommentsSectionProps {
  comments: CommentWithSystem[]
  newComment: string
  onNewCommentChange: (text: string) => void
  onAddComment: () => void
  isSubmitting: boolean
}

export default function CommentsSection({
  comments,
  newComment,
  onNewCommentChange,
  onAddComment,
  isSubmitting
}: CommentsSectionProps) {
  // Move all comments UI here
}
```

### 7. Extract action buttons into separate component
**Issue:** Action buttons logic (lines ~130-138) is duplicated with SwapRequestDetail.

**Fix:** Create `src/components/LeaveRequestActions.tsx`:
```typescript
interface LeaveRequestActionsProps {
  canApprove: boolean
  canReject: boolean
  canAskForException: boolean
  onApprove: () => Promise<void>
  onReject: () => Promise<void>
  onAskForException: () => Promise<void>
  isSubmitting: boolean
}

export default function LeaveRequestActions({
  canApprove,
  canReject,
  canAskForException,
  onApprove,
  onReject,
  onAskForException,
  isSubmitting
}: LeaveRequestActionsProps) {
  // Move all action buttons here
}
```

### 8. Add keyboard shortcuts
**Issue:** No keyboard shortcuts for common actions like Approve/Reject.

**Fix:** Add Shift+Enter to approve, Shift+R to reject:
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (!canApprove() && !canReject()) return

    if (e.shiftKey && e.key === 'Enter' && canApprove()) {
      e.preventDefault()
      handleApprove()
    }
    if (e.shiftKey && e.key === 'R' && canReject()) {
      e.preventDefault()
      handleReject()
    }
  }

  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [canApprove, canReject, handleApprove, handleReject])
```

## Priority 3 (Nice to Have)

### 9. Add loading skeleton for timeline
**Issue:** Timeline skeleton is generic. Could be more specific.

**Fix:** Create dedicated skeleton for approval timeline.

### 10. Add auto-refresh capability
**Issue:** If another user approves, requester won't see update without refresh.

**Fix:** Add polling or WebSocket subscription to refresh data periodically:
```typescript
useEffect(() => {
  if (!id || request?.status === 'approved' || request?.status === 'rejected') return

  const interval = setInterval(() => {
    fetchRequestDetails()
  }, 30000) // Refresh every 30 seconds

  return () => clearInterval(interval)
}, [id, request?.status])
```

---

# 5. SwapRequestDetail.tsx

## Priority 1 (Critical - MUST FIX)

### 1. **CRITICAL: Fix swap execution logic - add transaction handling**
**Issue:** When approving swap, updates 4 shifts sequentially with no rollback if one fails. Can result in inconsistent shift data.

**Current Code (Line ~180-210):**
```typescript
// Update 1: Agent X on requester date
await shiftsService.updateShift(requesterShift.id, { shift_type: targetShiftTypeOnReqDate })

// Update 2: Agent Y on requester date
if (targetOnRequesterDate) {
  await shiftsService.updateShift(targetOnRequesterDate.id, { shift_type: requesterShiftTypeOnReqDate })
}
// ... etc - if any update fails, previous ones are committed
```

**Risk:** If update #3 fails, updates #1-2 are already committed, leaving shifts in corrupted state.

**Fix:** Create atomic swap operation in service layer:
```typescript
// In shiftsService, add:
export async function executeSwap(swapData: {
  requesterShiftId: string
  targetShiftId: string
  requesterOnTargetDate: string
  targetOnRequesterDate: string
  requesterShiftType: ShiftType
  targetShiftType: ShiftType
  requesterShiftTypeOnTargetDate: ShiftType
  targetShiftTypeOnRequesterDate: ShiftType
}) {
  // Use database transaction (or implement at DB level in Supabase)
  try {
    const updates = [
      supabase.from('shifts').update({ shift_type: swapData.targetShiftTypeOnRequesterDate }).eq('id', swapData.requesterShiftId),
      supabase.from('shifts').update({ shift_type: swapData.requesterShiftType }).eq('id', swapData.requesterOnTargetDate),
      supabase.from('shifts').update({ shift_type: swapData.targetShiftType }).eq('id', swapData.targetOnRequesterDate),
      supabase.from('shifts').update({ shift_type: swapData.requesterShiftTypeOnTargetDate }).eq('id', swapData.targetShiftId),
    ]

    const results = await Promise.all(updates)
    
    // Check all succeeded
    if (results.some(r => r.error)) {
      throw new Error('Some shift updates failed')
    }

    return results
  } catch (error) {
    // All-or-nothing: if any fails, all fail
    throw error
  }
}
```

Then use:
```typescript
await shiftsService.executeSwap({
  requesterShiftId: requesterShift.id,
  targetShiftId: targetShift.id,
  // ... pass all needed shift data
})
```

### 2. **CRITICAL: Store shift IDs instead of refetching on revoke**
**Issue:** When revoking, refetches all shifts by date (could return hundreds) and finds shifts by user_id, which is inefficient and fragile. What if a shift was deleted?

**Current Code (Line ~270-285):**
```typescript
const targetOnRequesterDateShifts = await shiftsService.getShifts(requesterDate, requesterDate)
const targetOnRequesterDate = targetOnRequesterDateShifts.find(s => s.user_id === targetUserId)  // Fragile!

if (targetOnRequesterDate) {
  await shiftsService.updateShift(targetOnRequesterDate.id, { shift_type: ... })
}
```

**Fix:** Store all 4 shift IDs in swap_request when creating (or when first approved):
```typescript
// Database schema addition needed:
// ALTER TABLE swap_requests ADD COLUMN requester_shift_id_1 UUID;
// ALTER TABLE swap_requests ADD COLUMN requester_shift_id_2 UUID;
// ALTER TABLE swap_requests ADD COLUMN target_shift_id_1 UUID;
// ALTER TABLE swap_requests ADD COLUMN target_shift_id_2 UUID;

// When swap is first created, store:
await supabase.from('swap_requests').update({
  requester_shift_id_1: requesterShift.id,
  requester_shift_id_2: requesterOnTargetDate.id,
  target_shift_id_1: targetOnRequesterDate.id,
  target_shift_id_2: targetShift.id
}).eq('id', id)

// On revoke, just use stored IDs:
await Promise.all([
  shiftsService.updateShift(request.requester_shift_id_1, { shift_type: request.requester_original_shift_type }),
  shiftsService.updateShift(request.requester_shift_id_2, { shift_type: request.requester_original_shift_type_on_target_date }),
  shiftsService.updateShift(request.target_shift_id_1, { shift_type: request.target_original_shift_type_on_requester_date }),
  shiftsService.updateShift(request.target_shift_id_2, { shift_type: request.target_original_shift_type }),
])
```

### 3. Fix type casting in comments
**Issue:** Same `as any` problem as other detail pages.

**Current Code (Line ~335):**
```typescript
{comment.is_system ? 'System' : (comment as any).users?.name || 'Unknown User'}
```

**Fix:** Ensure interface matches API response, remove casting.

### 4. Add race condition check before approving
**Issue:** If two WFM users approve simultaneously, shift updates could conflict.

**Current Code (Line ~130-160):**
```typescript
async function handleApprove() {
  if (!request || !user) return
  setSubmitting(true)

  try {
    // Doesn't check if already approved
    await swapRequestsService.updateSwapRequestStatus(id!, newStatus, approvalField)
```

**Fix:** Add pre-approval check:
```typescript
async function handleApprove() {
  if (!request || !user) return
  setSubmitting(true)
  setError('')

  try {
    // Check current status hasn't changed
    const currentRequest = await swapRequestsService.getSwapRequestById(id!)
    if (currentRequest.status !== request.status) {
      setError('This request status has changed. Please refresh to see updates.')
      setSubmitting(false)
      return
    }

    // ... proceed with approval
  } catch (error) {
    // ...
  }
}
```

## Priority 2 (High)

### 5. Extract timeline logic into helper functions
**Issue:** Similar to LeaveRequestDetail - deeply nested ternaries make timeline hard to read.

**Fix:** Create same helper functions as LeaveRequestDetail for determining state/color/icon.

### 6. Fix hardcoded field name clarity
**Issue:** Setting `wfm_approved_at` for auto-approve is confusing.

**Current Code (Line ~140):**
```typescript
approvalField = 'wfm_approved_at' // Mark as auto-approved
```

**Fix:** Add clearer comment:
```typescript
// Auto-approved: skip WFM and mark as if WFM approved to maintain timeline consistency
approvalField = 'wfm_approved_at'
```

Or better, use a dedicated `is_auto_approved` flag if possible:
```typescript
const { error } = await supabase.from('swap_requests')
  .update({ status: 'approved', wfm_approved_at: new Date(), is_auto_approved: true })
  .eq('id', id!)
```

### 7. Extract timeline into separate component
**Issue:** Approval timeline (lines ~250-350) is complex and duplicates LeaveRequestDetail logic.

**Fix:** Create `src/components/SwapApprovalTimeline.tsx` with similar structure as LeaveApprovalTimeline.

### 8. Extract comments section into separate component
**Fix:** Reuse or create `CommentsSection` component as done for LeaveRequestDetail.

### 9. Add null safety checks
**Issue:** If fields are undefined, timeline rendering breaks.

**Current Code (Line ~260):**
```typescript
<p className="text-sm text-gray-500">
  Created on {formatDateTime(request.created_at)}
</p>
```

**Fix:** Add guards like LeaveRequestDetail Priority 1 item #4.

## Priority 3 (Nice to Have)

### 10. Implement shift data validation before executing swap
**Issue:** No validation that shift data is still valid before executing swap (shifts might have been manually deleted).

**Fix:** Add pre-swap validation:
```typescript
async function validateShiftsExist(): Promise<boolean> {
  try {
    const [req1, req2, tgt1, tgt2] = await Promise.all([
      shiftsService.getShiftById(request.requester_shift_id_1),
      shiftsService.getShiftById(request.requester_shift_id_2),
      shiftsService.getShiftById(request.target_shift_id_1),
      shiftsService.getShiftById(request.target_shift_id_2),
    ])

    if (!req1 || !req2 || !tgt1 || !tgt2) {
      setError('One or more required shifts have been deleted. Cannot execute swap.')
      return false
    }

    return true
  } catch (error) {
    setError('Error validating shifts')
    return false
  }
}

// In handleApprove, before executeSwap:
if (!await validateShiftsExist()) return
```

### 11. Add detailed swap explanation to UI
**Issue:** Users might not understand what all 4 shifts in the swap represent.

**Fix:** Add clarification under "Swap Details" section:
```typescript
<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
  <p className="font-semibold mb-2">How this swap works:</p>
  <ul className="list-disc list-inside space-y-1">
    <li>{requester.name}'s {request.requester_original_shift_type} on {formatDate(request.requester_original_date)} ↔ {targetUser.name}'s {request.target_original_shift_type_on_requester_date}</li>
    <li>{requester.name}'s {request.requester_original_shift_type_on_target_date} on {formatDate(request.target_original_date)} ↔ {targetUser.name}'s {request.target_original_shift_type}</li>
  </ul>
</div>
```

---

## Summary by Severity

### 🔴 Critical (Fix Immediately - SwapRequestDetail)
1. Add transaction handling for 4-shift swap
2. Store shift IDs instead of refetching
3. Add race condition checks
4. Fix type casting

### 🟡 High Priority (Important for All)
1. Extract timeline logic into helpers
2. Extract components (Timeline, Comments, Actions)
3. Separate detail into smaller files
4. Add proper error handling

### 🟢 Medium Priority (Improvements)
1. Add keyboard shortcuts
2. Add null safety checks
3. Implement validation
4. Add accessibility features

### 💙 Nice to Have
1. Auto-refresh on detail pages
2. Shift data validation before operations
3. Better user explanations for complex flows
4. Loading state improvements
