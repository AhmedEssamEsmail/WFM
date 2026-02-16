# Structure Update - Design Document

## Architecture Overview

### Design Philosophy
The restructure follows the principle of "Optimize for deletion, not creation" - maintaining flat structures until complexity justifies hierarchy. This approach:
- Reduces cognitive overhead for developers
- Makes features easier to locate and remove
- Scales naturally as the project grows
- Provides clear, numeric decision rules

### Organization Hierarchy

```
WFM/
├── docs/
│   ├── project-tracking/          ← NEW: Tracking documents
│   └── ...
├── src/
│   ├── components/
│   │   ├── shared/                ← NEW: Infrastructure components
│   │   ├── BreakSchedule/         ← Existing (10 files)
│   │   ├── Headcount/             ← Existing (4 files)
│   │   ├── icons/                 ← Existing (15 files)
│   │   ├── StatCard.tsx           ← Flat files
│   │   ├── StatusBadge.tsx
│   │   └── ...
│   ├── pages/
│   │   ├── Auth/                  ← Existing (3 files)
│   │   ├── Headcount/             ← Existing (3 files)
│   │   ├── Schedule/              ← Existing (2 files)
│   │   ├── Settings/              ← Existing (5 files)
│   │   ├── LeaveRequests/         ← Existing (4 files)
│   │   ├── SwapRequests/          ← Existing (3 files)
│   │   ├── Reports/               ← Existing (5 files)
│   │   ├── Dashboard.tsx          ← Flat files
│   │   └── ...
│   └── ...
└── ...
```

## Component Design

### 1. Shared Components Directory

**Purpose:** Group infrastructure and cross-cutting components

**Structure:**
```
src/components/shared/
├── index.tsx                      ← Re-exports all components
├── ErrorBoundary.tsx              ← Error handling
├── PageErrorBoundary.tsx          ← Page-level errors
├── ChunkErrorBoundary.tsx         ← Code splitting errors
├── ProtectedRoute.tsx             ← Auth routing
├── PublicRoute.tsx                ← Public routing
├── Layout.tsx                     ← App layout
├── Pagination.tsx                 ← Pagination UI
└── ViewToggle.tsx                 ← View switching
```

**Index Export Pattern:**
```typescript
// src/components/shared/index.tsx
export { ErrorBoundary } from './ErrorBoundary';
export { PageErrorBoundary } from './PageErrorBoundary';
export { ChunkErrorBoundary } from './ChunkErrorBoundary';
export { ProtectedRoute } from './ProtectedRoute';
export { PublicRoute } from './PublicRoute';
export { Layout } from './Layout';
export { Pagination } from './Pagination';
export { ViewToggle } from './ViewToggle';
```

**Usage:**
```typescript
// Before
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

// After
import { ErrorBoundary, ProtectedRoute, Layout } from '@/components/shared';
```

### 2. Feature Component Directories

**Existing directories that meet threshold:**
- `BreakSchedule/` (10 files) - Break scheduling UI
- `Headcount/` (4 files) - Employee headcount UI
- `icons/` (15 files) - Icon components

**Index Pattern for Feature Components:**
```typescript
// src/components/BreakSchedule/index.tsx
export { BreakScheduleTable } from './BreakScheduleTable';
export { AgentRow } from './AgentRow';
export { AutoDistributeModal } from './AutoDistributeModal';
export { BreakCell } from './BreakCell';
// ... other exports
```

### 3. Flattened Components

**Components moving from Settings/ to root:**
- `AutoDistributionSettings.tsx` (2 files don't justify directory)
- `ShiftConfigurations.tsx`

**Import changes:**
```typescript
// Before
import { AutoDistributionSettings } from '@/components/Settings/AutoDistributionSettings';

// After
import { AutoDistributionSettings } from '@/components/AutoDistributionSettings';
```

## Page Design

### Directory Structure Rules

**Threshold: 2+ related page files = subdirectory**

All existing page directories meet this threshold:
- `Auth/` (3 files) - Login, Signup, Unauthorized
- `Headcount/` (3 files) - Directory, Detail, Dashboard
- `Schedule/` (2 files) - Schedule, ScheduleUpload
- `Settings/` (5 files) - Various settings pages
- `LeaveRequests/` (4 files) - Leave request management
- `SwapRequests/` (3 files) - Swap request management
- `Reports/` (5 files) - Reporting pages

### Index File Pattern

**Purpose:** Enable cleaner imports and logical grouping

**Example - Auth pages:**
```typescript
// src/pages/Auth/index.ts
export { default as Login } from './Login';
export { default as Signup } from './Signup';
export { default as Unauthorized } from './Unauthorized';
```

**Usage:**
```typescript
// Before
import Login from '@/pages/Auth/Login';
import Signup from '@/pages/Auth/Signup';

// After
import { Login, Signup } from '@/pages/Auth';
```

## Documentation Design

### Project Tracking Directory

**Purpose:** Centralize project management documents

**Structure:**
```
docs/
├── project-tracking/
│   ├── improvements-summary.md
│   ├── security-fix-instructions.md
│   └── verification-checklist.md
└── ...
```

**Naming Convention:**
- Use kebab-case for filenames
- Descriptive names that indicate content
- No acronyms or abbreviations

## Decision Rules

### Component Directory Decision Tree

```
Is this a new component?
├─ YES → Is it infrastructure/routing/layout?
│   ├─ YES → Place in src/components/shared/
│   └─ NO → Continue...
├─ Does it have 3+ related files?
│   ├─ YES → Create subdirectory with index.tsx
│   └─ NO → Place as flat file in src/components/
└─ Is it an icon?
    └─ YES → Place in src/components/icons/
```

### Page Directory Decision Tree

```
Is this a new page?
├─ Does it have 2+ related pages?
│   ├─ YES → Create subdirectory with index.ts
│   └─ NO → Place as flat file in src/pages/
└─ Is it part of existing feature?
    └─ YES → Add to existing directory
```

### Documentation Decision Tree

```
Is this a new document?
├─ Is it project tracking/checklist?
│   └─ YES → Place in docs/project-tracking/
├─ Is it technical documentation?
│   └─ YES → Place in docs/
├─ Is it primary README?
│   └─ YES → Keep in root
└─ Is it debug/temporary?
    └─ YES → Don't commit (add to .gitignore)
```

## Import Path Strategy

### Path Alias Usage

**Configured aliases:**
- `@/` → `src/`
- `@/components` → `src/components`
- `@/pages` → `src/pages`

**Best Practices:**
1. Always use path aliases for src/ imports
2. Use index files for grouped imports
3. Avoid deep relative paths (../../..)
4. Keep imports organized by source

**Import Organization:**
```typescript
// 1. External dependencies
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal - shared/infrastructure
import { ErrorBoundary, Layout } from '@/components/shared';

// 3. Internal - feature components
import { BreakScheduleTable } from '@/components/BreakSchedule';

// 4. Internal - utilities/services
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/utils/dateUtils';

// 5. Types
import type { Employee } from '@/types';
```

## Migration Strategy

### Phase Approach

**Phase 1: Root Cleanup (5 min)**
- Low risk, no code dependencies
- Create docs/project-tracking/
- Move tracking documents
- Delete debug files

**Phase 2: Component Reorganization (15 min)**
- Medium risk, requires import updates
- Create shared/ directory
- Move infrastructure components
- Flatten Settings/ directory
- Add index files

**Phase 3: Page Index Files (10 min)**
- Low risk, additive only
- Add index.ts to all page directories
- No breaking changes

**Phase 4: Verification (10 min)**
- Run type checking
- Run build
- Run tests
- Visual verification

### Rollback Strategy

**If issues occur:**
1. Git revert to previous commit
2. Identify specific failure
3. Fix issue in isolation
4. Re-run phase

**Checkpoints:**
- After each phase, commit changes
- Run verification before next phase
- Keep phases independent

## Testing Strategy

### Verification Steps

**After each phase:**
1. TypeScript compilation: `npm run lint`
2. Build verification: `npm run build`
3. Test suite: `npm run test:run`
4. Dev server check: `npm run dev`

**Import verification:**
- Check for TypeScript errors
- Verify no missing modules
- Confirm path resolution

**Functional verification:**
- Navigate to all major pages
- Test key user flows
- Verify no console errors

## Performance Considerations

### Build Performance
- Index files add minimal overhead
- Tree-shaking still works with re-exports
- No runtime performance impact

### Developer Experience
- Faster file location (predictable structure)
- Easier feature deletion (grouped files)
- Cleaner imports (less typing)

## Security Considerations

### No Security Impact
- Purely structural changes
- No logic modifications
- No API changes
- No data flow changes

### Best Practices Maintained
- Keep sensitive config in .env
- Don't commit secrets
- Maintain .gitignore rules

## Scalability

### Future Growth Patterns

**Adding new components:**
1. Start with flat file
2. If 3+ related files, create directory
3. Add index.tsx for exports

**Adding new pages:**
1. Start with flat file
2. If 2+ related pages, create directory
3. Add index.ts for exports

**Adding new features:**
- Follow established patterns
- Use decision trees
- Document exceptions

### Maintenance

**Regular reviews:**
- Quarterly structure audit
- Check for threshold violations
- Refactor as needed

**Documentation:**
- Keep this design doc updated
- Document exceptions
- Update onboarding materials

## Success Metrics

### Quantitative
- 0 build errors after migration
- 0 test failures after migration
- 0 TypeScript errors
- 100% of directories have index files

### Qualitative
- Developers can predict file locations
- New team members onboard faster
- Features are easier to delete
- Imports are cleaner and more readable

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Broken imports | Medium | High | Phased approach, test after each phase |
| Build failures | Low | High | Run build verification after each phase |
| Merge conflicts | Medium | Medium | Communicate changes, coordinate timing |
| Developer confusion | Low | Low | Update docs, communicate changes |
| Rollback needed | Low | Medium | Git commits after each phase |

## Future Considerations

### Potential Enhancements
- Automated structure linting
- Pre-commit hooks for structure rules
- Documentation generator
- Component dependency visualization

### Not Included in This Phase
- Component refactoring
- Performance optimization
- Feature additions
- Test coverage improvements
