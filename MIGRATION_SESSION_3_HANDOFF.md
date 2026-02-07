# Migration Session 3 - Handoff Document

## 🎯 Current Status: 58% Complete (11/19 files)

**Date:** February 7, 2026  
**Session:** 3  
**Agent:** Continuing migration work

---

## ✅ What's Been Completed (11 Files)

### Session 1 (4 files):
1. ✅ `src/lib/AuthContext.tsx`
2. ✅ `src/pages/Login.tsx`
3. ✅ `src/pages/Signup.tsx`
4. ✅ `src/pages/Dashboard.tsx`

### Session 2 (7 files):
5. ✅ `src/pages/Schedule.tsx` (948 lines) - Complex shift/leave management
6. ✅ `src/pages/LeaveRequests.tsx`
7. ✅ `src/pages/SwapRequests.tsx`
8. ✅ `src/pages/Settings.tsx`
9. ✅ `src/pages/LeaveRequestDetail.tsx` (600+ lines)
10. ✅ `src/pages/SwapRequestDetail.tsx` (865 lines)
11. ✅ `src/pages/CreateLeaveRequest.tsx` - **Zod validation added!**

---

## 🎯 Your Mission: Complete Remaining 8 Files

### Immediate Priority (1 file - START HERE):
1. **`src/pages/CreateSwapRequest.tsx`** - Add Zod validation (similar to CreateLeaveRequest)
   - Add `swapRequestSchema` validation
   - Use `shiftsService` for shift fetching
   - Use `ROUTES` constants
   - Use `ERROR_MESSAGES` constants
   - Estimated time: 15-20 minutes

### Medium Priority (3 files):
2. **`src/pages/LeaveBalances.tsx`** - Use leaveBalancesService
3. **`src/pages/ScheduleUpload.tsx`** - Use CSV helpers
4. **`src/pages/Reports.tsx`** - Use date helpers + formatters

### Lower Priority (4 files):
5. **`src/pages/Headcount/EmployeeDirectory.tsx`**
6. **`src/pages/Headcount/EmployeeDetail.tsx`**
7. **`src/pages/Headcount/HeadcountDashboard.tsx`**
8. **`src/components/Headcount/EmployeeTable.tsx`**

---

## 🚀 Quick Start Commands

```bash
# Test everything (should pass 80/80)
npm run test:run

# Build (should succeed)
npm run build

# Dev server
npm run dev

# Commit changes
git add .
git commit -m "refactor: Migrate [filename] to use services/utils"
git push origin main
```

---

## 📋 Migration Pattern (Copy-Paste Template)

### For CreateSwapRequest.tsx:

```typescript
// 1. UPDATE IMPORTS
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase' // Keep for custom queries if needed
import type { ShiftType, User } from '../types'
import { swapRequestsService, shiftsService } from '../services'
import { formatDate, isValidDateRange } from '../utils'
import { swapRequestSchema } from '../utils/validators'
import { ROUTES, ERROR_MESSAGES } from '../constants'

// 2. REPLACE SERVICE CALLS
// OLD:
const { data, error } = await supabase.from('shifts').select('*')

// NEW:
const data = await shiftsService.getShifts(startDate, endDate)

// 3. ADD ZOD VALIDATION IN SUBMIT
const result = swapRequestSchema.safeParse({
  requester_id: user.id,
  target_user_id: targetUserId,
  requester_shift_id: requesterShiftId,
  target_shift_id: targetShiftId,
})

if (!result.success) {
  setError(result.error.issues[0].message)
  return
}

// 4. USE CONSTANTS
navigate(ROUTES.SWAP_REQUESTS)
setError(ERROR_MESSAGES.SERVER)
```

---

## 📚 Available Resources

### Services (Import from '../services'):
```typescript
import { 
  authService,
  shiftsService,
  swapRequestsService,
  leaveRequestsService,
  leaveBalancesService,
  commentsService,
  settingsService,
  headcountService 
} from '../services'
```

### Utilities (Import from '../utils'):
```typescript
import {
  // Date helpers
  formatDate,           // "Jan 01, 2024"
  formatDateTime,       // "Jan 01, 2024 2:30 PM"
  formatDateISO,        // "2024-01-01"
  getDaysBetween,       // 5
  isValidDateRange,     // true/false
  
  // Formatters
  formatCurrency,
  formatFTE,
  formatPhoneNumber,
  
  // CSV helpers
  parseCSV,
  downloadCSV,
  validateAndParseCSV
} from '../utils'
```

### Validators (Import from '../utils/validators'):
```typescript
import {
  loginSchema,
  signupSchema,
  leaveRequestSchema,
  swapRequestSchema,
  // ... more schemas
} from '../utils/validators'
```

### Constants (Import from '../constants'):
```typescript
import {
  ROUTES,              // All routes
  ERROR_MESSAGES,      // Error messages
  SUCCESS_MESSAGES,    // Success messages
  DATE_FORMATS,        // Date format strings
  PAGINATION,          // Page sizes
  FILE_UPLOAD,         // File limits
  VALIDATION,          // Validation rules
  API_ENDPOINTS        // Table names
} from '../constants'
```

---

## ✅ Testing Checklist (After Each File)

```bash
# 1. Run tests
npm run test:run
# Expected: ✅ 80/80 tests passing

# 2. Build
npm run build
# Expected: ✅ Build successful, 0 errors

# 3. Check diagnostics (optional)
# Use getDiagnostics tool in Kiro

# 4. Commit
git add .
git commit -m "refactor: Migrate CreateSwapRequest to use services/utils"
git push origin main
```

---

## 🎓 Key Patterns from Previous Migrations

### Pattern 1: Service Migration
```typescript
// BEFORE
const { data, error } = await supabase
  .from('table_name')
  .select('*')
if (error) throw error

// AFTER
const data = await serviceName.getItems()
```

### Pattern 2: Zod Validation (Forms)
```typescript
// BEFORE
if (!field) {
  setError('Field required')
  return
}

// AFTER
const result = schemaName.safeParse(data)
if (!result.success) {
  setError(result.error.issues[0].message)
  return
}
```

### Pattern 3: Date Utilities
```typescript
// BEFORE
const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

// AFTER
const days = getDaysBetween(start, end)
```

### Pattern 4: Constants
```typescript
// BEFORE
navigate('/swap-requests')
setError('Server error. Please try again.')

// AFTER
navigate(ROUTES.SWAP_REQUESTS)
setError(ERROR_MESSAGES.SERVER)
```

---

## 🔍 Example: CreateLeaveRequest.tsx (Just Completed)

This file is a perfect reference for CreateSwapRequest.tsx:

**Key changes made:**
1. ✅ Added Zod validation with `leaveRequestSchema`
2. ✅ Used `leaveBalancesService.getLeaveBalance()`
3. ✅ Used `getDaysBetween()` utility
4. ✅ Used `isValidDateRange()` utility
5. ✅ Used `ROUTES.LEAVE_REQUESTS` constant
6. ✅ Used `ERROR_MESSAGES.SERVER` constant

**Location:** `src/pages/CreateLeaveRequest.tsx`

---

## ⚠️ Important Notes

### 1. Zod Validation
- Use `result.error.issues[0]` NOT `result.error.errors[0]`
- Always check `!result.success` before accessing error

### 2. Service Imports
- Import from `'../services'` NOT individual files
- Example: `import { shiftsService } from '../services'`

### 3. Keep Supabase for Custom Logic
- If a service doesn't support your use case, keep Supabase call
- Example: CreateLeaveRequest keeps Supabase for custom status logic

### 4. Test Frequently
- Test after EACH file migration
- Don't migrate multiple files without testing

### 5. Commit Small Changes
- One file per commit
- Clear commit messages

---

## 📊 Current Metrics

### Code Quality:
- ✅ **Tests:** 80/80 passing (100%)
- ✅ **Build:** Successful (4.68s)
- ✅ **TypeScript Errors:** 0
- ✅ **Diagnostics:** 0 issues

### Migration Progress:
- ✅ **Files Migrated:** 11/19 (58%)
- ✅ **Supabase Calls Removed:** ~110+
- ✅ **Hardcoded Values Replaced:** ~60+
- ✅ **Local Functions Eliminated:** ~12

---

## 🎯 Success Criteria for Each File

A file is successfully migrated when:
1. ✅ No direct Supabase calls (or minimal for custom logic)
2. ✅ No hardcoded strings (uses constants)
3. ✅ Forms have Zod validation
4. ✅ Dates use formatters
5. ✅ All tests pass (80/80)
6. ✅ Build succeeds
7. ✅ No TypeScript errors

---

## 📖 Documentation to Read

### Must Read (Priority Order):
1. **This document** - You're reading it! ✅
2. **`MIGRATION_HANDOFF.md`** - Complete patterns and examples
3. **`src/pages/CreateLeaveRequest.tsx`** - Just completed, perfect reference
4. **`DEVELOPER_GUIDE.md`** - Usage examples for all utilities

### Reference:
5. **`MIGRATION_COMPLETE_SUMMARY.md`** - Overall progress
6. **`QUICK_START_NEXT_DEV.md`** - Quick commands
7. **`src/constants/index.ts`** - All available constants
8. **`src/services/index.ts`** - All available services
9. **`src/utils/index.ts`** - All available utilities

---

## 🚨 Common Issues & Solutions

### Issue 1: "Type 'undefined' is not assignable to type 'string | null'"
**Solution:** Use `null` instead of `undefined`
```typescript
// WRONG
notes: notes || undefined

// RIGHT
notes: notes || null
```

### Issue 2: "Property 'status' does not exist in type..."
**Solution:** Service doesn't accept that field, use Supabase directly or remove field
```typescript
// If service doesn't support custom status
const { error } = await supabase.from('table').insert({ ...data, status })
```

### Issue 3: Unused imports
**Solution:** Remove unused imports
```typescript
// If you import but don't use, remove it
import { ROUTES } from '../constants' // ❌ Remove if not used
```

---

## 💡 Pro Tips

### 1. Look at Similar Files
- CreateSwapRequest is similar to CreateLeaveRequest
- Detail pages follow same pattern
- List pages follow same pattern

### 2. Use Find & Replace
- Find: `format(new Date(date), 'MMM d, yyyy')`
- Replace: `formatDate(date)`

### 3. Test Early, Test Often
- Run tests after each major change
- Don't wait until the end

### 4. Copy Import Statements
- Copy imports from similar migrated files
- Saves time and ensures consistency

### 5. Check Service Methods First
- Read the service file before migrating
- Know what methods are available
- Don't assume methods exist

---

## 🎉 What You'll Accomplish

By completing the remaining 8 files, you will:
- ✅ Achieve **100% migration** of high/medium priority files
- ✅ Remove **ALL** direct Supabase calls from main features
- ✅ Establish **complete consistency** across the codebase
- ✅ Make the codebase **significantly more maintainable**
- ✅ Set up **perfect foundation** for future development

---

## 📞 Need Help?

### Check These Resources:
1. `MIGRATION_HANDOFF.md` - Complete migration guide
2. `DEVELOPER_GUIDE.md` - Usage examples
3. Already migrated files - Look for patterns
4. Service implementations - See what's available

### Common Questions:

**Q: Service doesn't have the method I need?**
A: Keep the Supabase call. It's okay to mix patterns for custom logic.

**Q: Should I migrate hooks too?**
A: Optional. Focus on pages first. Hooks can be done later.

**Q: Tests failing after migration?**
A: Check imports, make sure all services are imported correctly.

**Q: Build failing with type errors?**
A: Check service method signatures, ensure types match.

---

## 🏁 Final Checklist Before Starting

- [ ] Read this document completely
- [ ] Read `MIGRATION_HANDOFF.md`
- [ ] Review `src/pages/CreateLeaveRequest.tsx`
- [ ] Run `npm run test:run` to confirm baseline (80/80 passing)
- [ ] Run `npm run build` to confirm baseline (successful)
- [ ] Start with `src/pages/CreateSwapRequest.tsx`

---

## 🚀 Ready to Start!

**Your first task:** Migrate `src/pages/CreateSwapRequest.tsx`

**Estimated time:** 15-20 minutes

**Pattern to follow:** Same as CreateLeaveRequest.tsx

**Key changes needed:**
1. Add Zod validation with `swapRequestSchema`
2. Use `shiftsService` for shift fetching
3. Use `ROUTES.SWAP_REQUESTS` constant
4. Use `ERROR_MESSAGES` constants
5. Use `formatDate()` for date formatting

**Good luck! You've got this! 🎯**

---

**Created:** February 7, 2026  
**Status:** Ready for Session 3  
**Progress:** 58% Complete (11/19 files)  
**Next File:** CreateSwapRequest.tsx  
**Estimated Remaining Time:** 2-3 hours for all 8 files

