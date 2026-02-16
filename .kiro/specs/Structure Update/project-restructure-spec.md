# WFM Project Restructure Specification

**Version:** 1.0  
**Date:** 2026-02-16  
**Status:** DRAFT - Awaiting Approval

---

## Executive Summary

This spec addresses structural inconsistencies in the WFM codebase. The project has grown organically without clear architectural rules, leading to:
- Mixed file vs directory patterns for components and pages
- Root directory clutter with tracking documents
- Confusion about when to create subdirectories
- Debugging artifacts committed to version control

**Goal:** Establish clear, consistent organization rules that scale.

---

## Current State Analysis

### ✅ What's Working

**Flat file structures** (consistent and maintainable):
- `src/services/` - 17 flat service files + index
- `src/hooks/` - 15 flat hook files
- `src/utils/` - 6 flat utility files + index
- `src/types/` - 4 flat type files + index
- `src/contexts/` - 2 flat context files
- `src/lib/` - 10 flat library files
- `src/constants/` - 2 flat constant files + index

**Well-organized directories**:
- `src/validation/schemas/` - Clear separation of schemas from validators
- `src/components/icons/` - All icon components in one place
- `docs/` - Documentation in dedicated directory
- `src/test/` - Mirrors source structure

### ❌ Structural Problems

#### Problem 1: Inconsistent Component Organization

**Mixed pattern with no clear rule:**

```
src/components/
├── StatCard.tsx              ← Single file
├── StatusBadge.tsx           ← Single file
├── Toast.tsx                 ← Single file
├── Skeleton.tsx              ← Single file
├── BreakSchedule/            ← Directory (10 files)
│   ├── AgentRow.tsx
│   ├── AutoDistributeModal.tsx
│   ├── BreakCell.tsx
│   └── ...
├── Headcount/                ← Directory (4 files)
│   ├── EditEmployeeModal.tsx
│   ├── EmployeeCard.tsx
│   └── ...
├── Settings/                 ← Directory (2 files) ⚠️
│   ├── AutoDistributionSettings.tsx
│   └── ShiftConfigurations.tsx
└── icons/                    ← Directory (15 files)
    ├── BalanceIcon.tsx
    └── ...
```

**Issues:**
- No threshold rule for when to create a directory
- `Settings/` has only 2 files - doesn't justify directory
- Impossible to predict structure without reading code

#### Problem 2: Inconsistent Page Organization

**Same mixed pattern:**

```
src/pages/
├── Dashboard.tsx             ← Single file
├── BreakSchedule.tsx         ← Single file
├── RequestManagement.tsx     ← Single file
├── NotFound.tsx              ← Single file
├── Auth/                     ← Directory (3 files)
│   ├── Login.tsx
│   ├── Signup.tsx
│   └── Unauthorized.tsx
├── Headcount/                ← Directory (3 files)
│   ├── EmployeeDetail.tsx
│   ├── EmployeeDirectory.tsx
│   └── HeadcountDashboard.tsx
├── Schedule/                 ← Directory (2 files) ⚠️
│   ├── Schedule.tsx
│   └── ScheduleUpload.tsx
├── Settings/                 ← Directory (5 files)
│   ├── index.tsx
│   ├── GeneralSettings.tsx
│   └── ...
├── LeaveRequests/            ← Directory (4 files)
├── SwapRequests/             ← Directory (3 files)
└── Reports/                  ← Directory (5 files)
```

**Issues:**
- Same lack of clear rules
- `Schedule/` has only 2 files
- Feature pages scattered between flat files and directories

#### Problem 3: Root Directory Clutter

**Unnecessary files in project root:**

```
WFM/
├── IMPROVEMENTS_SUMMARY.md        ← Should be in docs/
├── SECURITY-FIX-INSTRUCTIONS.md   ← Should be in docs/
├── VERIFICATION_CHECKLIST.md      ← Should be in docs/
├── test_out.txt                   ← Debug artifact, shouldn't be committed
└── ...
```

**Issues:**
- Tracking/checklist documents pollute root
- Debug files in version control
- Makes root harder to navigate

---

## Proposed Structure

### Core Principle

**"Optimize for deletion, not creation."**

Keep structures flat until complexity demands otherwise. Use clear, numeric thresholds for when to create subdirectories.

### Organization Rules

#### Rule 1: Component Organization

**Threshold: 3+ related files = subdirectory**

```
src/components/
├── StatCard.tsx                     ← Single component (stays flat)
├── StatusBadge.tsx                  ← Single component (stays flat)
├── Toast.tsx                        ← Single component (stays flat)
├── Skeleton.tsx                     ← Single component (stays flat)
├── BreakSchedule/                   ← 10 files (justified)
│   ├── index.tsx                    ← Re-exports main component
│   ├── BreakScheduleTable.tsx       ← Main component
│   ├── AgentRow.tsx
│   ├── BreakCell.tsx
│   └── ...
├── Headcount/                       ← 4 files (justified)
│   ├── index.tsx
│   ├── EmployeeTable.tsx
│   └── ...
├── Settings/                        ← FLATTEN (only 2 files)
├── icons/                           ← Keep (15 files, special category)
│   ├── index.ts
│   └── ...
└── shared/                          ← NEW: Common UI components
    ├── ErrorBoundary.tsx
    ├── PageErrorBoundary.tsx
    ├── ChunkErrorBoundary.tsx
    ├── ProtectedRoute.tsx
    ├── PublicRoute.tsx
    ├── Layout.tsx
    ├── Pagination.tsx
    └── ViewToggle.tsx
```

**Changes:**
- **Flatten** `Settings/` (move AutoDistributionSettings.tsx and ShiftConfigurations.tsx to components/)
- **Create** `shared/` directory for common infrastructure components
- **Add** `index.tsx` to all directories for clean imports

#### Rule 2: Page Organization

**Threshold: 2+ related page files = subdirectory**

```
src/pages/
├── Dashboard.tsx                    ← Single page (stays flat)
├── BreakSchedule.tsx                ← Single page (stays flat)
├── RequestManagement.tsx            ← Single page (stays flat)
├── NotFound.tsx                     ← Single page (stays flat)
├── Auth/                            ← 3 files (justified)
│   ├── index.ts
│   ├── Login.tsx
│   ├── Signup.tsx
│   └── Unauthorized.tsx
├── Headcount/                       ← 3 files (justified)
│   ├── index.ts
│   ├── EmployeeDetail.tsx
│   ├── EmployeeDirectory.tsx
│   └── HeadcountDashboard.tsx
├── Schedule/                        ← 2 files (justified - related feature)
│   ├── index.ts
│   ├── Schedule.tsx
│   └── ScheduleUpload.tsx
├── Settings/                        ← 5 files (justified)
├── LeaveRequests/                   ← 4 files (justified)
├── SwapRequests/                    ← 3 files (justified)
└── Reports/                         ← 5 files (justified)
```

**Changes:**
- Keep current structure (already follows threshold rule)
- Add `index.ts` files to all directories for clean imports

#### Rule 3: Root Directory Cleanup

**Only essential config and docs in root:**

```
WFM/
├── .env.example
├── .env.test
├── .env.test.example
├── .gitignore
├── README.md                   ← Keep (primary documentation)
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── eslint.config.js
├── vercel.json
├── index.html
├── docs/
│   ├── project-tracking/       ← NEW subdirectory
│   │   ├── improvements-summary.md
│   │   ├── security-fix-instructions.md
│   │   └── verification-checklist.md
│   └── ...
├── src/
├── supabase/
└── ...
```

**Changes:**
- **Move** IMPROVEMENTS_SUMMARY.md → docs/project-tracking/improvements-summary.md
- **Move** SECURITY-FIX-INSTRUCTIONS.md → docs/project-tracking/security-fix-instructions.md
- **Move** VERIFICATION_CHECKLIST.md → docs/project-tracking/verification-checklist.md
- **Delete** test_out.txt (debug artifact)
- **Create** docs/project-tracking/ subdirectory

---

## Migration Plan

### Phase 1: Root Cleanup (Low Risk)
**Estimated time: 5 minutes**

1. Create `docs/project-tracking/` directory
2. Move tracking documents:
   - `IMPROVEMENTS_SUMMARY.md` → `docs/project-tracking/improvements-summary.md`
   - `SECURITY-FIX-INSTRUCTIONS.md` → `docs/project-tracking/security-fix-instructions.md`
   - `VERIFICATION_CHECKLIST.md` → `docs/project-tracking/verification-checklist.md`
3. Delete `test_out.txt`
4. Update any references in documentation

**Risk:** Very low - no code dependencies

### Phase 2: Component Reorganization (Medium Risk)
**Estimated time: 15 minutes**

#### 2.1: Create shared components directory
```bash
mkdir src/components/shared
```

Move infrastructure components:
- `ErrorBoundary.tsx` → `shared/ErrorBoundary.tsx`
- `PageErrorBoundary.tsx` → `shared/PageErrorBoundary.tsx`
- `ChunkErrorBoundary.tsx` → `shared/ChunkErrorBoundary.tsx`
- `ProtectedRoute.tsx` → `shared/ProtectedRoute.tsx`
- `PublicRoute.tsx` → `shared/PublicRoute.tsx`
- `Layout.tsx` → `shared/Layout.tsx`
- `Pagination.tsx` → `shared/Pagination.tsx`
- `ViewToggle.tsx` → `shared/ViewToggle.tsx`

Create `src/components/shared/index.tsx` with re-exports.

#### 2.2: Flatten Settings directory
```bash
mv src/components/Settings/AutoDistributionSettings.tsx src/components/
mv src/components/Settings/ShiftConfigurations.tsx src/components/
rmdir src/components/Settings
```

#### 2.3: Add index files to component directories
- `src/components/BreakSchedule/index.tsx`
- `src/components/Headcount/index.tsx`
- `src/components/icons/index.ts` (already exists)

**Risk:** Medium - requires import path updates

### Phase 3: Page Index Files (Low Risk)
**Estimated time: 10 minutes**

Add `index.ts` to all page directories for cleaner imports:
- `src/pages/Auth/index.ts`
- `src/pages/Headcount/index.ts`
- `src/pages/Schedule/index.ts`
- `src/pages/Settings/index.tsx` (already exists)
- `src/pages/LeaveRequests/index.ts`
- `src/pages/SwapRequests/index.ts`
- `src/pages/Reports/index.tsx` (already exists)

**Risk:** Low - doesn't change existing imports, just enables cleaner ones

### Phase 4: Verification & Testing
**Estimated time: 10 minutes**

1. Run type check: `npm run lint`
2. Run build: `npm run build`
3. Run tests: `npm run test:run`
4. Visual verification in dev mode: `npm run dev`
5. Check for broken imports
6. Verify all pages load correctly

**Total estimated time: ~40 minutes**

---

## Import Path Examples

### Before
```typescript
// Scattered imports
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { AutoDistributeModal } from '@/components/BreakSchedule/AutoDistributeModal';
import { AutoDistributionSettings } from '@/components/Settings/AutoDistributionSettings';
```

### After
```typescript
// Cleaner, more organized
import { ErrorBoundary, ProtectedRoute, Layout } from '@/components/shared';
import { BreakScheduleTable, AutoDistributeModal } from '@/components/BreakSchedule';
import { AutoDistributionSettings } from '@/components/AutoDistributionSettings';
```

---

## Decision Rules for Future Development

### When to create a component subdirectory?

**YES** if:
- 3+ related component files
- Logical grouping exists (e.g., BreakSchedule feature)
- Components are tightly coupled

**NO** if:
- Single component
- 2 loosely related components
- Generic/reusable component

### When to create a page subdirectory?

**YES** if:
- 2+ page files for same feature
- Feature has detail/list/create pages
- Pages share state or context

**NO** if:
- Single page
- Unrelated pages

### When to commit tracking documents?

**Never commit to root.**
- Use `docs/project-tracking/` for checklists/summaries
- Use GitHub Issues/Projects for active tracking
- Use git commit messages for change history

---

## Benefits

### Immediate
1. **Predictable structure** - Clear rules for developers
2. **Cleaner root** - Easier to navigate project
3. **Better imports** - Grouped related components
4. **Less noise** - No debug files in git

### Long-term
1. **Scalable** - Rules work as project grows
2. **Maintainable** - Easy to onboard new developers
3. **Consistent** - No guessing about file placement
4. **Deletable** - Can easily remove features/modules

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Broken imports during migration | High | Phase by phase approach, test after each |
| Build failures | High | Run type check + build after each phase |
| Git history confusion | Low | Document moves in commit message |
| Developer confusion | Medium | Update this spec in docs/, communicate changes |

---

## Approval Checklist

Before proceeding with migration:

- [ ] Review proposed structure
- [ ] Confirm organization rules make sense
- [ ] Approve migration plan
- [ ] Set aside 40 minutes for migration
- [ ] Ensure clean git state (commit/stash changes)
- [ ] Ready to test after migration

---

## Post-Migration

1. Update `docs/developer-onboarding.md` with new structure rules
2. Add this spec to `docs/` for reference
3. Communicate changes to team
4. Update any custom scripts/tools that reference old paths

---

**Ready to proceed?** Reply with:
- `APPROVED` - Execute full migration
- `APPROVED-PARTIAL [phase numbers]` - Execute specific phases only
- `CHANGES-REQUESTED [details]` - Modify spec before execution
- `REJECTED` - Cancel restructure
