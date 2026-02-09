# Centralized Leave Type Management System

## Overview

This document describes the centralized leave type management system that replaces hardcoded leave types across the application with a database-driven, configurable system.

## Problem Statement

Previously, leave types were hardcoded in multiple places:
- **Database**: ENUM type in PostgreSQL schema
- **TypeScript types**: Union type `LeaveType`
- **Design system**: Hardcoded colors, labels, descriptions
- **Components**: Hardcoded arrays in CreateLeaveRequest, LeaveBalances, Schedule
- **Validators**: Hardcoded in Zod schemas and validation functions

This made it difficult to:
- Add new leave types without code changes
- Customize leave type names and colors per organization
- Maintain consistency across pages

## Solution Architecture

### 1. Database Layer

**Migration**: `supabase/migrations/013_centralized_leave_types.sql`

The `leave_types` table now serves as the single source of truth:

```sql
CREATE TABLE leave_types (
    id UUID PRIMARY KEY,
    code leave_type NOT NULL UNIQUE,  -- Maps to enum for backward compatibility
    label TEXT NOT NULL,               -- Display name (e.g., "Sick Leave")
    description TEXT,                  -- Full description
    color TEXT NOT NULL,               -- Hex color code
    display_order INTEGER NOT NULL,    -- Sort order in UI
    is_active BOOLEAN NOT NULL,        -- Enable/disable without deletion
    created_at TIMESTAMPTZ NOT NULL
);
```

**Key Features**:
- `code` field maps to existing `leave_type` ENUM for backward compatibility
- `display_order` controls UI presentation order
- `is_active` allows soft deletion
- Pre-populated with existing leave types

### 2. Service Layer

**File**: `src/services/leaveTypesService.ts`

Provides CRUD operations for leave types:
- `getActiveLeaveTypes()` - Get all active leave types (for user-facing pages)
- `getAllLeaveTypes()` - Get all leave types including inactive (for admin)
- `getLeaveTypeByCode()` - Get specific leave type
- `createLeaveType()` - Add new leave type (WFM only)
- `updateLeaveType()` - Modify existing leave type (WFM only)
- `deactivateLeaveType()` - Soft delete leave type (WFM only)

### 3. Hook Layer

**File**: `src/hooks/useLeaveTypes.ts`

React Query hook for data fetching and caching:
```typescript
const { leaveTypes, isLoading, createLeaveType, updateLeaveType } = useLeaveTypes()
```

**Features**:
- Automatic caching with 5-minute stale time
- Optimistic updates
- Toast notifications on success/error
- Automatic cache invalidation

### 4. Type Definitions

**File**: `src/services/leaveTypesService.ts`

```typescript
export interface LeaveTypeConfig {
  id: string
  code: LeaveType              // Maps to enum
  label: string                // Display name
  description: string          // Full description
  color: string                // Hex color
  display_order: number        // Sort order
  is_active: boolean           // Active status
  created_at: string
}
```

## Migration Guide

### For Existing Pages

#### Before (Hardcoded):
```typescript
const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick' },
  { value: 'annual', label: 'Annual' },
  // ...
]
```

#### After (Dynamic):
```typescript
import { useLeaveTypes } from '../../hooks/useLeaveTypes'

function MyComponent() {
  const { leaveTypes, isLoading } = useLeaveTypes()
  
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

### Pages That Need Updates

1. **src/pages/LeaveRequests/CreateLeaveRequest.tsx**
   - Replace hardcoded `LEAVE_TYPES` array with `useLeaveTypes()` hook
   - Use `leaveTypes.map()` to render options

2. **src/pages/LeaveRequests/LeaveBalances.tsx**
   - Replace `leaveTypeLabels` and `leaveTypeOrder` with dynamic data
   - Use `leaveTypes` from hook for column headers and labels

3. **src/pages/Schedule/Schedule.tsx**
   - Replace `defaultLeaveTypes` with `useLeaveTypes()` hook
   - Update leave type selection modal to use dynamic data
   - Remove hardcoded `labelToLeaveTypeEnum` mapping

4. **src/pages/LeaveRequests/LeaveRequests.tsx**
   - Replace `LEAVE_DESCRIPTIONS` usage with dynamic `leaveTypes`

5. **src/lib/designSystem.ts**
   - Keep `LEAVE_COLORS`, `LEAVE_LABELS`, `LEAVE_DESCRIPTIONS` as fallbacks
   - Add helper functions to get colors from database or fallback to defaults

6. **src/utils/validators.ts**
   - Update Zod schemas to validate against database leave types
   - Consider making validation dynamic or keeping enum for type safety

7. **src/utils/validation.ts**
   - Update `validateLeaveType()` to check against database
   - Or keep enum validation for backward compatibility

## Benefits

### 1. Flexibility
- Add new leave types without code deployment
- Customize names and colors per organization
- Enable/disable leave types as needed

### 2. Consistency
- Single source of truth in database
- All pages automatically reflect changes
- No risk of mismatched labels across pages

### 3. Maintainability
- Centralized service layer
- Reusable hook across components
- Clear separation of concerns

### 4. User Experience
- WFM can manage leave types via UI
- Immediate updates across all pages
- No developer intervention needed

## Admin Interface

The Schedule page includes a "Leave Types" tab (WFM only) for managing leave types:

**Features**:
- View all leave types (active and inactive)
- Add new leave types with custom labels and colors
- Edit existing leave types
- Activate/deactivate leave types
- Reorder leave types (via display_order)

**Access**: Only users with `role = 'wfm'` can manage leave types

## Backward Compatibility

The system maintains backward compatibility with the existing `leave_type` ENUM:

1. **Database**: The `code` field maps to enum values
2. **TypeScript**: The `LeaveType` union type remains unchanged
3. **Validation**: Enum validation still works
4. **Existing Data**: All existing leave requests/balances continue to work

## Future Enhancements

1. **Custom Colors**: Allow hex color input instead of predefined options
2. **Accrual Rules**: Link leave types to accrual policies
3. **Approval Workflows**: Different approval chains per leave type
4. **Entitlements**: Configure default balances per leave type
5. **Reporting**: Leave type usage analytics
6. **Multi-language**: Localized labels and descriptions

## Testing Checklist

- [ ] Run migration `013_centralized_leave_types.sql`
- [ ] Verify leave_types table is populated
- [ ] Test leave type CRUD operations via service
- [ ] Test useLeaveTypes hook in components
- [ ] Update CreateLeaveRequest to use dynamic leave types
- [ ] Update LeaveBalances to use dynamic leave types
- [ ] Update Schedule to use dynamic leave types
- [ ] Test WFM leave type management UI
- [ ] Verify existing leave requests still display correctly
- [ ] Test leave type filtering and sorting
- [ ] Verify RLS policies allow proper access

## Rollback Plan

If issues arise, rollback steps:

1. Revert migration: Drop `code`, `description`, `display_order` columns
2. Revert service: Remove `leaveTypesService.ts`
3. Revert hook: Remove `useLeaveTypes.ts`
4. Restore hardcoded arrays in components
5. Remove leave type management UI from Schedule

## Support

For questions or issues with the centralized leave type system:
1. Check this documentation
2. Review service layer code in `src/services/leaveTypesService.ts`
3. Check database schema in `supabase/migrations/013_centralized_leave_types.sql`
4. Test with WFM role to access management UI
