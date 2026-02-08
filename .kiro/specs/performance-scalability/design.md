# Design Document: Performance & Scalability

## Overview

This design addresses five critical performance and scalability issues identified in the WFM application validation:

1. **No Pagination on List Endpoints** - All list endpoints (shifts, leave requests, swap requests, employees) load complete datasets, causing performance degradation with large data volumes
2. **No Production Error Tracking** - Errors are only logged to console with no integration to monitoring services
3. **Missing Database Indexes** - Incomplete index coverage on frequently queried columns and foreign keys
4. **No Caching Strategy** - Settings and user data refetched unnecessarily with default React Query configuration
5. **Large Bundle Size** - Incomplete code splitting and route-based lazy loading

The design implements cursor-based pagination for optimal performance, integrates Sentry for production error tracking, adds strategic database indexes, configures React Query with appropriate stale times per data type, and enhances code splitting for faster initial loads.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Application                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Route-Based Code Splitting                │ │
│  │  (Lazy loaded routes with Suspense boundaries)         │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Query Layer                         │ │
│  │  • Paginated queries with cursor management            │ │
│  │  • Differentiated stale times per data type            │ │
│  │  • Automatic cache invalidation on mutations           │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Service Layer                             │ │
│  │  • Pagination-aware service methods                    │ │
│  │  • Cursor-based query construction                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL Database                       │ │
│  │  • Composite indexes on common query patterns          │ │
│  │  • Optimized for cursor-based pagination               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Error Tracking                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Sentry Integration                    │ │
│  │  • Production error capture                            │ │
│  │  • Context enrichment (user, URL, environment)         │ │
│  │  • Performance monitoring                              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Pagination Strategy

**Cursor-Based Pagination** is chosen over offset pagination for the following reasons:

1. **Performance**: Cursor-based pagination uses indexed columns (typically `id` or `created_at`) for efficient queries, avoiding the performance degradation of OFFSET with large datasets
2. **Consistency**: Prevents duplicate or missing records when data changes between page loads
3. **Scalability**: Query performance remains constant regardless of page depth

**Implementation Pattern**:
```typescript
// Query structure
SELECT * FROM table
WHERE cursor_column > last_cursor
ORDER BY cursor_column
LIMIT page_size + 1  // Fetch one extra to determine if more pages exist
```

The extra record is used to determine `hasNextPage` and is not returned to the client.

## Components and Interfaces

### 1. Pagination Types

```typescript
// Pagination request parameters
interface PaginationParams {
  pageSize: number        // Number of records per page (default: 50)
  cursor?: string         // Cursor for next page (undefined for first page)
}

// Pagination response metadata
interface PaginationMeta {
  hasNextPage: boolean    // Whether more pages are available
  nextCursor?: string     // Cursor for fetching next page
  pageSize: number        // Number of records in current page
}

// Paginated response wrapper
interface PaginatedResponse<T> {
  data: T[]              // Array of records for current page
  meta: PaginationMeta   // Pagination metadata
}
```

### 2. Service Layer Updates

Each service method that returns lists will be updated to support pagination:

```typescript
// Example: shiftsService with pagination
interface ShiftsService {
  getShifts(
    startDate?: string,
    endDate?: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Shift>>
  
  getUserShifts(
    userId: string,
    startDate?: string,
    endDate?: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Shift>>
}

// Example: leaveRequestsService with pagination
interface LeaveRequestsService {
  getLeaveRequests(
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<LeaveRequest>>
  
  getUserLeaveRequests(
    userId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<LeaveRequest>>
  
  getPendingLeaveRequests(
    status?: LeaveRequestStatus,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<LeaveRequest>>
}

// Example: swapRequestsService with pagination
interface SwapRequestsService {
  getSwapRequests(
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<SwapRequest>>
  
  getUserSwapRequests(
    userId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<SwapRequest>>
  
  getPendingSwapRequests(
    status?: SwapRequestStatus,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<SwapRequest>>
}
```

**Implementation Details**:
- Pagination is optional (backward compatible)
- When `pagination` is undefined, return all records (existing behavior)
- Cursor is based on `created_at` timestamp for requests, `date` for shifts
- Use `id` as tiebreaker for records with same timestamp

### 3. React Query Hooks with Pagination

```typescript
// Infinite query hook for paginated data
function useInfiniteLeaveRequests() {
  return useInfiniteQuery({
    queryKey: ['leaveRequests'],
    queryFn: ({ pageParam }) => 
      leaveRequestsService.getLeaveRequests({ 
        pageSize: 50, 
        cursor: pageParam 
      }),
    getNextPageParam: (lastPage) => 
      lastPage.meta.hasNextPage ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined,
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

// Usage in component
function LeaveRequestsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteLeaveRequests()
  
  // Flatten pages into single array
  const allRequests = data?.pages.flatMap(page => page.data) ?? []
  
  // Infinite scroll or "Load More" button
  return (
    <>
      {allRequests.map(request => <RequestCard key={request.id} {...request} />)}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </>
  )
}
```

### 4. Error Tracking Integration

```typescript
// Sentry configuration
interface SentryConfig {
  dsn: string                    // Sentry project DSN
  environment: string            // 'production' | 'staging' | 'development'
  tracesSampleRate: number       // Performance monitoring sample rate (0.0 - 1.0)
  replaysSessionSampleRate: number  // Session replay sample rate
  replaysOnErrorSampleRate: number  // Error replay sample rate
}

// Enhanced error handler with Sentry
class ErrorHandler {
  private sentryInitialized: boolean = false
  
  initializeSentry(config: SentryConfig): void {
    if (config.environment === 'production') {
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay(),
        ],
        tracesSampleRate: config.tracesSampleRate,
        replaysSessionSampleRate: config.replaysSessionSampleRate,
        replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
        beforeSend(event, hint) {
          // Enrich error with context
          return event
        },
      })
      this.sentryInitialized = true
    }
  }
  
  handle(error: unknown, options: ErrorOptions = {}): string {
    // ... existing error handling logic ...
    
    // Send to Sentry in production
    if (this.sentryInitialized) {
      this.sendToSentry(error, options)
    }
    
    return errorMessage
  }
  
  private sendToSentry(error: unknown, options: ErrorOptions): void {
    // Set context
    if (options.context) {
      Sentry.setContext('custom', options.context)
    }
    
    // Capture exception
    if (error instanceof Error) {
      Sentry.captureException(error)
    } else {
      // Handle non-Error thrown values
      Sentry.captureMessage(
        typeof error === 'string' ? error : JSON.stringify(error),
        'error'
      )
    }
  }
  
  setUser(userId: string, email: string, role: string): void {
    if (this.sentryInitialized) {
      Sentry.setUser({ id: userId, email, role })
    }
  }
  
  clearUser(): void {
    if (this.sentryInitialized) {
      Sentry.setUser(null)
    }
  }
}
```

### 5. Database Index Definitions

```sql
-- Composite index for shifts queries (user_id, date)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shifts_user_date 
ON shifts(user_id, date);

-- Composite index for leave requests (user_id, status)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_requests_user_status 
ON leave_requests(user_id, status);

-- Composite index for leave requests (status, created_at) for sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_requests_status_created 
ON leave_requests(status, created_at DESC);

-- Composite index for swap requests (status, created_at) for sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_swap_requests_status_created 
ON swap_requests(status, created_at DESC);

-- Composite index for comments (request_id, request_type)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_request 
ON comments(request_id, request_type);

-- Index for users email lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users(email);

-- Composite index for leave_balances (user_id, leave_type)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_balances_user_type 
ON leave_balances(user_id, leave_type);

-- Index for swap requests requester queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_swap_requests_requester 
ON swap_requests(requester_id, created_at DESC);

-- Index for swap requests target queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_swap_requests_target 
ON swap_requests(target_user_id, created_at DESC);
```

**Index Strategy**:
- Use `CONCURRENTLY` to avoid locking tables during index creation
- Composite indexes ordered by selectivity (most selective column first)
- Include sort columns (e.g., `created_at DESC`) in composite indexes
- Avoid over-indexing (each index has maintenance cost)

### 6. React Query Cache Configuration

```typescript
// Query client with differentiated stale times
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // Default: 5 minutes
      gcTime: 1000 * 60 * 10,        // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Query-specific stale times
const STALE_TIMES = {
  USER_PROFILE: 1000 * 60 * 5,       // 5 minutes
  SETTINGS: 1000 * 60 * 10,          // 10 minutes
  SHIFTS: 1000 * 60 * 2,             // 2 minutes
  LEAVE_REQUESTS: 1000 * 60 * 1,     // 1 minute
  SWAP_REQUESTS: 1000 * 60 * 1,      // 1 minute
  COMMENTS: 1000 * 60 * 1,           // 1 minute
  LEAVE_BALANCES: 1000 * 60 * 5,     // 5 minutes
  EMPLOYEES: 1000 * 60 * 5,          // 5 minutes
}

// Example usage in hooks
function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
    staleTime: STALE_TIMES.SETTINGS,
  })
}

function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersService.getUserById(userId),
    staleTime: STALE_TIMES.USER_PROFILE,
  })
}
```

**Cache Invalidation Strategy**:
```typescript
// After creating a leave request
useMutation({
  mutationFn: leaveRequestsService.createLeaveRequest,
  onSuccess: () => {
    // Invalidate list queries
    queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
    // Invalidate user-specific queries
    queryClient.invalidateQueries({ queryKey: ['leaveRequests', 'user'] })
    // Invalidate leave balances (may have changed)
    queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
  },
})

// After updating a leave request status
useMutation({
  mutationFn: ({ id, status }) => 
    leaveRequestsService.updateLeaveRequestStatus(id, status),
  onSuccess: (data, variables) => {
    // Invalidate specific request
    queryClient.invalidateQueries({ 
      queryKey: ['leaveRequest', variables.id] 
    })
    // Invalidate list queries
    queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
  },
})
```

### 7. Route-Based Code Splitting

```typescript
// App.tsx with lazy-loaded routes
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoadingSpinner } from './components/LoadingSpinner'

// Eagerly loaded (critical path)
import Layout from './components/Layout'
import Login from './pages/Login'

// Lazy loaded routes
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Schedule = lazy(() => import('./pages/Schedule'))
const LeaveRequests = lazy(() => import('./pages/LeaveRequests'))
const LeaveRequestDetail = lazy(() => import('./pages/LeaveRequestDetail'))
const CreateLeaveRequest = lazy(() => import('./pages/CreateLeaveRequest'))
const SwapRequests = lazy(() => import('./pages/SwapRequests'))
const SwapRequestDetail = lazy(() => import('./pages/SwapRequestDetail'))
const CreateSwapRequest = lazy(() => import('./pages/CreateSwapRequest'))
const Settings = lazy(() => import('./pages/Settings'))
const LeaveBalances = lazy(() => import('./pages/LeaveBalances'))
const Reports = lazy(() => import('./pages/Reports'))
const EmployeeDirectory = lazy(() => import('./pages/Headcount/EmployeeDirectory'))
const EmployeeDetail = lazy(() => import('./pages/Headcount/EmployeeDetail'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="leave-requests" element={<LeaveRequests />} />
            <Route path="leave-requests/:id" element={<LeaveRequestDetail />} />
            <Route path="leave-requests/new" element={<CreateLeaveRequest />} />
            <Route path="swap-requests" element={<SwapRequests />} />
            <Route path="swap-requests/:id" element={<SwapRequestDetail />} />
            <Route path="swap-requests/new" element={<CreateSwapRequest />} />
            <Route path="settings" element={<Settings />} />
            <Route path="leave-balances" element={<LeaveBalances />} />
            <Route path="reports" element={<Reports />} />
            <Route path="employees" element={<EmployeeDirectory />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

### 8. Performance Monitoring

```typescript
// Performance monitoring utilities
interface PerformanceMetrics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  timeToInteractive: number
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  measurePageLoad(): PerformanceMetrics | null {
    if (!window.performance || !window.performance.timing) {
      return null
    }
    
    const timing = window.performance.timing
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    return {
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      firstContentfulPaint: this.getFCP(),
      largestContentfulPaint: this.getLCP(),
      timeToInteractive: this.getTTI(),
    }
  }
  
  private getFCP(): number {
    const entries = window.performance.getEntriesByName('first-contentful-paint')
    return entries.length > 0 ? entries[0].startTime : 0
  }
  
  private getLCP(): number {
    const entries = window.performance.getEntriesByType('largest-contentful-paint')
    return entries.length > 0 ? entries[entries.length - 1].startTime : 0
  }
  
  private getTTI(): number {
    // Simplified TTI calculation
    const timing = window.performance.timing
    return timing.domInteractive - timing.navigationStart
  }
  
  logSlowQuery(queryName: string, duration: number): void {
    if (duration > 1000) {
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`)
      
      // Send to Sentry in production
      if (process.env.NODE_ENV === 'production') {
        Sentry.captureMessage(`Slow query: ${queryName}`, {
          level: 'warning',
          extra: { duration, queryName },
        })
      }
    }
  }
  
  detectExcessiveRerenders(componentName: string, renderCount: number): void {
    if (renderCount > 10) {
      console.warn(`Excessive re-renders detected in ${componentName}: ${renderCount} renders`)
      
      // Send to Sentry in production
      if (process.env.NODE_ENV === 'production') {
        Sentry.captureMessage(`Excessive re-renders: ${componentName}`, {
          level: 'warning',
          extra: { renderCount, componentName },
        })
      }
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()
```

### 9. Build Configuration Updates

```typescript
// vite.config.ts updates
export default defineConfig({
  // ... existing config ...
  
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'react-query': ['@tanstack/react-query'],
          'date-utils': ['date-fns'],
          'sentry': ['@sentry/react'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
    sourcemap: true,  // Enable sourcemaps for Sentry
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // Bundle size analysis plugin
  plugins: [
    react(),
    VitePWA({ /* ... */ }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
})
```

## Data Models

### Pagination Models

```typescript
// Cursor format: base64-encoded JSON
interface CursorData {
  timestamp: string    // ISO 8601 timestamp
  id: string          // Record ID (tiebreaker)
}

// Encode cursor
function encodeCursor(timestamp: string, id: string): string {
  const data: CursorData = { timestamp, id }
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

// Decode cursor
function decodeCursor(cursor: string): CursorData {
  const json = Buffer.from(cursor, 'base64').toString('utf-8')
  return JSON.parse(json)
}
```

### Service Response Models

```typescript
// Paginated shifts response
interface PaginatedShiftsResponse {
  data: Shift[]
  meta: {
    hasNextPage: boolean
    nextCursor?: string
    pageSize: number
  }
}

// Paginated leave requests response
interface PaginatedLeaveRequestsResponse {
  data: LeaveRequest[]
  meta: {
    hasNextPage: boolean
    nextCursor?: string
    pageSize: number
  }
}

// Paginated swap requests response
interface PaginatedSwapRequestsResponse {
  data: SwapRequest[]
  meta: {
    hasNextPage: boolean
    nextCursor?: string
    pageSize: number
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Paginated Response Structure

*For any* list endpoint (shifts, leave requests, swap requests, employees), when pagination is enabled, the response should include a data array with at most 50 records, a hasNextPage boolean, and a nextCursor string when more pages are available.

**Validates: Requirements 1.1, 1.2, 1.4**

### Property 2: Pagination Reset on Filter Change

*For any* list view with filters, when a filter or search criterion is applied, the pagination cursor should be reset to undefined (first page).

**Validates: Requirements 1.5**

### Property 3: Infinite Scroll Loading

*For any* paginated list with infinite scroll, when the user scrolls to the bottom and hasNextPage is true, the fetchNextPage function should be called and new data should be appended to the existing list.

**Validates: Requirements 1.3**

### Property 4: Error Tracking with Context

*For any* error that occurs in production, the error should be sent to Sentry with contextual information including user ID (if authenticated), current URL, user agent, and timestamp, and should also be logged locally.

**Validates: Requirements 2.1, 2.2, 2.5**

### Property 5: Non-Error Value Handling

*For any* non-Error thrown value (null, undefined, string, number, object), the error handler should handle it gracefully without crashing and should log it appropriately to both console and Sentry.

**Validates: Requirements 2.3**

### Property 6: Error Tracking Resilience

*For any* error that occurs, if Sentry is unavailable or throws an error, the application should continue to function normally and the error should still be logged locally.

**Validates: Requirements 2.6**

### Property 7: Cache Invalidation Cascade

*For any* mutation that modifies a specific resource (create, update, delete), the System should invalidate both the specific resource cache entry and all list cache entries that could contain that resource.

**Validates: Requirements 4.5, 4.6**

### Property 8: Cache Persistence Across Navigation

*For any* cached query, when the user navigates away from the page and returns within the gcTime window (10 minutes), the cached data should still be available for immediate display while background refetching occurs.

**Validates: Requirements 4.7**

### Property 9: Lazy Route Loading

*For any* route component marked as lazy-loaded, when the user navigates to that route, the component code should be loaded via dynamic import and a loading indicator should be displayed during the load.

**Validates: Requirements 5.2, 5.3**

### Property 10: Route Prefetching

*For any* route that is likely to be visited next based on navigation patterns, the System should prefetch the route chunk to reduce perceived load time when the user navigates to it.

**Validates: Requirements 5.6**

### Property 11: Performance Metrics Capture

*For any* page load, the System should measure and log page load time, first contentful paint, largest contentful paint, and time to interactive, and should send these metrics to Sentry for aggregation.

**Validates: Requirements 6.1, 6.5**

### Property 12: Slow Query Detection

*For any* database query that takes longer than 1 second to execute, the System should log a warning with the query name, duration, and relevant context, and should send this information to Sentry.

**Validates: Requirements 6.2, 6.6**

### Property 13: Excessive Re-render Detection

*For any* component that re-renders more than 10 times within a 1-second window, the System should log a warning with the component name and render count, and should send this information to Sentry.

**Validates: Requirements 6.3, 6.6**

## Error Handling

### Error Categories

1. **Network Errors**
   - Supabase connection failures
   - Timeout errors
   - Offline scenarios
   - **Handling**: Retry once, show user-friendly message, log to Sentry

2. **Pagination Errors**
   - Invalid cursor format
   - Cursor pointing to non-existent data
   - **Handling**: Reset to first page, log warning, continue operation

3. **Cache Errors**
   - React Query cache corruption
   - Invalid cache keys
   - **Handling**: Clear affected cache entries, refetch data, log to Sentry

4. **Performance Errors**
   - Bundle size exceeds limit
   - Slow query detection
   - Excessive re-renders
   - **Handling**: Log to Sentry with context, alert developers, continue operation

5. **Sentry Integration Errors**
   - Sentry initialization failure
   - Sentry API unavailable
   - **Handling**: Fail gracefully, continue local logging, don't block user experience

### Error Recovery Strategies

```typescript
// Pagination error recovery
function handlePaginationError(error: unknown): void {
  console.warn('Pagination error, resetting to first page:', error)
  queryClient.setQueryData(['requests'], (old) => ({
    pages: [],
    pageParams: [undefined],
  }))
}

// Cache error recovery
function handleCacheError(error: unknown, queryKey: string[]): void {
  console.error('Cache error, clearing affected cache:', error)
  queryClient.removeQueries({ queryKey })
  queryClient.invalidateQueries({ queryKey })
}

// Sentry error recovery
function handleSentryError(error: unknown): void {
  console.warn('Sentry unavailable, continuing with local logging:', error)
  // Continue operation without Sentry
}
```

### Error Boundaries

```typescript
// Top-level error boundary for route errors
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, errorInfo) => {
    errorHandler.handle(error, {
      context: { errorInfo, location: window.location.href },
    })
  }}
>
  <Routes>
    {/* ... routes ... */}
  </Routes>
</ErrorBoundary>

// Pagination-specific error boundary
<ErrorBoundary
  fallback={<PaginationErrorFallback onRetry={refetch} />}
  onError={handlePaginationError}
>
  <InfiniteList />
</ErrorBoundary>
```

## Testing Strategy

### Dual Testing Approach

This feature requires both **unit tests** and **property-based tests** for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Both are complementary and necessary

### Unit Testing Focus

Unit tests should focus on:
- Specific pagination scenarios (first page, middle page, last page)
- Error handling edge cases (null errors, undefined errors, string errors)
- Cache invalidation for specific mutations
- Database index existence verification
- Build configuration validation

**Avoid writing too many unit tests** - property-based tests handle covering lots of inputs.

### Property-Based Testing

**Library Selection**: Use **fast-check** for TypeScript/JavaScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: performance-scalability, Property {number}: {property_text}`

**Property Test Examples**:

```typescript
import fc from 'fast-check'

// Property 1: Paginated Response Structure
// Feature: performance-scalability, Property 1: Paginated response structure
test('paginated responses have correct structure', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom('shifts', 'leaveRequests', 'swapRequests', 'employees'),
      fc.option(fc.string(), { nil: undefined }),
      async (endpoint, cursor) => {
        const response = await fetchPaginatedData(endpoint, { pageSize: 50, cursor })
        
        // Verify structure
        expect(response).toHaveProperty('data')
        expect(response).toHaveProperty('meta')
        expect(response.meta).toHaveProperty('hasNextPage')
        expect(Array.isArray(response.data)).toBe(true)
        expect(response.data.length).toBeLessThanOrEqual(50)
        
        // If hasNextPage is true, nextCursor must exist
        if (response.meta.hasNextPage) {
          expect(response.meta.nextCursor).toBeDefined()
          expect(typeof response.meta.nextCursor).toBe('string')
        }
      }
    ),
    { numRuns: 100 }
  )
})

// Property 4: Error Tracking with Context
// Feature: performance-scalability, Property 4: Error tracking with context
test('errors are tracked with context', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.oneof(
        fc.constant(new Error('Test error')),
        fc.string(),
        fc.constant(null),
        fc.constant(undefined),
        fc.object()
      ),
      fc.record({
        userId: fc.option(fc.uuid(), { nil: undefined }),
        url: fc.webUrl(),
        userAgent: fc.string(),
      }),
      async (error, context) => {
        const sentryMock = jest.spyOn(Sentry, 'captureException')
        const consoleMock = jest.spyOn(console, 'error')
        
        errorHandler.handle(error, { context })
        
        // Verify local logging
        expect(consoleMock).toHaveBeenCalled()
        
        // Verify Sentry tracking (in production)
        if (process.env.NODE_ENV === 'production') {
          expect(sentryMock).toHaveBeenCalled()
          const sentryCall = sentryMock.mock.calls[0]
          expect(sentryCall[1]).toMatchObject({
            extra: expect.objectContaining(context)
          })
        }
      }
    ),
    { numRuns: 100 }
  )
})

// Property 7: Cache Invalidation Cascade
// Feature: performance-scalability, Property 7: Cache invalidation cascade
test('mutations invalidate related caches', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom('leaveRequest', 'swapRequest', 'shift'),
      fc.uuid(),
      fc.record({
        status: fc.constantFrom('approved', 'rejected', 'pending_tl'),
      }),
      async (resourceType, resourceId, updates) => {
        const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
        
        await updateResource(resourceType, resourceId, updates)
        
        // Verify specific resource cache invalidated
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: [resourceType, resourceId]
        })
        
        // Verify list cache invalidated
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: [resourceType + 's']
        })
      }
    ),
    { numRuns: 100 }
  )
})
```

### Integration Testing

Integration tests should verify:
- End-to-end pagination flow (load first page, load next page, reach end)
- Error tracking integration with Sentry (requires test Sentry project)
- Cache invalidation across multiple components
- Route lazy loading and code splitting
- Performance monitoring integration

### Performance Testing

Performance tests should verify:
- Initial bundle size < 200 KB (gzipped)
- Page load time < 3 seconds
- Query execution time < 1 second
- No excessive re-renders (< 10 per second)

### Database Testing

Database tests should verify:
- All required indexes exist
- Indexes are created with CONCURRENTLY flag
- Query plans use indexes (EXPLAIN ANALYZE)
- Index selectivity is appropriate

### Example Unit Tests

```typescript
// Unit test: First page pagination
test('first page returns up to 50 records', async () => {
  const response = await leaveRequestsService.getLeaveRequests({ pageSize: 50 })
  
  expect(response.data.length).toBeLessThanOrEqual(50)
  expect(response.meta.pageSize).toBe(response.data.length)
})

// Unit test: Comments not paginated
test('comments endpoint returns all comments without pagination', async () => {
  const requestId = 'test-request-id'
  const response = await commentsService.getComments(requestId, 'leave')
  
  // Should not have pagination metadata
  expect(response).not.toHaveProperty('meta')
  // Should return array directly
  expect(Array.isArray(response)).toBe(true)
})

// Unit test: Sentry initialization
test('Sentry initializes with correct environment', () => {
  const initSpy = jest.spyOn(Sentry, 'init')
  
  errorHandler.initializeSentry({
    dsn: 'test-dsn',
    environment: 'production',
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
  
  expect(initSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      environment: 'production',
    })
  )
})

// Unit test: Database indexes exist
test('required database indexes exist', async () => {
  const indexes = await queryDatabaseIndexes()
  
  expect(indexes).toContainEqual(
    expect.objectContaining({
      name: 'idx_shifts_user_date',
      columns: ['user_id', 'date'],
    })
  )
  
  expect(indexes).toContainEqual(
    expect.objectContaining({
      name: 'idx_leave_requests_user_status',
      columns: ['user_id', 'status'],
    })
  )
})

// Unit test: Cache stale times
test('settings cache has 10 minute stale time', () => {
  const { result } = renderHook(() => useSettings())
  
  expect(result.current.staleTime).toBe(1000 * 60 * 10)
})

// Unit test: Lazy route loading
test('routes are lazy loaded', () => {
  const Dashboard = lazy(() => import('./pages/Dashboard'))
  
  expect(Dashboard).toHaveProperty('$$typeof')
  expect(Dashboard.$$typeof.toString()).toContain('react.lazy')
})

// Unit test: Bundle size limit
test('main bundle size is under 200 KB gzipped', async () => {
  const stats = await getBuildStats()
  const mainBundle = stats.chunks.find(chunk => chunk.name === 'main')
  
  expect(mainBundle.gzipSize).toBeLessThan(200 * 1024)
})
```

### Test Coverage Goals

- **Unit test coverage**: 80% of new code
- **Property test coverage**: All correctness properties implemented
- **Integration test coverage**: All critical user flows
- **Performance test coverage**: All performance requirements validated

### Continuous Integration

- Run all tests on every pull request
- Run performance tests on main branch merges
- Generate bundle size reports on every build
- Fail build if bundle size exceeds limits
- Monitor test execution time (fail if > 5 minutes)
