# Developer Guide - WFM Application

## Quick Start

### Running the Application
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

---

## Project Structure

```
src/
├── components/          # React components
│   ├── common/         # Reusable UI components
│   ├── forms/          # Form components
│   └── Headcount/      # Headcount-specific components
├── constants/          # Application constants
├── hooks/              # Custom React hooks
├── lib/                # Core libraries (Supabase, React Query, etc.)
├── pages/              # Page components
├── services/           # API service layer
├── test/               # Test files
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

---

## Core Concepts

### 1. Constants (`src/constants/`)
All magic values are centralized in constants:

```typescript
import { 
  ALLOWED_EMAIL_DOMAIN,
  DATE_FORMATS,
  ROUTES,
  ERROR_MESSAGES,
  PAGINATION,
} from '../constants'

// Use constants instead of hardcoded values
if (email.endsWith(ALLOWED_EMAIL_DOMAIN)) { ... }
navigate(ROUTES.DASHBOARD)
```

**Available Constants:**
- Domain & Auth
- Date Formats
- Pagination
- File Upload limits
- Leave Balances
- Cache Times
- API Endpoints
- Validation Rules
- Error/Success Messages
- Routes
- Storage Keys
- Chart Colors
- Regex Patterns

---

### 2. Services (`src/services/`)
All API calls go through the services layer:

```typescript
import { leaveRequestsService } from '../services'

// Get all leave requests
const requests = await leaveRequestsService.getLeaveRequests()

// Create a new leave request
const newRequest = await leaveRequestsService.createLeaveRequest({
  user_id: userId,
  leave_type: 'annual',
  start_date: '2024-01-01',
  end_date: '2024-01-05',
  notes: 'Vacation',
})

// Update status
await leaveRequestsService.updateLeaveRequestStatus(
  requestId,
  'approved',
  'wfm_approved_at'
)
```

**Available Services:**
- `authService` - Authentication
- `shiftsService` - Shift management
- `swapRequestsService` - Swap requests
- `leaveRequestsService` - Leave requests
- `leaveBalancesService` - Leave balances
- `commentsService` - Comments
- `settingsService` - Application settings
- `headcountService` - Employee management

---

### 3. Utilities (`src/utils/`)

#### Date Helpers
```typescript
import { 
  formatDate,
  formatDateISO,
  getDaysBetween,
  getBusinessDaysBetween,
  isValidDateRange,
} from '../utils'

// Format dates
const display = formatDate(date) // "Jan 01, 2024"
const iso = formatDateISO(date) // "2024-01-01"

// Calculate days
const days = getDaysBetween(startDate, endDate)
const businessDays = getBusinessDaysBetween(startDate, endDate)

// Validate range
if (isValidDateRange(startDate, endDate)) { ... }
```

#### Formatters
```typescript
import {
  formatCurrency,
  formatFTE,
  formatPhoneNumber,
  formatFileSize,
  truncateText,
  capitalizeWords,
  pluralize,
} from '../utils'

// Format values
const price = formatCurrency(1234.56) // "$1,234.56"
const fte = formatFTE(0.8) // "80%"
const phone = formatPhoneNumber('1234567890') // "(123) 456-7890"
const size = formatFileSize(1048576) // "1 MB"

// Text manipulation
const short = truncateText('Long text...', 10)
const title = capitalizeWords('hello world') // "Hello World"
const word = pluralize(5, 'item') // "items"
```

#### CSV Helpers
```typescript
import {
  parseCSV,
  arrayToCSV,
  downloadCSV,
  validateAndParseCSV,
} from '../utils'

// Parse CSV
const data = parseCSV(csvText)

// Generate CSV
const csv = arrayToCSV(data)

// Download CSV
downloadCSV('export.csv', csv)

// Validate and parse file
const result = await validateAndParseCSV(file)
if (result.success) {
  console.log(result.data)
} else {
  console.error(result.error)
}
```

---

### 4. Validation (`src/utils/validators.ts`)
Use Zod schemas for form validation:

```typescript
import { loginSchema, leaveRequestSchema } from '../utils/validators'

// Validate login form
const result = loginSchema.safeParse(formData)
if (!result.success) {
  // Show validation errors
  result.error.errors.forEach(err => {
    console.error(err.path, err.message)
  })
} else {
  // Data is valid and type-safe
  const { email, password } = result.data
  await signIn(email, password)
}

// Validate leave request
const leaveResult = leaveRequestSchema.safeParse(formData)
if (leaveResult.success) {
  await leaveRequestsService.createLeaveRequest(leaveResult.data)
}
```

**Available Schemas:**
- `loginSchema`
- `signupSchema`
- `leaveRequestSchema`
- `swapRequestSchema`
- `commentSchema`
- `employeeSchema`
- `settingsSchema`
- `csvShiftSchema`
- `csvLeaveBalanceSchema`

---

## Common Patterns

### 1. Creating a New Page

```typescript
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../constants'
import { formatDate } from '../utils'

export default function MyPage() {
  const { user, isWFM } = useAuth()
  
  // Your component logic
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Page</h1>
      {/* Your content */}
    </div>
  )
}
```

### 2. Fetching Data with React Query

```typescript
import { useQuery } from '@tanstack/react-query'
import { leaveRequestsService } from '../services'
import { CACHE_TIME } from '../constants'

export function useLeaveRequests() {
  return useQuery({
    queryKey: ['leaveRequests'],
    queryFn: () => leaveRequestsService.getLeaveRequests(),
    staleTime: CACHE_TIME.MEDIUM,
  })
}

// In component
function MyComponent() {
  const { data, isLoading, error } = useLeaveRequests()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <div>{/* Render data */}</div>
}
```

### 3. Creating a Form with Validation

```typescript
import { useState } from 'react'
import { loginSchema } from '../utils/validators'
import { authService } from '../services'
import { ERROR_MESSAGES } from '../constants'

export function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    const result = loginSchema.safeParse(formData)
    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.errors.forEach(err => {
        newErrors[err.path[0]] = err.message
      })
      setErrors(newErrors)
      return
    }
    
    // Submit
    try {
      await authService.signIn(result.data.email, result.data.password)
    } catch (error) {
      setErrors({ general: ERROR_MESSAGES.AUTH })
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### 4. Handling Errors

```typescript
import { handleError, handleDatabaseError } from '../lib/errorHandler'
import { ERROR_MESSAGES } from '../constants'

async function fetchData() {
  try {
    const data = await service.getData()
    return data
  } catch (error) {
    // Use error handler
    handleDatabaseError(error, 'fetch data')
    
    // Or use custom message
    handleError(error, {
      userMessage: ERROR_MESSAGES.NETWORK,
      logToConsole: true,
    })
  }
}
```

---

## Testing

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest'
import { formatDate } from '../utils'

describe('formatDate', () => {
  it('should format date correctly', () => {
    const result = formatDate('2024-01-01')
    expect(result).toBe('Jan 01, 2024')
  })
  
  it('should handle invalid dates', () => {
    const result = formatDate('invalid')
    expect(result).toBe('')
  })
})
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:ui

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage
```

---

## Best Practices

### 1. Always Use Constants
❌ **Bad:**
```typescript
if (email.endsWith('@dabdoob.com'))
```

✅ **Good:**
```typescript
import { ALLOWED_EMAIL_DOMAIN } from '../constants'
if (email.endsWith(ALLOWED_EMAIL_DOMAIN))
```

### 2. Always Use Services
❌ **Bad:**
```typescript
const { data } = await supabase.from('shifts').select('*')
```

✅ **Good:**
```typescript
import { shiftsService } from '../services'
const data = await shiftsService.getShifts()
```

### 3. Always Validate User Input
❌ **Bad:**
```typescript
if (!email || !password) return
```

✅ **Good:**
```typescript
import { loginSchema } from '../utils/validators'
const result = loginSchema.safeParse({ email, password })
if (!result.success) return
```

### 4. Always Use Utility Functions
❌ **Bad:**
```typescript
const formatted = format(new Date(date), 'MMM dd, yyyy')
```

✅ **Good:**
```typescript
import { formatDate } from '../utils'
const formatted = formatDate(date)
```

### 5. Always Handle Errors
❌ **Bad:**
```typescript
const data = await service.getData()
```

✅ **Good:**
```typescript
try {
  const data = await service.getData()
} catch (error) {
  handleError(error)
}
```

---

## Debugging

### Common Issues

#### 1. TypeScript Errors
```bash
# Check for TypeScript errors
npm run build
```

#### 2. Test Failures
```bash
# Run tests with verbose output
npm run test -- --reporter=verbose
```

#### 3. Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### 4. Dev Server Issues
```bash
# Kill existing process and restart
# Windows
taskkill /F /IM node.exe
npm run dev

# Linux/Mac
killall node
npm run dev
```

---

## Performance Tips

### 1. Use React Query for Data Fetching
```typescript
// Automatic caching, refetching, and error handling
const { data } = useQuery({
  queryKey: ['key'],
  queryFn: () => service.getData(),
  staleTime: CACHE_TIME.MEDIUM,
})
```

### 2. Lazy Load Heavy Components
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'))

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### 3. Debounce Search Inputs
```typescript
import { debounce } from '../lib/performance'
import { DELAYS } from '../constants'

const debouncedSearch = debounce(handleSearch, DELAYS.SEARCH_DEBOUNCE)
```

### 4. Use Memoization
```typescript
import { useMemo, useCallback } from 'react'

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

const handleClick = useCallback(() => {
  doSomething()
}, [])
```

---

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zod Documentation](https://zod.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## Getting Help

1. Check this guide first
2. Review the [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
3. Check the [README.md](./README.md)
4. Look at existing code examples
5. Ask the team

---

**Last Updated**: February 7, 2026  
**Version**: 1.0.0
