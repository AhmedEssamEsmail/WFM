# Leave Types Centralization - Implementation Checklist

## ✅ Completed

1. **Database Migration** - `supabase/migrations/013_centralized_leave_types.sql`
   - Added `code`, `description`, `display_order` columns to `leave_types` table
   - Populated with existing leave types
   - Created indexes for performance

2. **Service Layer** - `src/services/leaveTypesService.ts`
   - Created CRUD operations for leave types
   - Exported `LeaveTypeConfig` interface

3. **Hook Layer** - `src/hooks/useLeaveTypes.ts`
   - Created React Query hook for leave types
   - Integrated with toast notifications
   - Added cache management

4. **Constants** - `src/constants/cache.ts`
   - Added `LEAVE_TYPES` query key

5. **Service Export** - `src/services/index.ts`
   - Exported `leaveTypesService`

6. **Documentation**
   - Created `LEAVE_TYPES_MIGRATION.md` with full architecture
   - Created this TODO checklist

## 🔨 TODO - Update Components

### Priority 1: Core Leave Request Pages

#### 1. `src/pages/LeaveRequests/CreateLeaveRequest.tsx`
**Current**: Hardcoded `LEAVE_TYPES` array
```typescript
const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'sick', label: 'Sick' },
  { value: 'annual', label: 'Annual' },
  // ...
]
```

**Action Required**:
- Import `useLeaveTypes` hook
- Replace hardcoded array with `leaveTypes` from hook
- Update dropdown to map over `leaveTypes`
- Handle loading state

#### 2. `src/pages/LeaveRequests/LeaveBalances.tsx`
**Current**: Hardcoded `leaveTypeLabels` and `leaveTypeOrder`
```typescript
const leaveTypeLabels: Record<LeaveType, string> = {
  annual: 'Annual',
  casual: 'Casual',
  // ...
}
const leaveTypeOrder: LeaveType[] = ['annual', 'casual', 'sick', 'public_holiday', 'bereavement']
```

**Action Required**:
- Import `useLeaveTypes` hook
- Replace hardcoded objects with dynamic data
- Sort by `display_order` from database
- Update CSV export/import to use dynamic leave types

#### 3. `src/pages/LeaveRequests/LeaveRequests.tsx`
**Current**: Uses `LEAVE_DESCRIPTIONS` from designSystem
```typescript
import { LEAVE_DESCRIPTIONS } from '../../lib/designSystem'
```

**Action Required**:
- Import `useLeaveTypes` hook
- Replace `LEAVE_DESCRIPTIONS[request.leave_type]` with lookup from `leaveTypes`
- Create helper function to get label by code

#### 4. `src/pages/Schedule/Schedule.tsx`
**Current**: Multiple hardcoded references
- `labelToLeaveTypeEnum` mapping object
- `defaultLeaveTypes` array
- Uses `LEAVE_COLORS` and `LEAVE_LABELS` from designSystem

**Action Required**:
- Import `useLeaveTypes` hook
- Remove `labelToLeaveTypeEnum` and `defaultLeaveTypes`
- Update leave type selection modal to use `leaveTypes`
- Update legend to use dynamic data
- Keep existing leave type management tab (already implemented)

### Priority 2: Design System & Utilities

#### 5. `src/lib/designSystem.ts`
**Current**: Hardcoded `LEAVE_COLORS`, `LEAVE_LABELS`, `LEAVE_DESCRIPTIONS`

**Action Required**:
- Keep existing constants as fallbacks for backward compatibility
- Add new helper functions:
  ```typescript
  export function getLeaveTypeColor(code: LeaveType, leaveTypes?: LeaveTypeConfig[]): string
  export function getLeaveTypeLabel(code: LeaveType, leaveTypes?: LeaveTypeConfig[]): string
  export function getLeaveTypeDescription(code: LeaveType, leaveTypes?: LeaveTypeConfig[]): string
  ```
- These functions check database first, fallback to hardcoded values

#### 6. `src/utils/validators.ts`
**Current**: Hardcoded enum in Zod schemas
```typescript
leave_type: z.enum(['sick', 'annual', 'casual', 'public_holiday', 'bereavement'])
```

**Action Required**:
- **Option A** (Recommended): Keep enum validation for type safety
- **Option B**: Make validation dynamic (more complex, less type-safe)
- Document that new leave types require code deployment for validation

#### 7. `src/utils/validation.ts`
**Current**: Hardcoded `validLeaveTypes` array
```typescript
const validLeaveTypes: LeaveType[] = ['sick', 'annual', 'casual', 'public_holiday', 'bereavement']
```

**Action Required**:
- **Option A** (Recommended): Keep enum validation for type safety
- **Option B**: Make async validation against database
- Add comment explaining enum limitation

### Priority 3: Reports & Other Pages

#### 8. `src/pages/Reports.tsx`
**Current**: Uses `LeaveType` type for aggregations

**Action Required**:
- Review if any hardcoded leave type references exist
- Update to use dynamic leave types if needed
- Ensure reports work with new leave types

### Priority 4: Testing

#### 9. Update Tests
**Files to update**:
- `src/test/utils/validators.test.ts`
- Any other tests referencing leave types

**Action Required**:
- Update test data to use valid leave type codes
- Mock `useLeaveTypes` hook in component tests
- Add tests for leave type service

## 🎯 Implementation Order

### Phase 1: Database & Core Services (✅ DONE)
1. Run migration
2. Create service layer
3. Create hook layer
4. Update exports and constants

### Phase 2: Update Components (🔨 IN PROGRESS)
1. Start with `CreateLeaveRequest.tsx` (most critical)
2. Update `LeaveBalances.tsx`
3. Update `LeaveRequests.tsx`
4. Update `Schedule.tsx`

### Phase 3: Design System & Utilities
1. Add helper functions to `designSystem.ts`
2. Decide on validation strategy
3. Update validators if needed

### Phase 4: Testing & Verification
1. Test all updated components
2. Verify existing data still works
3. Test WFM leave type management
4. Update tests

### Phase 5: Documentation & Cleanup
1. Update component documentation
2. Remove unused hardcoded constants
3. Add inline comments explaining enum limitations

## 🚀 Quick Start

To implement the centralized leave type system:

1. **Run the migration**:
   ```sql
   -- In Supabase SQL Editor
   -- Run: supabase/migrations/013_centralized_leave_types.sql
   ```

2. **Verify data**:
   ```sql
   SELECT * FROM leave_types ORDER BY display_order;
   ```

3. **Update a component** (example):
   ```typescript
   // Before
   const LEAVE_TYPES = [...]
   
   // After
   import { useLeaveTypes } from '../../hooks/useLeaveTypes'
   
   function MyComponent() {
     const { leaveTypes, isLoading } = useLeaveTypes()
     
     if (isLoading) return <div>Loading...</div>
     
     return (
       <select>
         {leaveTypes.map(lt => (
           <option key={lt.id} value={lt.code}>
             {lt.label}
           </option>
         ))}
       </select>
     )
   }
   ```

4. **Test the changes**:
   - Create a leave request
   - View leave balances
   - Check schedule page
   - Test WFM leave type management

## 📝 Notes

- The `leave_type` ENUM in the database remains unchanged for backward compatibility
- The `code` field in `leave_types` table maps to the enum values
- New leave types can be added via UI, but require code changes for TypeScript type safety
- Consider making validation dynamic in future for full flexibility

## ❓ Questions to Resolve

1. **Validation Strategy**: Keep enum validation or make it dynamic?
   - **Recommendation**: Keep enum for type safety, document limitation

2. **Color Format**: Use hex codes or predefined color names?
   - **Current**: Predefined names (gray, red, green, etc.)
   - **Future**: Allow hex input for full customization

3. **Backward Compatibility**: How long to maintain hardcoded fallbacks?
   - **Recommendation**: Keep indefinitely for safety

4. **New Leave Types**: Should they require code deployment?
   - **Current**: Yes (for TypeScript types and validation)
   - **Future**: Consider making fully dynamic

## 🐛 Known Issues

None yet - this is a new implementation.

## 📞 Support

If you encounter issues:
1. Check `LEAVE_TYPES_MIGRATION.md` for architecture details
2. Review service code in `src/services/leaveTypesService.ts`
3. Check database schema and RLS policies
4. Test with WFM role to access management UI
