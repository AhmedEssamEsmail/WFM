# Implementation Plan: WFM Audit Fixes

## Overview

This implementation plan addresses critical security vulnerabilities, architectural debt, and code quality issues identified in the February 2026 codebase audit. Tasks are organized by priority (P0-P5) and follow a risk-first approach: security → architecture → quality → database → testing → polish.

## Tasks

### Sprint 1 — P0 Security (Critical)

- [ ] 1. Remove hardcoded secrets from source control
  - [ ] 1.1 Remove hardcoded keys from `vite.config.ts`
    - Remove `VITE_SUPABASE_TEST_URL`, `VITE_SUPABASE_TEST_ANON_KEY`, `VITE_SUPABASE_TEST_SERVICE_KEY` from vite.config.ts test.env section
    - Configure vitest to load from `.env.test` using `envFile` option instead
    - _Requirements: SEC-01_
    - **CRITICAL: Exposed service role key is a security risk**
  
  - [x] 1.2 Remove real keys from `.env.example`, replace with placeholders
    - Replace actual Supabase keys with placeholder text
    - Update comments to guide developers
    - _Requirements: SEC-01_
  
  - [ ] 1.3 Rotate the exposed Supabase test keys
    - Regenerate test anon key in Supabase dashboard
    - Regenerate test service role key in Supabase dashboard
    - Update local `.env.test` files (not committed)
    - _Requirements: SEC-01_
    - **CRITICAL: Must rotate after removing from source control**

- [x] 2. Harden Content Security Policy
  - [x] 2.1 Remove `unsafe-eval` and harden CSP in `vercel.json`
    - Remove `'unsafe-eval'` from script-src directive
    - Replace `'unsafe-inline'` with `'strict-dynamic'` or hash-based CSP
    - Test with Vite build to ensure no breakage
    - Document any required exceptions with justification
    - _Requirements: SEC-02_
    - **Note: Still has 'unsafe-inline' for scripts and styles - acceptable for Vite/Tailwind**

- [ ]* 3. Move security audit trail server-side
  - [ ]* 3.1 Create `security_events` table migration
    - Create migration file with table schema (id, user_id, action, route, metadata, created_at)
    - Add RLS policies for security events
    - Add indexes for performance
    - _Requirements: SEC-03_
  
  - [ ]* 3.2 Refactor `securityLogger.ts` to insert server-side
    - Replace localStorage writes with Supabase inserts
    - Keep console.warn for dev mode
    - Handle insert errors gracefully
    - _Requirements: SEC-03_
    - **Note: Currently using localStorage - works but not ideal for production audit trail**

- [x] 4. Fix Sentry integration
  - [x] 4.1 Refactor `sentry.ts` with proper SDK initialization
    - Import `@sentry/react` properly
    - Implement `initSentry()` with proper config (DSN, environment, integrations)
    - Export Sentry instance for use in other modules
    - Call `initSentry()` in `main.tsx`
    - _Requirements: SEC-04_
  
  - [x] 4.2 Update `errorHandler.ts` to import Sentry properly
    - Replace `(window as any).Sentry` with proper import
    - Use imported Sentry instance
    - _Requirements: SEC-04_
  
  - [x] 4.3 Update `securityLogger.ts` to import Sentry properly
    - Replace `(window as any).Sentry` with proper import
    - Use imported Sentry instance
    - _Requirements: SEC-04_

- [ ] 5. Apply pending security migrations
  - [ ] 5.1 Write migration `012_fix_rls_user_metadata.sql`
    - Change all RLS policies from `auth.jwt()->>'role'` to `(auth.jwt()->'app_metadata'->>'role')`
    - Test policies with different roles
    - _Requirements: SEC-05_
    - **CRITICAL: RLS policies using user_metadata can be bypassed by users**
  
  - [ ] 5.2 Write migration `013_fix_security_definer_views.sql`
    - Change three views from `SECURITY DEFINER` to `SECURITY INVOKER`
    - Verify view permissions work correctly
    - _Requirements: SEC-05_
    - **CRITICAL: SECURITY DEFINER views can bypass RLS**
  
  - [ ] 5.3 Apply migrations to Supabase and verify
    - Run migrations on local Supabase instance
    - Verify Supabase linter shows 0 warnings
    - Test affected functionality
    - _Requirements: SEC-05_
  
  - [ ]* 5.4 Update `SECURITY-FIX-INSTRUCTIONS.md` to mark fixes as applied
    - Document migration application
    - Mark issues as resolved
    - _Requirements: SEC-05_

### Sprint 2 — P1 Architecture (High Priority)

- [ ] 6. Decompose god components
  - [x] 6.1 Split `Settings.tsx` into sub-components
    - Create `src/pages/Settings/GeneralSettings.tsx` (~80 lines) - auto-approve, exceptions toggles
    - Create `src/pages/Settings/LeaveTypeManager.tsx` (~150 lines) - leave type CRUD
    - Create `src/pages/Settings/BreakScheduleSettings.tsx` (~100 lines) - break schedule config
    - Create `src/pages/Settings/ShiftConfigSettings.tsx` (~100 lines) - shift configuration
    - Create `src/pages/Settings/index.tsx` (~80 lines) - tab navigation shell
    - Update imports and routing
    - _Requirements: ARCH-01_
    - **IMPORTANT: 701 lines is hard to maintain, but app works**
  
  - [x] 6.2 Split `Reports.tsx` into sub-components
    - Create `src/pages/Reports/ReportFilters.tsx` (~60 lines) - date range selector
    - Create `src/pages/Reports/MetricCards.tsx` (~80 lines) - summary cards
    - Create `src/pages/Reports/SwapChart.tsx` (~60 lines) - swap bar chart
    - Create `src/pages/Reports/LeaveChart.tsx` (~60 lines) - leave pie chart
    - Create `src/hooks/useReportData.ts` (~80 lines) - data fetching hook
    - Create `src/pages/Reports/index.tsx` (~60 lines) - layout orchestrator
    - Update imports and routing
    - _Requirements: ARCH-01_
    - **IMPORTANT: 462 lines is hard to maintain, but app works**
  
  - [x] 6.3 Extract `Dashboard.tsx` data-fetching into hook
    - Create `src/hooks/useDashboardData.ts`
    - Move all useEffect + useState data fetching to React Query hook
    - Update Dashboard.tsx to use the new hook
    - _Requirements: ARCH-01, ARCH-02_
    - **Note: 284 lines is manageable**

- [ ] 7. Unify data-fetching strategy
  - [x] 7.1 Create `reportsService.ts`
    - Create `src/services/reportsService.ts`
    - Move all Supabase queries from Reports.tsx to service
    - Implement `getMetrics(dateRange)` function
    - Export service from `services/index.ts`
    - _Requirements: ARCH-02_
    - **IMPORTANT: Direct supabase calls bypass service layer pattern**
  
  - [x] 7.2 Create `dashboardService.ts`
    - Create `src/services/dashboardService.ts`
    - Move all Supabase queries from Dashboard.tsx to service
    - Implement `getPendingItems()` function
    - Export service from `services/index.ts`
    - _Requirements: ARCH-02_

- [ ] 8. Make LeaveType truly dynamic
  - [x] 8.1 Change `LeaveType` from union to `string`
    - Update `src/types/index.ts` - change LeaveType to `string`
    - Update all type references throughout codebase
    - _Requirements: ARCH-03_
    - **IMPORTANT: Hardcoded types contradict database-driven design**
  
  - [x] 8.2 Remove hardcoded leave type validation
    - Update `src/utils/validation.ts` - remove hardcoded array from `validateLeaveType()`
    - Make validation async or remove entirely
    - Use `useLeaveTypes()` hook for runtime validation
    - _Requirements: ARCH-03_
  
  - [x] 8.3 Update `DEFAULT_LEAVE_BALANCES` to load dynamically
    - Update `src/constants/index.ts`
    - Load leave types from database instead of hardcoded array
    - Update initialization logic
    - _Requirements: ARCH-03_

- [ ] 9. Consolidate validation logic
  - [x] 9.1 Create consolidated validation structure
    - Create `src/validation/schemas/` directory
    - Create `src/validation/schemas/leaveRequest.ts` - Zod schemas for leave requests
    - Create `src/validation/schemas/swapRequest.ts` - Zod schemas for swap requests
    - Create `src/validation/schemas/user.ts` - Zod schemas for user data
    - Create `src/validation/schemas/common.ts` - UUID, date, email schemas
    - Create `src/validation/validators.ts` - derived imperative validators
    - Create `src/validation/index.ts` - barrel file
    - _Requirements: ARCH-04_
    - **Note: Validation works but is scattered - not blocking**
  
  - [x] 9.2 Migrate validators from existing files
    - Migrate validators from `utils/validation.ts` to Zod-derived
    - Migrate validators from `utils/validators.ts` to Zod-derived
    - Migrate validators from `lib/validations/` to Zod-derived
    - Migrate validators from `services/validation/` to Zod-derived
    - Update all imports throughout codebase
    - _Requirements: ARCH-04_
  
  - [x] 9.3 Delete old validation files
    - Delete `src/utils/validators.ts`
    - Delete `src/lib/validations/` directory
    - Delete `src/services/validation/` directory
    - Verify no broken imports remain
    - _Requirements: ARCH-04_

- [x] 10. Export missing service
  - [x] 10.1 Add `breakSchedulesService` to exports
    - Update `src/services/index.ts`
    - Add `export * from './breakSchedulesService'`
    - _Requirements: ARCH-05_

### Sprint 3 — P2 Code Quality (Medium Priority)

- [x] 11. Fix package name
  - [x] 11.1 Rename package to "wfm"
    - Update `package.json` name field from "swaptool" to "wfm"
    - _Requirements: CQ-01_

- [x] 12. Remove leftover scaffold comments
  - [x] 12.1 Remove AI-generated comments
    - Delete comment on line 129 of `src/types/index.ts`
    - Search for and remove any other scaffold comments
    - _Requirements: CQ-02_

- [x] 13. Unify localStorage key naming
  - [x] 13.1 Replace inline localStorage key with constant
    - Update `src/components/Layout.tsx`
    - Replace `'swaptool_sidebar_collapsed'` with `STORAGE_KEYS.SIDEBAR_COLLAPSED`
    - Import constant from `src/constants/index.ts`
    - _Requirements: CQ-03_

- [x] 14. Remove duplicate routes
  - [x] 14.1 Remove `/new` routes from routing
    - Update `src/App.tsx`
    - Remove duplicate `/new` paths for swap and leave requests
    - Keep canonical `/create` paths
    - Update `constants/ROUTES` if needed
    - _Requirements: CQ-04_

- [x] 15. Conditionally load ReactQueryDevtools
  - [x] 15.1 Wrap devtools in dev-only conditional
    - Update `src/App.tsx`
    - Wrap `<ReactQueryDevtools>` in `{import.meta.env.DEV && ...}`
    - _Requirements: CQ-05_

- [x] 16. Add 404 page
  - [x] 16.1 Create NotFound page component
    - Create `src/pages/NotFound.tsx`
    - Display "Page Not Found" message
    - Add link back to dashboard
    - _Requirements: CQ-06_
  
  - [x] 16.2 Update catch-all route
    - Update `src/App.tsx`
    - Change catch-all route to render `NotFound` instead of redirect
    - _Requirements: CQ-06_

- [x] 17. Fix .gitignore for build artifacts
  - [x] 17.1 Add coverage directory to .gitignore
    - Add `coverage/` to `.gitignore`
    - Run `git rm -r --cached coverage/` to untrack
    - Verify `dist/` is also properly ignored
    - _Requirements: CQ-07_

### Sprint 4 — P3 Database (Medium Priority)

- [ ]* 18. Fix migration numbering
  - [ ]* 18.1 Propose new migration naming convention
    - Document timestamp-based naming convention (e.g., `20260101120000_description.sql`)
    - Get team approval on convention
    - _Requirements: DB-01_
    - **Note: Current numbering works, just inconsistent**
  
  - [ ]* 18.2 Rename existing migration files
    - Rename all migration files with consistent numbering
    - Resolve duplicate `007` prefix issue
    - Document which migrations run in which order
    - _Requirements: DB-01, DB-02_
  
  - [ ]* 18.3 Create migrations README
    - Create `supabase/migrations/README.md`
    - Document canonical execution order
    - Document naming convention
    - _Requirements: DB-01_

- [ ]* 19. Create missing security migrations
  - [ ]* 19.1 Create or confirm missing migration files
    - Create `012_fix_security_warnings.sql` if not applied
    - Create `013_sync_role_to_app_metadata.sql` if not applied
    - Or update docs to reflect actual state if applied out-of-band
    - _Requirements: DB-03_
    - **Note: May already be applied - just not in repo**

- [ ]* 20. Adopt Supabase CLI for migrations
  - [ ]* 20.1 Set up Supabase CLI migration workflow
    - Configure Supabase CLI for project
    - Test `supabase db push` workflow
    - Test `supabase migration up` workflow
    - Document workflow for team
    - _Requirements: DB-04_
  
  - [ ]* 20.2 Update README with CLI instructions
    - Update "Getting Started" section in README.md
    - Replace manual copy-paste instructions with CLI commands
    - Add troubleshooting section
    - _Requirements: DB-04_

### Sprint 5 — P4 Testing (Lower Priority)

- [ ] 21. Fix contradictory test count in README
  - [x] 21.1 Correct test count documentation
    - Determine actual test count from CI output
    - Update README.md with single correct number
    - Consider automating from CI badge
    - _Requirements: TEST-01_
    - **Note: Documentation issue only**

- [x] 22. Optimize CI pipeline
  - [x] 22.1 Merge duplicate test runs
    - Update `.github/workflows/ci.yml`
    - Merge `test:run` and `test:coverage` into single step
    - Ensure coverage report is still generated
    - _Requirements: TEST-03_
    - **IMPORTANT: Running tests twice wastes CI time and resources**

- [ ]* 23. Increase test coverage
  - [ ]* 23.1 Add unit tests for service layer
    - Target 80% coverage for service layer
    - Focus on critical business logic
    - _Requirements: TEST-02_
    - **Note: 25.89% coverage is low but app works**
  
  - [x] 23.2 Add integration tests for approval workflows
    - Test swap approval workflow end-to-end
    - Test leave approval workflow end-to-end
    - _Requirements: TEST-02_
  
  - [ ]* 23.3 Add unit tests for validation schemas
    - Test all Zod schemas
    - Test edge cases and error conditions
    - _Requirements: TEST-02_
  
  - [ ]* 23.4 Add component tests for decomposed components
    - Test Settings sub-components
    - Test Reports sub-components
    - _Requirements: TEST-02_

### Sprint 6 — P5 Polish (Lowest Priority)

- [ ]* 24. Extract inline SVG icons
  - [x] 24.1 Move icons to dedicated directory or adopt library
    - Create `src/components/icons/` directory OR install icon library (lucide-react, heroicons)
    - Move 12+ inline SVG icons from Layout.tsx
    - Update imports
    - _Requirements: UX-01_
    - **Note: Icons work fine inline - just cleaner to extract**

- [ ]* 25. Add required PWA icons
  - [ ]* 25.1 Generate and add missing PWA icons
    - Generate 192×192 icon
    - Generate 512×512 icon
    - Update `vite.config.ts` manifest
    - Add icons to `public/icons/`
    - _Requirements: UX-02_
    - **Note: PWA works but may not install properly on all devices**

- [ ]* 26. Make email domain configurable
  - [x] 26.1 Load email domain from environment variable
    - Update `src/constants/index.ts`
    - Load from `VITE_ALLOWED_EMAIL_DOMAIN` with '@dabdoob.com' as default
    - Add to `.env.example`
    - _Requirements: UX-03_
    - **Note: Hardcoded domain works for single-tenant app**

- [ ]* 27. Configure Supabase client properly
  - [x] 27.1 Add proper client configuration
    - Update `src/lib/supabase.ts`
    - Configure auth persistence strategy (localStorage vs sessionStorage)
    - Configure auto-refresh settings
    - Configure global headers and retry options
    - _Requirements: UX-04_
    - **Note: Default config works but could be optimized**

- [ ]* 28. Cap in-memory error log
  - [x] 28.1 Add TTL or ring buffer to ErrorHandler
    - Update `src/lib/errorHandler.ts`
    - Add TTL for error entries OR reduce cap
    - Implement ring buffer to prevent unbounded growth
    - _Requirements: UX-05_
    - **Note: 100 error cap is reasonable for most sessions**

- [-] 29. Consolidate documentation
  - [x] 29.1 Merge related documentation files
    - Merge 7 accessibility docs into single `accessibility.md`
    - Merge testing docs into single `testing.md`
    - Merge deployment docs into single `deployment.md`
    - Aim for ≤10 total doc files
    - _Requirements: UX-06_
    - **Note: Documentation organization - not blocking**

## Summary

| Sprint | Required | Optional | Estimated Effort | Priority | Status |
|--------|----------|----------|-----------------|----------|--------|
| Sprint 1 — Security | 6 tasks (3 done) | 3 tasks | 1–2 days | 🔴 P0 | In Progress |
| Sprint 2 — Architecture | 7 tasks (1 done) | 5 tasks | 2–3 days | 🟠 P1 | Not Started |
| Sprint 3 — Code Quality | 8 tasks (8 done) | 0 tasks | 2–3 hours | 🟡 P2 | ✅ Complete |
| Sprint 4 — Database | 0 tasks | 6 tasks | Optional | 🟡 P3 | Optional |
| Sprint 5 — Testing | 1 task | 5 tasks | 1 hour + optional | 🟡 P4 | Not Started |
| Sprint 6 — Polish | 0 tasks (3 done) | 6 tasks | Optional | ⚪ P5 | In Progress |
| **Total** | **22 required (12 done)** | **25 optional (3 done)** | **~1 week** | — | **55% Complete** |

## Notes

- All tasks reference specific requirements (SEC-XX, ARCH-XX, CQ-XX, etc.) for traceability
- **CRITICAL tasks (P0)**: Security vulnerabilities that must be fixed immediately
  - Remove hardcoded service role key from vite.config.ts
  - Rotate exposed keys
  - Fix RLS policies (user_metadata → app_metadata)
  - Fix SECURITY DEFINER views
- **IMPORTANT tasks (P1)**: Architecture improvements that significantly improve maintainability
  - Split large components (Settings, Reports)
  - Unify data-fetching through service layer
  - Make LeaveType dynamic (remove hardcoded types)
  - Optimize CI pipeline (stop running tests twice)
- **Optional tasks**: Marked with `*` - nice to have but not blocking
- Each task includes specific file paths and implementation details
- Tasks are designed to be completed independently where possible
- Focus on required tasks first - optional tasks can be done incrementally or skipped
