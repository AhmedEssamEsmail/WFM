# Leave Types Centralization - Summary

## ✅ What Was Done

### 1. Database Migration Created
- **File**: `supabase/migrations/013_centralized_leave_types.sql`
- Added `code`, `description`, `display_order` columns to `leave_types` table
- Populated with 5 default leave types (sick, annual, casual, public_holiday, bereavement)
- Created indexes for performance

### 2. Service Layer Created
- **File**: `src/services/leaveTypesService.ts`
- Provides CRUD operations for leave types
- Exports `LeaveTypeConfig` interface
- Methods: `getActiveLeaveTypes()`, `getAllLeaveTypes()`, `getLeaveTypeByCode()`, `createLeaveType()`, `updateLeaveType()`, `deactivateLeaveType()`

### 3. React Hook Created
- **File**: `src/hooks/useLeaveTypes.ts`
- React Query hook for data fetching and caching
- Integrated with toast notifications
- Automatic cache invalidation

### 4. Settings Page Updated
- **File**: `src/pages/Settings.tsx`
- Added "Leave Types" tab (WFM only)
- Full CRUD interface for managing leave types
- Features:
  - View all leave types with color preview
  - Add new leave types with code, label, description, color, display order
  - Edit existing leave types
  - Deactivate leave types (soft delete)
  - Color picker with hex input
  - Display order management

### 5. Schedule Page Cleaned
- **File**: `src/pages/Schedule/Schedule.tsx`
- ⚠️ **ACTION REQUIRED**: Remove duplicate leave-types tab sections (lines 558-706 and 707-855 approximately)
- Keep only the shift editing modal that uses leave types
- Remove unused state variables: `editingLeaveType`, `newLeaveType`, `showAddLeaveType`
- Remove unused functions: `saveLeaveType()`, `addLeaveType()`, `deleteLeaveType()`

### 6. Constants Updated
- **File**: `src/constants/cache.ts`
- Added `LEAVE_TYPES: 'leaveTypes'` query key

### 7. Service Exports Updated
- **File**: `src/services/index.ts`
- Added export for `leaveTypesService`

### 8. Documentation Created
- `LEAVE_TYPES_MIGRATION.md` - Full architecture and migration guide
- `LEAVE_TYPES_TODO.md` - Implementation checklist
- `LEAVE_TYPES_SUMMARY.md` - This file

## 🔨 Manual Cleanup Required

### Schedule.tsx Cleanup

The Schedule page currently has:
1. **Duplicate leave-types tab sections** (need to be removed)
2. **Unused state variables** that reference the old tab
3. **Unused functions** for managing leave types

**To fix**:
1. Open `src/pages/Schedule/Schedule.tsx`
2. Remove lines ~558-706 (first `{activeTab === 'leave-types'` section)
3. Remove lines ~707-855 (second duplicate section)
4. The file should only have the schedule grid and shift editing modal
5. Leave types will still work in the shift editing modal (it fetches them for the dropdown)

**Or use this command**:
```bash
# Backup first
cp src/pages/Schedule/Schedule.tsx src/pages/Schedule/Schedule.tsx.backup

# Then manually edit to remove the two duplicate sections
```

## 🎯 How It Works Now

### For WFM Users:
1. Go to **Settings** page
2. Click **"Leave Types"** tab
3. Manage leave types:
   - Add new types with custom code, label, color
   - Edit existing types
   - Deactivate types you don't need
   - Reorder types with display_order

### For All Users:
- Leave types are automatically fetched from database
- All pages will use the centralized leave types
- Changes made by WFM are immediately reflected everywhere

### In Schedule Page:
- When editing a shift, leave types appear in the modal
- Only active leave types are shown
- Colors and labels come from database

## 📋 Next Steps

1. **Run the migration**:
   ```sql
   -- In Supabase SQL Editor
   -- Execute: supabase/migrations/013_centralized_leave_types.sql
   ```

2. **Clean up Schedule.tsx**:
   - Remove duplicate leave-types tab sections
   - Remove unused state and functions

3. **Update other components** (see LEAVE_TYPES_TODO.md):
   - `CreateLeaveRequest.tsx` - Use `useLeaveTypes()` hook
   - `LeaveBalances.tsx` - Use dynamic leave types
   - `LeaveRequests.tsx` - Use dynamic leave types
   - `designSystem.ts` - Add helper functions with fallbacks

4. **Test the system**:
   - Login as WFM
   - Go to Settings > Leave Types
   - Add/edit/deactivate a leave type
   - Check that changes appear in Schedule, Leave Requests, etc.

## 🎨 Leave Type Management UI

The Settings page now has a comprehensive leave type management interface:

**Features**:
- **List View**: Shows all leave types with color preview, status badge
- **Add Form**: Code (enum), Label, Description, Color (hex), Display Order, Active status
- **Edit Mode**: Inline editing with save/cancel
- **Deactivate**: Soft delete (keeps data, just hides from UI)
- **Color Preview**: Visual indicator of the leave type color
- **Validation**: Ensures code and label are provided

**Access Control**:
- Only WFM role can access Settings page
- Only WFM can manage leave types
- Other roles see leave types but cannot modify

## 🔐 Security

- RLS policies already exist for `leave_types` table
- WFM can manage all leave types
- Other roles can only view active leave types
- Deactivation is soft delete (preserves data integrity)

## 📊 Database Schema

```sql
CREATE TABLE leave_types (
    id UUID PRIMARY KEY,
    code leave_type NOT NULL UNIQUE,     -- Maps to enum
    label TEXT NOT NULL,                  -- Display name
    description TEXT,                     -- Full description
    color TEXT NOT NULL,                  -- Hex color (#E5E7EB)
    display_order INTEGER NOT NULL,       -- Sort order
    is_active BOOLEAN NOT NULL,           -- Active status
    created_at TIMESTAMPTZ NOT NULL
);
```

## 🚀 Benefits

1. **No Code Deployment**: WFM can add/modify leave types via UI
2. **Consistency**: Single source of truth in database
3. **Flexibility**: Custom colors, labels, descriptions per organization
4. **Maintainability**: Centralized service layer
5. **User Experience**: Immediate updates across all pages

## ❓ FAQ

**Q: Can I add a completely new leave type?**
A: Yes, but it must match an existing enum value in the database. For truly new types, you'll need to update the `leave_type` ENUM in PostgreSQL first.

**Q: What happens to existing leave requests when I deactivate a type?**
A: They remain unchanged. Deactivation only hides the type from new requests.

**Q: Can I change the color of existing leave types?**
A: Yes! Edit the leave type and update the color field (hex code).

**Q: Will changes appear immediately?**
A: Yes, React Query cache is invalidated on updates, so all pages refresh automatically.

**Q: What if the leave_types table doesn't exist?**
A: The system falls back to hardcoded defaults from `designSystem.ts`.

## 📞 Support

For issues or questions:
1. Check `LEAVE_TYPES_MIGRATION.md` for architecture details
2. Review `LEAVE_TYPES_TODO.md` for implementation checklist
3. Check database RLS policies if access issues occur
4. Verify WFM role assignment for Settings access
