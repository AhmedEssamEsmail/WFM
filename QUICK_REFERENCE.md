# WFM Quick Reference Guide

## 🎯 New Features Quick Start

### Toast Notifications

```typescript
import { useToast } from '../lib/ToastContext'

function MyComponent() {
  const { success, error, warning, info } = useToast()

  const handleAction = async () => {
    try {
      await someAction()
      success('Action completed!')
    } catch (err) {
      error('Action failed. Please try again.')
    }
  }
}
```

### Loading Skeletons

```typescript
import { SkeletonTable, SkeletonCard, SkeletonList } from '../components/Skeleton'

function MyPage() {
  const { data, isLoading } = useQuery(...)

  if (isLoading) {
    return <SkeletonTable rows={5} columns={4} />
  }

  return <ActualTable data={data} />
}
```

### React Query Data Fetching

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['items'],
  queryFn: async () => {
    const { data, error } = await supabase.from('items').select()
    if (error) throw error
    return data
  }
})

// Mutate data
const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: async (newItem) => {
    const { data, error } = await supabase.from('items').insert(newItem)
    if (error) throw error
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
  }
})
```

### Pre-built Query Hooks

```typescript
// Swap Requests
import { useSwapRequests } from '../hooks/useSwapRequests'
const { swapRequests, isLoading, createSwapRequest, updateSwapRequest } = useSwapRequests()

// Leave Requests
import { useLeaveRequests } from '../hooks/useLeaveRequests'
const { leaveRequests, isLoading, createLeaveRequest, updateLeaveRequest } = useLeaveRequests()

// Settings
import { useSettings } from '../hooks/useSettings'
const { settings, getSetting, updateSetting } = useSettings()
```

---

## 🧪 Testing

### Run Tests

```bash
# Watch mode (recommended during development)
npm run test

# Run once
npm run test:run

# With UI
npm run test:ui

# With coverage
npm run test:coverage
```

### Write a Test

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

---

## 🎨 Skeleton Components Reference

| Component | Use Case | Example |
|-----------|----------|---------|
| `<Skeleton />` | Basic skeleton | `<Skeleton width={200} height={20} />` |
| `<SkeletonText lines={3} />` | Multi-line text | `<SkeletonText lines={5} />` |
| `<SkeletonCard />` | Card layout | `<SkeletonCard />` |
| `<SkeletonTable rows={5} columns={4} />` | Table | `<SkeletonTable rows={10} columns={6} />` |
| `<SkeletonAvatar size={48} />` | Avatar | `<SkeletonAvatar size={64} />` |
| `<SkeletonButton />` | Button | `<SkeletonButton />` |
| `<SkeletonList items={5} />` | List with avatars | `<SkeletonList items={10} />` |

---

## 🔔 Toast Types

| Type | Method | Color | Use Case |
|------|--------|-------|----------|
| Success | `success('message')` | Green | Successful operations |
| Error | `error('message')` | Red | Failed operations |
| Warning | `warning('message')` | Yellow | Warnings |
| Info | `info('message')` | Blue | Information |

---

## 🔄 React Query Patterns

### Basic Query

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['key'],
  queryFn: fetchFunction,
})
```

### Query with Parameters

```typescript
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  enabled: !!userId, // Only run if userId exists
})
```

### Mutation

```typescript
const mutation = useMutation({
  mutationFn: createItem,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
    toast.success('Item created!')
  },
  onError: (error) => {
    toast.error(error.message)
  },
})

// Use it
mutation.mutate(newItem)
```

### Optimistic Update

```typescript
const mutation = useMutation({
  mutationFn: updateItem,
  onMutate: async (newItem) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['items'] })
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['items'])
    
    // Optimistically update
    queryClient.setQueryData(['items'], (old) => [...old, newItem])
    
    return { previous }
  },
  onError: (err, newItem, context) => {
    // Rollback on error
    queryClient.setQueryData(['items'], context.previous)
  },
  onSettled: () => {
    // Refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['items'] })
  },
})
```

---

## 🛠️ Development Tools

### React Query DevTools

- Automatically available in development
- Bottom-right corner of the screen
- View all queries, mutations, and cache
- Manually trigger refetches
- Inspect query states

### Vitest UI

```bash
npm run test:ui
```

- Visual test runner
- See test results in browser
- Filter and search tests
- View coverage

---

## 📝 Code Snippets

### Complete Page with All Features

```typescript
import { useQuery } from '@tanstack/react-query'
import { useToast } from '../lib/ToastContext'
import { SkeletonTable } from '../components/Skeleton'
import { supabase } from '../lib/supabase'

export default function MyPage() {
  const { success, error: showError } = useToast()

  const { data, isLoading, error } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('items').select()
      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return <SkeletonTable rows={5} columns={4} />
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      <h1>My Page</h1>
      <table>
        {data?.map(item => (
          <tr key={item.id}>
            <td>{item.name}</td>
          </tr>
        ))}
      </table>
    </div>
  )
}
```

### Form with Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../lib/ToastContext'
import { supabase } from '../lib/supabase'

export default function CreateForm() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  const mutation = useMutation({
    mutationFn: async (formData) => {
      const { data, error } = await supabase
        .from('items')
        .insert(formData)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      success('Item created successfully!')
    },
    onError: (error) => {
      showError(error.message || 'Failed to create item')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    mutation.mutate(Object.fromEntries(formData))
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
```

---

## 🚀 Best Practices

### 1. Always Use Skeletons for Loading States
```typescript
// ❌ Bad
if (loading) return <div>Loading...</div>

// ✅ Good
if (loading) return <SkeletonTable rows={5} columns={4} />
```

### 2. Use Toast for User Feedback
```typescript
// ❌ Bad
const [message, setMessage] = useState('')
setMessage('Success!')

// ✅ Good
const { success } = useToast()
success('Success!')
```

### 3. Use React Query for Data Fetching
```typescript
// ❌ Bad
const [data, setData] = useState([])
useEffect(() => { fetchData() }, [])

// ✅ Good
const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData })
```

### 4. Write Tests for New Features
```typescript
// Always write tests
describe('MyFeature', () => {
  it('should work correctly', () => {
    // Test implementation
  })
})
```

### 5. Handle Errors Gracefully
```typescript
// Error boundary catches React errors
// Toast shows user-friendly messages
// React Query handles API errors
```

---

## 📚 Additional Resources

- [React Query Docs](https://tanstack.com/query/latest)
- [Vitest Docs](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

---

## 🆘 Troubleshooting

### Tests Not Running
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm run test
```

### React Query Not Caching
- Check queryKey is consistent
- Verify staleTime configuration
- Use DevTools to inspect cache

### Skeleton Not Showing
- Check if isLoading is true
- Verify skeleton component import
- Check CSS is loaded

### Toast Not Appearing
- Verify ToastProvider wraps your app
- Check useToast hook is called inside provider
- Inspect browser console for errors

---

Last Updated: Phase 2 Complete
