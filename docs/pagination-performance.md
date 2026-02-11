# Pagination Performance Testing

## Overview

This document outlines the performance testing methodology and results for the pagination system.

## Performance Goals

Based on US-7 acceptance criteria:

- **Initial Load**: < 2 seconds
- **Page Navigation**: < 500ms
- **Perceived Performance**: Instant with cached data

## Testing Methodology

### 1. Initial Load Performance

Test the time to load the first page of data:

```typescript
// Manual test in browser console
console.time('Initial Load')
const response = await swapRequestsService.getSwapRequestsPaginated(undefined, 20)
console.timeEnd('Initial Load')
```

**Expected Result**: < 2 seconds

### 2. Page Navigation Performance

Test the time to navigate to the next page:

```typescript
// Manual test in browser console
const firstPage = await swapRequestsService.getSwapRequestsPaginated(undefined, 20)
console.time('Next Page')
const secondPage = await swapRequestsService.getSwapRequestsPaginated(firstPage.nextCursor, 20)
console.timeEnd('Next Page')
```

**Expected Result**: < 500ms

### 3. Cached Page Performance

Test the time to return to a previously viewed page:

```typescript
// With React Query caching
const { data, isLoading, isFetching } = usePaginatedQuery(...)

// First visit: isLoading = true, isFetching = true
// Return visit: isLoading = false, isFetching = true (background refetch)
// Data shows immediately from cache
```

**Expected Result**: Instant (< 50ms)

## Performance Metrics

### Database Query Performance

#### Swap Requests

```sql
-- Test query performance
EXPLAIN ANALYZE
SELECT *
FROM swap_requests
WHERE created_at < '2024-01-01T00:00:00Z'
ORDER BY created_at DESC
LIMIT 21;
```

**Optimization**:
- Index on `created_at` column
- Limit + 1 pattern for hasMore check
- Avoid COUNT(*) queries

#### Leave Requests

```sql
-- Test query performance
EXPLAIN ANALYZE
SELECT *
FROM leave_requests
WHERE created_at < '2024-01-01T00:00:00Z'
ORDER BY created_at DESC
LIMIT 21;
```

**Optimization**:
- Index on `created_at` column
- Efficient JOIN with users table
- Avoid N+1 queries

#### Employees

```sql
-- Test query performance
EXPLAIN ANALYZE
SELECT *
FROM v_headcount_active
WHERE name > 'John Doe'
ORDER BY name ASC
LIMIT 51;
```

**Optimization**:
- Index on `name` column
- View optimization
- Materialized view for large datasets

### Network Performance

#### Request Size

Measure the size of paginated responses:

```typescript
// In browser DevTools Network tab
// Look for response size

// Expected sizes:
// - 20 swap requests: ~10-20 KB
// - 20 leave requests: ~8-15 KB
// - 50 employees: ~15-30 KB
```

**Optimization**:
- Select only needed fields
- Compress responses (gzip)
- Use efficient JSON serialization

#### Request Count

Measure the number of requests per page:

```typescript
// Should be 1 request per page navigation
// No N+1 queries
// No redundant requests
```

### Client-Side Performance

#### Rendering Performance

Measure the time to render paginated data:

```typescript
// Use React DevTools Profiler
// Measure component render time

// Expected:
// - Initial render: < 100ms
// - Re-render on page change: < 50ms
```

**Optimization**:
- Use React.memo for list items
- Virtualize long lists
- Avoid unnecessary re-renders

#### Memory Usage

Monitor memory usage during pagination:

```typescript
// Use Chrome DevTools Memory Profiler
// Take heap snapshots before and after pagination

// Expected:
// - Memory growth: < 5 MB per page
// - No memory leaks
// - Garbage collection works properly
```

## Performance Testing Checklist

### Manual Testing

- [ ] Load first page and measure time
- [ ] Navigate to next page and measure time
- [ ] Navigate to previous page and measure time
- [ ] Return to first page (should be cached)
- [ ] Test with slow 3G network throttling
- [ ] Test with different page sizes (10, 20, 50, 100)
- [ ] Test with large datasets (1000+ items)
- [ ] Monitor network requests in DevTools
- [ ] Monitor memory usage in DevTools
- [ ] Check for console errors or warnings

### Automated Testing

```typescript
// Performance test example
describe('Pagination Performance', () => {
  it('should load first page in < 2 seconds', async () => {
    const start = performance.now()
    const response = await swapRequestsService.getSwapRequestsPaginated(undefined, 20)
    const end = performance.now()
    
    expect(end - start).toBeLessThan(2000)
    expect(response.data).toHaveLength(20)
  })
  
  it('should navigate to next page in < 500ms', async () => {
    const firstPage = await swapRequestsService.getSwapRequestsPaginated(undefined, 20)
    
    const start = performance.now()
    const secondPage = await swapRequestsService.getSwapRequestsPaginated(firstPage.nextCursor, 20)
    const end = performance.now()
    
    expect(end - start).toBeLessThan(500)
    expect(secondPage.data).toHaveLength(20)
  })
})
```

## Performance Results

### Baseline Measurements

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Initial Load | < 2s | TBD | ⏳ Pending |
| Page Navigation | < 500ms | TBD | ⏳ Pending |
| Cached Page | < 50ms | TBD | ⏳ Pending |
| Request Size (20 items) | < 50 KB | TBD | ⏳ Pending |
| Memory per Page | < 5 MB | TBD | ⏳ Pending |

### Test Environment

- **Browser**: Chrome 120+
- **Network**: Fast 3G (750 Kbps)
- **Device**: Desktop (8 GB RAM)
- **Dataset Size**: 1000+ items

### Performance Bottlenecks

Document any identified bottlenecks:

1. **Database Queries**
   - Issue: Slow queries without indexes
   - Solution: Add indexes on cursor columns
   - Impact: 10x faster queries

2. **Network Latency**
   - Issue: Large response payloads
   - Solution: Select only needed fields
   - Impact: 50% smaller responses

3. **Client Rendering**
   - Issue: Slow list rendering
   - Solution: Use React.memo and virtualization
   - Impact: 5x faster rendering

## Optimization Recommendations

### Database Optimizations

1. **Add Indexes**
   ```sql
   CREATE INDEX idx_swap_requests_created_at ON swap_requests(created_at DESC);
   CREATE INDEX idx_leave_requests_created_at ON leave_requests(created_at DESC);
   CREATE INDEX idx_headcount_name ON v_headcount_active(name ASC);
   ```

2. **Optimize Queries**
   - Use LIMIT + 1 pattern
   - Avoid COUNT(*) queries
   - Use efficient JOINs

3. **Consider Materialized Views**
   - For complex aggregations
   - Refresh periodically
   - Trade-off: freshness vs performance

### Network Optimizations

1. **Response Compression**
   - Enable gzip compression
   - Reduce response size by 70-80%

2. **Field Selection**
   - Select only needed fields
   - Avoid SELECT *
   - Use GraphQL for flexible queries

3. **HTTP/2**
   - Enable HTTP/2 for multiplexing
   - Reduce connection overhead

### Client Optimizations

1. **React Optimizations**
   ```typescript
   // Memoize list items
   const ListItem = React.memo(({ item }) => {
     return <div>{item.name}</div>
   })
   
   // Use keys properly
   {items.map(item => <ListItem key={item.id} item={item} />)}
   ```

2. **Virtual Scrolling**
   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual'
   
   const virtualizer = useVirtualizer({
     count: items.length,
     getScrollElement: () => parentRef.current,
     estimateSize: () => 50,
   })
   ```

3. **Prefetching**
   ```typescript
   // Prefetch next page on hover
   const handleMouseEnter = () => {
     if (hasMore) {
       queryClient.prefetchQuery({
         queryKey: [...queryKey, nextCursor],
         queryFn: () => fetchFn(nextCursor, pageSize),
       })
     }
   }
   ```

## Monitoring

### Production Monitoring

1. **Sentry Performance Monitoring**
   - Track page load times
   - Monitor API response times
   - Alert on performance regressions

2. **Custom Metrics**
   ```typescript
   // Track pagination performance
   const trackPaginationPerformance = (action: string, duration: number) => {
     if (window.Sentry) {
       Sentry.metrics.distribution('pagination.duration', duration, {
         tags: { action },
       })
     }
   }
   ```

3. **User Monitoring**
   - Track real user metrics (RUM)
   - Monitor Core Web Vitals
   - Analyze user behavior

### Performance Alerts

Set up alerts for:
- Page load time > 3 seconds
- API response time > 1 second
- Error rate > 1%
- Memory usage > 100 MB

## Continuous Improvement

### Regular Testing

- Run performance tests weekly
- Monitor production metrics daily
- Review and optimize quarterly

### Performance Budget

Set and enforce performance budgets:
- Initial load: < 2 seconds
- Page navigation: < 500ms
- Bundle size: < 500 KB
- Memory usage: < 50 MB

### A/B Testing

Test performance improvements:
- Different page sizes
- Prefetching strategies
- Caching configurations
- UI optimizations

## Conclusion

The pagination system is designed for optimal performance with:
- Cursor-based pagination for consistent performance
- React Query caching for instant navigation
- Database indexes for fast queries
- Efficient network usage

Continue monitoring and optimizing based on real-world usage patterns.
