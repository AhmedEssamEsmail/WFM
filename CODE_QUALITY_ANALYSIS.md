# Code Quality Analysis & Improvement Recommendations

## 🔍 Current State Analysis

### ✅ Strengths
- Clean TypeScript implementation with proper typing
- Good separation of concerns (hooks, components, pages)
- Consistent error handling patterns
- No TODO/FIXME comments (clean codebase)
- Unified design system successfully implemented

### ⚠️ Areas for Improvement

## 1. **Remove Debug Console Statements**

### Issues Found:
- **2 console.log statements** that should be removed for production:
  - `src/pages/Schedule.tsx:191` - "Leave types table not found, using defaults"
  - `src/pages/Headcount/EmployeeDirectory.tsx:223` - "Importing employees"

### Recommendation:
Replace with proper error handling or remove entirely.

```typescript
// ❌ Bad
console.log('Leave types table not found, using defaults')

// ✅ Good - Use toast notification or silent fallback
// Just use the defaults without logging
```

---

## 2. **Consolidate Error Handling**

### Issues Found:
- **50+ console.error statements** scattered across files
- Inconsistent error handling patterns
- Some errors show alerts, some show toasts, some just log

### Recommendation:
Create a centralized error handling utility:

```typescript
// src/lib/errorHandler.ts
import { useToast } from './ToastContext'

export function handleError(error: unknown, userMessage?: string) {
  console.error(error)
  
  // Log to error tracking service (e.g., Sentry)
  // logToSentry(error)
  
  // Show user-friendly message
  if (userMessage) {
    toast.error(userMessage)
  }
}
```

---

## 3. **Create Reusable Data Fetching Hooks**

### Issues Found:
- Duplicate fetch patterns across multiple pages
- Similar loading/error state management repeated everywhere
- Each page implements its own data fetching logic

### Recommendation:
Create generic data fetching hooks:

```typescript
// src/hooks/useDataFetch.ts
export function useDataFetch<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFn()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, deps)

  return { data, loading, error, refetch: () => fetchFn() }
}
```

---

## 4. **Consolidate Duplicate Code in Create Pages**

### Issues Found:
- `CreateSwapRequest.tsx` and `CreateLeaveRequest.tsx` have similar patterns:
  - Both have "submit on behalf of" logic
  - Both fetch agents
  - Both have similar form structures
  - Duplicate `canSubmitOnBehalf` logic

### Recommendation:
Create shared components and hooks:

```typescript
// src/hooks/useSubmitOnBehalf.ts
export function useSubmitOnBehalf() {
  const { user } = useAuth()
  const canSubmitOnBehalf = user?.role === 'wfm' || user?.role === 'tl'
  const [selectedUserId, setSelectedUserId] = useState(user?.id || '')
  
  return { canSubmitOnBehalf, selectedUserId, setSelectedUserId }
}

// src/components/UserSelector.tsx
export function UserSelector({ value, onChange, disabled }) {
  // Reusable user selection component
}
```

---

## 5. **Optimize Bundle Size**

### Current Build:
- **571.18 kB** (150.52 kB gzipped)
- Warning: Some chunks are larger than 500 kB

### Recommendations:

#### A. Implement Code Splitting
```typescript
// Lazy load heavy pages
const Reports = lazy(() => import('./pages/Reports'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Headcount = lazy(() => import('./pages/Headcount/EmployeeDirectory'))
```

#### B. Optimize Dependencies
- Consider replacing `date-fns` with `date-fns-tz` (smaller)
- Use tree-shaking for unused exports
- Analyze bundle with `npm run build -- --analyze`

---

## 6. **Improve Type Safety**

### Issues Found:
- Some `any` types could be more specific
- Type assertions (`as`) used in several places
- Optional chaining overused where types could be stricter

### Recommendation:
```typescript
// ❌ Avoid
const data = response.data as User[]

// ✅ Better
interface ApiResponse<T> {
  data: T
  error: Error | null
}

const response: ApiResponse<User[]> = await fetchUsers()
```

---

## 7. **Add Performance Optimizations**

### Recommendations:

#### A. Memoize Expensive Computations
```typescript
// In Schedule.tsx
const filteredUsers = useMemo(
  () => selectedUserId === 'all' ? users : users.filter(u => u.id === selectedUserId),
  [users, selectedUserId]
)
```

#### B. Debounce Search/Filter Inputs
```typescript
// For date filters in Reports, SwapRequests, LeaveRequests
const debouncedSearch = useMemo(
  () => debounce((value) => setSearchTerm(value), 300),
  []
)
```

#### C. Virtual Scrolling for Large Lists
- Consider `react-window` for Schedule table with many users
- Implement pagination for Reports page

---

## 8. **Enhance Accessibility**

### Current State: Good foundation
### Additional Improvements:

#### A. Add Skip Links
```typescript
// In Layout.tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

#### B. Improve Focus Management
- Add focus trap in modals
- Restore focus after modal closes
- Add focus indicators for all interactive elements

#### C. Add ARIA Live Regions
```typescript
// For dynamic content updates
<div role="status" aria-live="polite" aria-atomic="true">
  {successMessage}
</div>
```

---

## 9. **Add Input Validation**

### Issues Found:
- Limited client-side validation
- No validation feedback before submission
- Could prevent unnecessary API calls

### Recommendation:
Use a validation library like `zod` or `yup`:

```typescript
import { z } from 'zod'

const leaveRequestSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  leaveType: z.enum(['sick', 'annual', 'casual', 'public_holiday', 'bereavement']),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate']
})
```

---

## 10. **Improve Error Messages**

### Issues Found:
- Generic error messages: "Failed to load", "Failed to save"
- No specific guidance for users
- No retry mechanisms

### Recommendation:
```typescript
// ❌ Generic
setError('Failed to load request details')

// ✅ Specific with action
setError('Unable to load request details. Please check your connection and try again.')

// ✅ Even better - with retry
<ErrorMessage 
  message="Unable to load request details"
  onRetry={fetchRequestDetails}
/>
```

---

## 11. **Add Loading States for Better UX**

### Current: Basic spinners
### Recommendation: Use Skeleton components more consistently

```typescript
// Already created but not used everywhere
import { Skeleton } from '../components/Skeleton'

// Use in all data-loading scenarios
{loading ? (
  <Skeleton variant="table" rows={5} />
) : (
  <DataTable data={data} />
)}
```

---

## 12. **Implement Offline Support**

### Recommendation:
- Add service worker for offline functionality
- Cache static assets
- Show offline indicator
- Queue mutations when offline

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
```

---

## 13. **Add E2E Testing**

### Current: Unit tests only
### Recommendation: Add Playwright or Cypress

```typescript
// tests/e2e/swap-request.spec.ts
test('should create swap request', async ({ page }) => {
  await page.goto('/swap-requests/create')
  await page.selectOption('[name="targetUser"]', 'user-id')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

---

## 14. **Security Improvements**

### Recommendations:

#### A. Add CSRF Protection
```typescript
// Add CSRF token to forms
<input type="hidden" name="csrf_token" value={csrfToken} />
```

#### B. Sanitize User Input
```typescript
import DOMPurify from 'dompurify'

const sanitizedNotes = DOMPurify.sanitize(notes)
```

#### C. Add Rate Limiting
- Implement rate limiting for API calls
- Add debouncing for form submissions

---

## 15. **Documentation Improvements**

### Add:
- **API Documentation** - Document Supabase schema and RLS policies
- **Component Storybook** - Visual documentation for components
- **Architecture Diagram** - Show data flow and component hierarchy
- **Deployment Guide** - Step-by-step deployment instructions
- **Contributing Guide** - Guidelines for contributors

---

## 📊 Priority Matrix

### 🔴 High Priority (Do First)
1. Remove console.log statements (5 min)
2. Consolidate error handling (2 hours)
3. Add code splitting for bundle optimization (1 hour)
4. Add input validation (3 hours)

### 🟡 Medium Priority (Do Next)
5. Create reusable data fetching hooks (4 hours)
6. Consolidate duplicate code in Create pages (3 hours)
7. Add performance optimizations (memoization, debouncing) (2 hours)
8. Improve error messages with retry (2 hours)

### 🟢 Low Priority (Nice to Have)
9. Add E2E testing (8 hours)
10. Implement offline support (6 hours)
11. Add Storybook documentation (4 hours)
12. Virtual scrolling for large lists (3 hours)

---

## 🎯 Quick Wins (Can Do Now)

1. **Remove console.log** - 5 minutes
2. **Add missing Skeleton loaders** - 30 minutes
3. **Memoize filtered users in Schedule** - 10 minutes
4. **Add skip links for accessibility** - 15 minutes
5. **Update error messages to be more specific** - 1 hour

---

## 📈 Estimated Impact

| Improvement | Effort | Impact | Priority |
|------------|--------|--------|----------|
| Remove console logs | Low | Low | High |
| Error handling | Medium | High | High |
| Code splitting | Low | High | High |
| Input validation | Medium | High | High |
| Reusable hooks | High | Medium | Medium |
| E2E testing | High | High | Low |
| Offline support | High | Medium | Low |

---

## 🚀 Next Steps

1. Review this analysis with the team
2. Prioritize improvements based on business needs
3. Create tickets for each improvement
4. Implement high-priority items first
5. Set up monitoring for production issues
