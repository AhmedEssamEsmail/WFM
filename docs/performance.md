# Performance Guide

Complete guide for optimizing and monitoring performance in the WFM application.

## Table of Contents

1. [Overview](#overview)
2. [Performance Goals](#performance-goals)
3. [Caching Strategy](#caching-strategy)
4. [Data Fetching Optimization](#data-fetching-optimization)
5. [Pagination](#pagination)
6. [Performance Validation](#performance-validation)

---

## Overview

### Performance Stack

- **Caching**: React Query
- **Data Fetching**: Supabase with optimized joins
- **Pagination**: Cursor-based pagination
- **Monitoring**: Sentry Performance, Lighthouse

### Key Metrics

**Page Load Times**:
- Target: <2 seconds initial load
- Critical pages: <1.5 seconds

**Interaction Times**:
- Target: <500ms for user interactions

**Web Vitals**:
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1
- TTFB (Time to First Byte): <600ms

---

## Performance Goals

### Page Load Times

| Page | Target | Critical |
|------|--------|----------|
| Dashboard | <2s | Yes (<1.5s) |
| Login | <2s | Yes (<1.5s) |
| Swap Requests | <2s | No |
| Leave Requests | <2s | No |
| Schedule | <2s | No |
| Settings | <2s | No |

### Interaction Times

| Interaction | Target |
|-------------|--------|
| Filter requests | <500ms |
| Submit form | <500ms |
| Navigate pages | <500ms |
| Sort table | <500ms |

### Web Vitals

| Metric | Target | Description |
|--------|--------|-------------|
| LCP | <2.5s | Largest content paint time |
| FID | <100ms | First input delay |
| CLS | <0.1 | Cumulative layout shift |
| TTFB | <600ms | Time to first byte |

---

## Caching Strategy

### Stale Times by Data Type

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

### Stale-While-Revalidate Strategy

1. **Show cached data immediately**: Display cached data instantly
2. **Fetch fresh data in background**: Simultaneously fetch from server
3. **Update UI when fresh data arrives**: Replace with fresh data

**Benefits**:
- Instant UI updates (no loading spinners)
- Eventual consistency
- Better perceived performance

### Query Key Structure

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

### Cache Invalidation

**Automatic Invalidation**:
```typescript
// After creating a swap request
queryClient.invalidateQueries({ queryKey: ['swapRequests'] })

// After updating a specific swap request
queryClient.invalidateQueries({ queryKey: ['swapRequests', id] })
queryClient.invalidateQueries({ queryKey: ['swapRequests'] })
```

**Manual Invalidation**:
- Pull-to-refresh on mobile
- Refresh button in UI
- Keyboard shortcut (Ctrl+R / Cmd+R)

### Best Practices

✅ **Use Query Keys Factory**:
```typescript
import { queryKeys } from '../lib/queryClient'

// Good
useQuery({ queryKey: queryKeys.swapRequests() })

// Bad
useQuery({ queryKey: ['swapRequests'] })
```

✅ **Configure Stale Time Per Query**:
```typescript
useQuery({
  queryKey: queryKeys.settings(),
  queryFn: fetchSettings,
  staleTime: STALE_TIMES.SETTINGS, // 10 minutes
})
```

✅ **Invalidate Related Queries**:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.swapRequests() })
  queryClient.invalidateQueries({ queryKey: queryKeys.swapRequest(id) })
  queryClient.invalidateQueries({ queryKey: queryKeys.shifts() })
}
```

✅ **Use Optimistic Updates**:
```typescript
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey: queryKeys.swapRequests() })
  const previousData = queryClient.getQueryData(queryKeys.swapRequests())
  queryClient.setQueryData(queryKeys.swapRequests(), (old) => [...old, newData])
  return { previousData }
},
onError: (err, newData, context) => {
  queryClient.setQueryData(queryKeys.swapRequests(), context.previousData)
},
```

✅ **Prefetch Related Data**:
```typescript
const handleMouseEnter = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.swapRequest(id),
    queryFn: () => fetchSwapRequest(id),
  })
}
```

---

## Data Fetching Optimization

### N+1 Query Problem

**What is N+1?**
1. Fetch N items (1 query)
2. For each item, fetch related data (N queries)
3. Total: 1 + N queries instead of 1 or 2 queries

**Example of N+1 Problem**:
```typescript
// BAD: N+1 queries
const requests = await getSwapRequests() // 1 query
for (const request of requests) {
  const requester = await getUser(request.requester_id) // N queries
  const target = await getUser(request.target_user_id) // N queries
}
// Total: 1 + 2N queries
```

**Solution: Join Queries**:
```typescript
// GOOD: Single query with joins
const requests = await supabase
  .from('swap_requests')
  .select(`
    *,
    requester:users!swap_requests_requester_id_fkey(id, name, email),
    target:users!swap_requests_target_user_id_fkey(id, name, email)
  `)
// Total: 1 query
```

### Optimization Strategies

#### 1. Use Supabase Joins

```typescript
const { data } = await supabase
  .from('swap_requests')
  .select(`
    *,
    requester:users!swap_requests_requester_id_fkey(id, name, email),
    target:users!swap_requests_target_user_id_fkey(id, name, email),
    requester_shift:shifts!swap_requests_requester_shift_id_fkey(date, shift_type),
    target_shift:shifts!swap_requests_target_shift_id_fkey(date, shift_type)
  `)
```

#### 2. Select Only Needed Fields

```typescript
// BAD: Fetch all fields
.select('*, users(*)')

// GOOD: Select specific fields
.select('*, users(id, name, email)')
```

#### 3. Use Database Views

```sql
CREATE VIEW v_headcount_active AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.department,
  hp.job_title,
  hp.employment_type
FROM users u
LEFT JOIN headcount_profiles hp ON u.id = hp.user_id
WHERE u.status = 'active';
```

#### 4. Batch Requests

```typescript
// BAD: Multiple queries
const user1 = await getUser(id1)
const user2 = await getUser(id2)
const user3 = await getUser(id3)

// GOOD: Single query with filter
const users = await supabase
  .from('users')
  .select('*')
  .in('id', [id1, id2, id3])
```

### Performance Comparison

**Before Optimization**:
- 81 queries for 20 swap requests
- ~2-3 seconds load time

**After Optimization**:
- 1 query for 20 swap requests
- ~200-300ms load time

**Improvement**: 10x faster, 98% fewer queries

### Best Practices

✅ **Always Use Joins for Related Data**:
```typescript
// DO THIS
.select(`
  *,
  related_table:foreign_key(fields)
`)

// NOT THIS
const items = await getItems()
for (const item of items) {
  const related = await getRelated(item.id)
}
```

✅ **Add Indexes on Foreign Keys**:
```sql
CREATE INDEX idx_swap_requests_requester_id ON swap_requests(requester_id);
CREATE INDEX idx_swap_requests_target_user_id ON swap_requests(target_user_id);
```

✅ **Monitor Query Performance**:
```sql
-- Find slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Pagination

### Cursor-Based Pagination

We use cursor-based pagination for large datasets:

**Configuration**:
```typescript
const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
}
```

**Benefits**:
- Consistent performance with large datasets
- Efficient database queries using indexed columns
- Handles concurrent inserts/deletes

### Usage

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
  } = usePaginatedQuery(
    ['swap-requests'],
    (cursor, limit) => swapRequestsService.getSwapRequestsPaginated(cursor, limit),
    { pageSize: 20 }
  )

  return (
    <div>
      {data.map(item => <div key={item.id}>{item.name}</div>)}
      
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

### Service Implementation

```typescript
async getItemsPaginated(
  cursor?: string,
  limit: number = PAGINATION.DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<MyItem>> {
  const validatedLimit = Math.min(
    Math.max(1, limit),
    PAGINATION.MAX_PAGE_SIZE
  )

  let query = supabase
    .from('my_table')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(validatedLimit + 1) // Fetch one extra to check if there are more

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query
  if (error) throw error

  const hasMore = data.length > validatedLimit
  const items = hasMore ? data.slice(0, validatedLimit) : data
  const nextCursor = hasMore && items.length > 0
    ? items[items.length - 1].created_at
    : undefined

  return {
    data: items,
    nextCursor,
    hasMore,
  }
}
```

### Performance Goals

- Initial load: <2 seconds
- Page navigation: <500ms
- Cached page: <50ms (instant)

### Best Practices

✅ **Choose Appropriate Page Size**:
- Small lists (<100 items): 20-50 items per page
- Medium lists (100-1000 items): 50-100 items per page
- Large lists (>1000 items): 100 items per page (max)

✅ **Show Loading States**:
```typescript
{isLoading && <div>Loading...</div>}
{isFetching && !isLoading && <div>Updating...</div>}
```

✅ **Handle Empty States**:
```typescript
{!isLoading && data.length === 0 && (
  <div>No items found</div>
)}
```

---

## Performance Validation

### Validation Process

#### Step 1: Measure Page Load Times

**Using Chrome DevTools**:
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Reload page (Ctrl+Shift+R)
5. Note "Load" time

**Expected**: All pages <2 seconds

#### Step 2: Measure Interaction Times

**Test Scenarios**:
- Filter requests: <500ms
- Submit form: <500ms
- Navigate pages: <500ms
- Sort table: <500ms

#### Step 3: Measure Web Vitals

**Using Lighthouse**:
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Performance" category
4. Click "Analyze page load"
5. Review Web Vitals

**Expected**:
- LCP: <2.5s
- FID: <100ms
- CLS: <0.1
- TTFB: <600ms

#### Step 4: Test Pagination Performance

1. Go to paginated list
2. Click "Next page"
3. Measure load time
4. Verify only current page data loaded

**Expected**:
- Page size: 20 items (default)
- Next page load: <500ms
- Only current page data loaded

#### Step 5: Test Data Fetching Optimization

1. Navigate to page
2. Note load time
3. Navigate away
4. Navigate back
5. Note load time (should be instant from cache)

**Expected**:
- First load: Normal time
- Cached load: <100ms (instant)

#### Step 6: Test Network Performance

**Using Chrome DevTools Network Tab**:
- Total requests: <50
- Total size: <1MB
- Largest request: <200KB
- API calls: Minimal (use caching)

#### Step 7: Document Results

```markdown
# Performance Validation Report

**Date**: [Date]
**Validator**: [Name]

## Page Load Times
| Page | Load Time | Target | Status |
|------|-----------|--------|--------|
| Dashboard | 1.2s | <2s | ✅ Pass |
| Login | 0.8s | <2s | ✅ Pass |

## Web Vitals
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP | 1.8s | <2.5s | ✅ Pass |
| FID | 45ms | <100ms | ✅ Pass |
| CLS | 0.05 | <0.1 | ✅ Pass |
| TTFB | 420ms | <600ms | ✅ Pass |

## Summary
**Status**: ✅ Pass
**All Performance Goals Met**: ✅ Yes
```

### Troubleshooting

**Slow Page Load**:
1. Check bundle size
2. Optimize images
3. Enable code splitting
4. Lazy load components
5. Optimize API calls

**Slow Interactions**:
1. Check for unnecessary re-renders
2. Use React.memo for expensive components
3. Optimize state updates
4. Use debouncing for inputs
5. Profile with React DevTools

**Poor Web Vitals**:
1. Optimize largest content element
2. Prevent layout shifts
3. Reduce JavaScript execution time
4. Use font-display: swap
5. Optimize images

---

## Monitoring

### Metrics to Track

- Cache hit rate
- Average query time
- Stale data rate
- Invalidation frequency
- Page load times
- Interaction times
- Web Vitals

### Tools

- React Query DevTools (development)
- Sentry Performance Monitoring (production)
- Lighthouse (audits)
- Chrome DevTools (profiling)

### Continuous Monitoring

**After Each Deployment**:
- Run Lighthouse audit
- Check Web Vitals
- Test critical interactions
- Monitor performance metrics

**Weekly**:
- Review performance dashboard
- Check for regressions
- Identify slow pages
- Plan optimizations

**Monthly**:
- Full performance audit
- Review all metrics
- Compare to targets
- Plan improvements

---

## Best Practices

### Do's

✅ Use React Query for caching
✅ Implement stale-while-revalidate
✅ Use Supabase joins to avoid N+1 queries
✅ Select only needed fields
✅ Use cursor-based pagination
✅ Add database indexes
✅ Monitor query performance
✅ Prefetch related data
✅ Use optimistic updates
✅ Measure and validate performance

### Don'ts

❌ Don't fetch all data at once
❌ Don't use N+1 queries
❌ Don't fetch unnecessary fields
❌ Don't ignore cache invalidation
❌ Don't skip performance testing
❌ Don't use offset-based pagination for large datasets
❌ Don't forget to add indexes
❌ Don't ignore slow queries

---

## Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Supabase Performance](https://supabase.com/docs/guides/database/performance)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)

---

## Summary

Performance optimization is critical for user experience. By implementing proper caching, data fetching optimization, and pagination, we achieve fast page loads and smooth interactions.

**Key Takeaways**:
- Use React Query for caching with stale-while-revalidate
- Avoid N+1 queries with Supabase joins
- Use cursor-based pagination for large datasets
- Monitor and validate performance regularly
- Target <2s page loads, <500ms interactions, and good Web Vitals

For questions or assistance, contact the development team.
