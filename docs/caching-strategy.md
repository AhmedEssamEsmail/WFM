# Caching Strategy

## Overview

The WFM application uses React Query for data fetching and caching. This document outlines our caching strategy, configuration, and best practices.

## Cache Configuration

### Stale Times by Data Type

Different data types have different update frequencies. We configure stale times accordingly:

| Data Type | Stale Time | Rationale |
|-----------|------------|-----------|
| Settings | 10 minutes | Rarely changes |
| User Profile | 5 minutes | Changes infrequently |
| Leave Balances | 5 minutes | Moderate update frequency |
| Employees | 5 minutes | Changes infrequently |
| Shifts | 2 minutes | Moderate update frequency |
| Leave Requests | 1 minute | Frequent updates |
| Swap Requests | 1 minute | Frequent updates |
| Comments | 1 minute | Frequent updates |

### Garbage Collection

- **Default GC Time**: 10 minutes (2x the default stale time)
- **Purpose**: Keep unused data in cache for quick navigation back to previously viewed pages
- **Behavior**: Data is removed from cache 10 minutes after the last component using it unmounts

## Stale-While-Revalidate Strategy

We implement a stale-while-revalidate strategy for optimal user experience:

1. **Show cached data immediately**: When navigating to a page, show cached data instantly
2. **Fetch fresh data in background**: Simultaneously fetch fresh data from the server
3. **Update UI when fresh data arrives**: Replace cached data with fresh data when available

This provides:
- **Instant UI updates**: No loading spinners for cached data
- **Eventual consistency**: Data is always up-to-date
- **Better perceived performance**: Users see content immediately

## Pagination Strategy

### Cursor-Based Pagination

We use cursor-based pagination for large datasets:

- **Swap Requests**: Paginated by `created_at` timestamp
- **Leave Requests**: Paginated by `created_at` timestamp
- **Employees**: Paginated by `name` (alphabetical)

### Configuration

```typescript
const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
}
```

### Benefits

- **Consistent performance**: Page load time doesn't degrade with large datasets
- **Efficient database queries**: Uses indexed columns for cursor
- **No offset issues**: Cursor-based pagination handles concurrent inserts/deletes

## Query Key Structure

We use a consistent query key structure for cache management:

```typescript
// List queries
['swapRequests']
['leaveRequests']
['employees']

// Detail queries
['swapRequests', id]
['leaveRequests', id]
['employees', id]

// Paginated queries
['swapRequests', 'paginated', cursor, limit]
['leaveRequests', 'paginated', cursor, limit]
['employees', 'paginated', cursor, limit]
```

## Cache Invalidation

### Automatic Invalidation

Mutations automatically invalidate related queries:

```typescript
// After creating a swap request
queryClient.invalidateQueries({ queryKey: ['swapRequests'] })

// After updating a specific swap request
queryClient.invalidateQueries({ queryKey: ['swapRequests', id] })
queryClient.invalidateQueries({ queryKey: ['swapRequests'] })
```

### Manual Invalidation

Users can manually refresh data:
- Pull-to-refresh on mobile
- Refresh button in UI
- Keyboard shortcut (Ctrl+R / Cmd+R)

## Best Practices

### 1. Use Query Keys Factory

Always use the query keys factory for type safety:

```typescript
import { queryKeys } from '../lib/queryClient'

// Good
useQuery({ queryKey: queryKeys.swapRequests() })

// Bad
useQuery({ queryKey: ['swapRequests'] })
```

### 2. Configure Stale Time Per Query

Override default stale time based on data type:

```typescript
useQuery({
  queryKey: queryKeys.settings(),
  queryFn: fetchSettings,
  staleTime: STALE_TIMES.SETTINGS, // 10 minutes
})
```

### 3. Invalidate Related Queries

After mutations, invalidate all related queries:

```typescript
onSuccess: () => {
  // Invalidate list query
  queryClient.invalidateQueries({ queryKey: queryKeys.swapRequests() })
  
  // Invalidate detail query
  queryClient.invalidateQueries({ queryKey: queryKeys.swapRequest(id) })
  
  // Invalidate related queries
  queryClient.invalidateQueries({ queryKey: queryKeys.shifts() })
}
```

### 4. Use Optimistic Updates

For better UX, use optimistic updates for mutations:

```typescript
onMutate: async (newData) => {
  // Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey: queryKeys.swapRequests() })
  
  // Snapshot previous value
  const previousData = queryClient.getQueryData(queryKeys.swapRequests())
  
  // Optimistically update cache
  queryClient.setQueryData(queryKeys.swapRequests(), (old) => [...old, newData])
  
  // Return context with snapshot
  return { previousData }
},
onError: (err, newData, context) => {
  // Rollback on error
  queryClient.setQueryData(queryKeys.swapRequests(), context.previousData)
},
```

### 5. Prefetch Related Data

Prefetch data that users are likely to need:

```typescript
// Prefetch detail page when hovering over list item
const handleMouseEnter = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.swapRequest(id),
    queryFn: () => fetchSwapRequest(id),
  })
}
```

## Performance Monitoring

### Metrics to Track

- **Cache hit rate**: Percentage of queries served from cache
- **Average query time**: Time to fetch data from server
- **Stale data rate**: Percentage of queries showing stale data
- **Invalidation frequency**: How often queries are invalidated

### Tools

- React Query DevTools (development only)
- Sentry Performance Monitoring (production)
- Custom analytics events

## Troubleshooting

### Data Not Updating

1. Check if query is being invalidated after mutation
2. Verify stale time is appropriate for data type
3. Check if `refetchOnMount` is disabled

### Too Many Requests

1. Increase stale time for less frequently changing data
2. Disable `refetchOnWindowFocus` if not needed
3. Use pagination for large datasets

### Stale Data Showing

1. Decrease stale time for more frequently changing data
2. Manually invalidate queries when needed
3. Use real-time subscriptions for critical data

## Future Improvements

1. **Real-time Updates**: Implement Supabase real-time subscriptions for critical data
2. **Offline Support**: Add offline-first caching with service workers
3. **Predictive Prefetching**: Prefetch data based on user behavior patterns
4. **Cache Persistence**: Persist cache to localStorage for faster initial loads
5. **Smart Invalidation**: Invalidate only affected queries based on mutation type
