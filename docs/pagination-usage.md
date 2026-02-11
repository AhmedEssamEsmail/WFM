# Pagination Usage Guide

## Overview

This guide explains how to use the pagination system in the WFM application. The pagination system uses cursor-based pagination for efficient data fetching.

## Components

### 1. `usePaginatedQuery` Hook

The core hook for paginated data fetching.

```typescript
import { usePaginatedQuery } from '../hooks/usePaginatedQuery'
import { swapRequestsService } from '../services'

function MyComponent() {
  const {
    data,
    isLoading,
    hasMore,
    hasPrevious,
    nextPage,
    prevPage,
    resetPagination,
  } = usePaginatedQuery(
    ['swap-requests'],
    (cursor, limit) => swapRequestsService.getSwapRequestsPaginated(cursor, limit),
    { pageSize: 20 }
  )

  return (
    <div>
      {/* Render data */}
      {data.map(item => <div key={item.id}>{item.name}</div>)}
      
      {/* Pagination controls */}
      <button onClick={prevPage} disabled={!hasPrevious}>
        Previous
      </button>
      <button onClick={nextPage} disabled={!hasMore}>
        Next
      </button>
    </div>
  )
}
```

### 2. `Pagination` Component

A reusable pagination UI component.

```typescript
import { Pagination } from '../components/Pagination'

function MyComponent() {
  const pagination = usePaginatedQuery(...)

  return (
    <div>
      {/* Your content */}
      
      <Pagination
        hasMore={pagination.hasMore}
        hasPrevious={pagination.hasPrevious}
        isLoading={pagination.isLoading}
        onNextPage={pagination.nextPage}
        onPrevPage={pagination.prevPage}
      />
    </div>
  )
}
```

## Service Layer

### Adding Pagination to Services

Services expose paginated methods that return `PaginatedResponse`:

```typescript
import type { PaginatedResponse } from '../hooks/usePaginatedQuery'
import { PAGINATION } from '../constants'

export const myService = {
  async getItemsPaginated(
    cursor?: string,
    limit: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResponse<MyItem>> {
    // Validate and cap limit
    const validatedLimit = Math.min(
      Math.max(1, limit),
      PAGINATION.MAX_PAGE_SIZE
    )

    // Build query with cursor
    let query = supabase
      .from('my_table')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(validatedLimit + 1) // Fetch one extra to check if there are more

    // Apply cursor if provided
    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data, error } = await query
    if (error) throw error

    // Check if there are more results
    const hasMore = data.length > validatedLimit
    const items = hasMore ? data.slice(0, validatedLimit) : data

    // Get next cursor from last item
    const nextCursor = hasMore && items.length > 0
      ? items[items.length - 1].created_at
      : undefined

    return {
      data: items,
      nextCursor,
      hasMore,
    }
  },
}
```

## Examples

### Example 1: Swap Requests with Pagination

```typescript
import { usePaginatedQuery } from '../hooks/usePaginatedQuery'
import { swapRequestsService } from '../services'
import { Pagination } from '../components/Pagination'

export function SwapRequestsList() {
  const {
    data: requests,
    isLoading,
    hasMore,
    hasPrevious,
    nextPage,
    prevPage,
  } = usePaginatedQuery(
    ['swap-requests'],
    swapRequestsService.getSwapRequestsPaginated,
    { pageSize: 20 }
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="space-y-4">
        {requests.map(request => (
          <div key={request.id} className="p-4 border rounded">
            <h3>{request.requester.name}</h3>
            <p>{request.status}</p>
          </div>
        ))}
      </div>

      <Pagination
        hasMore={hasMore}
        hasPrevious={hasPrevious}
        isLoading={isLoading}
        onNextPage={nextPage}
        onPrevPage={prevPage}
      />
    </div>
  )
}
```

### Example 2: Leave Requests with Pagination

```typescript
import { usePaginatedQuery } from '../hooks/usePaginatedQuery'
import { leaveRequestsService } from '../services'
import { Pagination } from '../components/Pagination'

export function LeaveRequestsList() {
  const {
    data: requests,
    isLoading,
    hasMore,
    hasPrevious,
    nextPage,
    prevPage,
  } = usePaginatedQuery(
    ['leave-requests'],
    leaveRequestsService.getLeaveRequestsPaginated,
    { pageSize: 20 }
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="space-y-4">
        {requests.map(request => (
          <div key={request.id} className="p-4 border rounded">
            <h3>{request.users.name}</h3>
            <p>{request.leave_type}</p>
            <p>{request.start_date} - {request.end_date}</p>
          </div>
        ))}
      </div>

      <Pagination
        hasMore={hasMore}
        hasPrevious={hasPrevious}
        isLoading={isLoading}
        onNextPage={nextPage}
        onPrevPage={prevPage}
      />
    </div>
  )
}
```

### Example 3: Employees with Pagination

```typescript
import { usePaginatedQuery } from '../hooks/usePaginatedQuery'
import { headcountService } from '../services'
import { Pagination } from '../components/Pagination'

export function EmployeeDirectory() {
  const {
    data: employees,
    isLoading,
    hasMore,
    hasPrevious,
    nextPage,
    prevPage,
  } = usePaginatedQuery(
    ['employees'],
    headcountService.getEmployeesPaginated,
    { pageSize: 50 }
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(employee => (
            <tr key={employee.id}>
              <td>{employee.name}</td>
              <td>{employee.email}</td>
              <td>{employee.department}</td>
              <td>{employee.role}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        hasMore={hasMore}
        hasPrevious={hasPrevious}
        isLoading={isLoading}
        onNextPage={nextPage}
        onPrevPage={prevPage}
      />
    </div>
  )
}
```

## Advanced Usage

### Custom Page Size

```typescript
const pagination = usePaginatedQuery(
  ['items'],
  fetchItems,
  { pageSize: 50 } // Custom page size
)
```

### Conditional Fetching

```typescript
const pagination = usePaginatedQuery(
  ['items'],
  fetchItems,
  { enabled: someCondition } // Only fetch when condition is true
)
```

### Reset Pagination

```typescript
const { resetPagination } = usePaginatedQuery(...)

// Reset to first page
const handleReset = () => {
  resetPagination()
}
```

### Jump to Specific Cursor

```typescript
const { goToCursor } = usePaginatedQuery(...)

// Jump to a specific cursor
const handleJump = (cursor: string) => {
  goToCursor(cursor)
}
```

## Best Practices

### 1. Choose Appropriate Page Size

- **Small lists (< 100 items)**: 20-50 items per page
- **Medium lists (100-1000 items)**: 50-100 items per page
- **Large lists (> 1000 items)**: 100 items per page (max)

### 2. Show Loading States

Always show loading indicators during pagination:

```typescript
{isLoading && <div>Loading...</div>}
{isFetching && !isLoading && <div>Updating...</div>}
```

### 3. Handle Empty States

```typescript
{!isLoading && data.length === 0 && (
  <div>No items found</div>
)}
```

### 4. Preserve Scroll Position

Consider preserving scroll position when navigating pages:

```typescript
const handleNextPage = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  nextPage()
}
```

### 5. Keyboard Navigation

Add keyboard shortcuts for pagination:

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && hasPrevious) {
      prevPage()
    } else if (e.key === 'ArrowRight' && hasMore) {
      nextPage()
    }
  }
  
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [hasPrevious, hasMore, prevPage, nextPage])
```

## Migration Guide

### Migrating from Non-Paginated to Paginated

1. **Update Service**: Add paginated method to service
2. **Update Hook**: Replace `useQuery` with `usePaginatedQuery`
3. **Update UI**: Add `Pagination` component
4. **Test**: Verify pagination works correctly

Example migration:

```typescript
// Before
const { data, isLoading } = useQuery({
  queryKey: ['items'],
  queryFn: () => service.getItems(),
})

// After
const {
  data,
  isLoading,
  hasMore,
  hasPrevious,
  nextPage,
  prevPage,
} = usePaginatedQuery(
  ['items'],
  service.getItemsPaginated,
  { pageSize: 20 }
)
```

## Performance Considerations

### 1. Cursor Selection

Choose cursor fields that are:
- Indexed in the database
- Unique or nearly unique
- Monotonically increasing (for time-based cursors)

### 2. Limit Validation

Always validate and cap the limit:

```typescript
const validatedLimit = Math.min(
  Math.max(1, limit),
  PAGINATION.MAX_PAGE_SIZE
)
```

### 3. Prefetching

Consider prefetching the next page:

```typescript
const { query } = usePaginatedQuery(...)

useEffect(() => {
  if (hasMore && !query.isFetching) {
    // Prefetch next page
    queryClient.prefetchQuery({
      queryKey: [...queryKey, 'paginated', nextCursor],
      queryFn: () => fetchFn(nextCursor, pageSize),
    })
  }
}, [hasMore, nextCursor])
```

## Troubleshooting

### Issue: Duplicate Items

**Cause**: Concurrent inserts while paginating
**Solution**: Use stable cursor (e.g., ID instead of timestamp)

### Issue: Missing Items

**Cause**: Items deleted between pages
**Solution**: Accept eventual consistency or use snapshot isolation

### Issue: Slow Queries

**Cause**: Cursor field not indexed
**Solution**: Add database index on cursor field

### Issue: Inconsistent Page Sizes

**Cause**: Filtering after pagination
**Solution**: Apply filters in database query, not in application

## Future Enhancements

1. **Infinite Scroll**: Implement infinite scroll variant
2. **Virtual Scrolling**: Add virtual scrolling for large lists
3. **Page Numbers**: Add page number navigation
4. **Jump to Page**: Allow jumping to specific page
5. **Bidirectional Cursors**: Support both forward and backward cursors
