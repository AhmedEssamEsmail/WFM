# WFM — Requirements Specification

All requirements derived from the February 2026 codebase audit. Each requirement is tagged with a priority and category.

---

## 1 · Security Requirements

### SEC-01 — Remove Hardcoded Secrets from Source Control `P0`
- **Current:** Supabase test anon key and **service role key** are hardcoded in `vite.config.ts` and `.env.example`.
- **Requirement:** No secrets (including local-dev service keys) shall appear in committed files. Test keys must be loaded from environment variables or a local `.env.test` file that is git-ignored.
- **Affected files:** `vite.config.ts`, `.env.example`

### SEC-02 — Harden Content Security Policy `P0`
- **Current:** CSP in `vercel.json` allows `'unsafe-inline'` and `'unsafe-eval'` for scripts.
- **Requirement:** Script sources must use nonce-based or hash-based CSP. `unsafe-eval` must be removed entirely. If a library requires `unsafe-inline`, document the justification and use the strictest possible fallback.
- **Affected files:** `vercel.json`, possibly `index.html`

### SEC-03 — Move Security Audit Trail Server-Side `P0`
- **Current:** `securityLogger.ts` writes unauthorized-access events to `localStorage`.
- **Requirement:** Security log entries must be sent to a server-side service (Supabase table, Sentry breadcrumb, or external logger). Client-side storage may be used as a non-authoritative cache only in dev mode.
- **Affected files:** `src/lib/securityLogger.ts`

### SEC-04 — Fix Sentry Integration `P0`
- **Current:** `errorHandler.ts` and `securityLogger.ts` access Sentry via `(window as any).Sentry`.
- **Requirement:** Use the installed `@sentry/react` SDK with proper imports, `Sentry.init()`, and `ErrorBoundary` integration. Remove all `(window as any).Sentry` references.
- **Affected files:** `src/lib/errorHandler.ts`, `src/lib/securityLogger.ts`, `src/lib/sentry.ts`

### SEC-05 — Apply Pending Security Migrations `P0`
- **Current:** `SECURITY-FIX-INSTRUCTIONS.md` references migrations `012` and `013_sync_role_to_app_metadata.sql` that do not exist in the repo.
- **Requirement:** Create and apply the missing security migrations that switch RLS policies from `user_metadata` to `app_metadata` and fix security-definer views. Verify the Supabase linter shows zero warnings.
- **Affected files:** `supabase/migrations/`

---

## 2 · Architecture Requirements

### ARCH-01 — Decompose God Components `P1`
- **Current:** `Settings.tsx` (701 lines), `Reports.tsx` (462 lines), `Dashboard.tsx` (284 lines) each handle multiple responsibilities.
- **Requirement:** No page component shall exceed ~200 lines. Extract sub-features into child components and custom hooks. Each component should have a single responsibility.
- **Affected files:** `src/pages/Settings.tsx`, `src/pages/Reports.tsx`, `src/pages/Dashboard.tsx`

### ARCH-02 — Unify Data-Fetching Strategy `P1`
- **Current:** `Reports.tsx` calls `supabase.from(...)` directly; `Dashboard.tsx` uses manual `useEffect` + `useState`; other pages use React Query hooks.
- **Requirement:** All data-fetching shall go through the service layer and be wrapped in React Query hooks. No component shall import `supabase` directly.
- **Affected files:** `src/pages/Reports.tsx`, `src/pages/Dashboard.tsx`

### ARCH-03 — Make LeaveType Truly Dynamic `P1`
- **Current:** `LeaveType` is a hardcoded TypeScript union type, `validateLeaveType()` uses a hardcoded array, and `DEFAULT_LEAVE_BALANCES` lists the same 5 types—contradicting the "centralized" database-driven system.
- **Requirement:** Remove the hardcoded `LeaveType` union. Use `string` in the TypeScript type and validate against the database at runtime. Update all references to load leave types dynamically from the `leave_types` table.
- **Affected files:** `src/types/index.ts`, `src/utils/validation.ts`, `src/constants/index.ts`

### ARCH-04 — Consolidate Validation `P1`
- **Current:** Validation logic is spread across four locations: `utils/validation.ts`, `utils/validators.ts`, `lib/validations/`, `services/validation/`.
- **Requirement:** Consolidate into a single validation module. Use Zod schemas as the single source of truth and derive imperative validators from them where needed.
- **Affected files:** All validation-related files

### ARCH-05 — Export Missing Service `P1`
- **Current:** `breakSchedulesService.ts` exists but is not exported from `services/index.ts`.
- **Requirement:** All service modules must be exported from the barrel file, or the barrel file pattern should be dropped.
- **Affected files:** `src/services/index.ts`

---

## 3 · Code Quality Requirements

### CQ-01 — Fix Package Name `P2`
- **Current:** `package.json` `name` field is `"swaptool"`.
- **Requirement:** Rename to `"wfm"` to match the project identity.
- **Affected files:** `package.json`

### CQ-02 — Remove Leftover Scaffold Comments `P2`
- **Current:** `types/index.ts` line 129: `// ADD THESE TYPES TO YOUR EXISTING types/index.ts FILE`.
- **Requirement:** Remove all AI-generated instruction comments from production code.
- **Affected files:** `src/types/index.ts`

### CQ-03 — Unify localStorage Key Naming `P2`
- **Current:** `Layout.tsx` uses `'swaptool_sidebar_collapsed'` while `constants/index.ts` defines `STORAGE_KEYS.SIDEBAR_COLLAPSED = 'wfm_sidebar_collapsed'`.
- **Requirement:** All localStorage keys must be defined in `constants/index.ts` and referenced from there. No inline key strings.
- **Affected files:** `src/components/Layout.tsx`, `src/constants/index.ts`

### CQ-04 — Remove Duplicate Routes `P2`
- **Current:** Both `/create` and `/new` paths exist for swap and leave requests, rendering the same component.
- **Requirement:** Keep one canonical path (`/create`) and redirect `/new` to it, or remove it entirely. Update `constants/ROUTES` accordingly.
- **Affected files:** `src/App.tsx`

### CQ-05 — Conditionally Load ReactQueryDevtools `P2`
- **Current:** `<ReactQueryDevtools>` is rendered unconditionally in `App.tsx`.
- **Requirement:** Devtools must only render when `import.meta.env.DEV` is true.
- **Affected files:** `src/App.tsx`

### CQ-06 — Add a 404 Page `P2`
- **Current:** Catch-all route silently redirects to `/dashboard`.
- **Requirement:** Display a dedicated "Page Not Found" page with a link back to the dashboard.
- **Affected files:** `src/App.tsx`, new `src/pages/NotFound.tsx`

### CQ-07 — Fix .gitignore for Build Artifacts `P2`
- **Current:** `coverage/` directory is not in `.gitignore` and may be committed.
- **Requirement:** Add `coverage/` to `.gitignore`. Run `git rm -r --cached coverage/` if already tracked. Verify `dist/` is also properly ignored.
- **Affected files:** `.gitignore`

---

## 4 · Database / Migration Requirements

### DB-01 — Fix Migration Numbering `P3`
- **Current:** Gaps at 001, 002, 012, 014; duplicate `007` prefix; jumps from 011→013→015→020.
- **Requirement:** Re-number all migrations sequentially or adopt timestamp-based naming (e.g., `20260101120000_description.sql`). Document the canonical execution order in a README within the migrations folder.
- **Affected files:** `supabase/migrations/`

### DB-02 — Resolve Duplicate `007` Migrations `P3`
- **Current:** Two files share the `007` prefix with unrelated changes.
- **Requirement:** Assign unique sequential numbers; document which must run first.
- **Affected files:** `supabase/migrations/007_*.sql`

### DB-03 — Create the Missing Security Migrations `P3`
- **Current:** `012_fix_security_warnings.sql` and `013_sync_role_to_app_metadata.sql` are referenced in docs but absent from the repo.
- **Requirement:** Either create the files or update the docs to reflect the actual state. If the fixes were applied out-of-band, capture them as migration files for reproducibility.
- **Affected files:** `supabase/migrations/`, `SECURITY-FIX-INSTRUCTIONS.md`

### DB-04 — Adopt Supabase CLI for Migrations `P3`
- **Current:** README instructs manual copy-paste of SQL into the dashboard.
- **Requirement:** Use `supabase db push` or `supabase migration up` with proper timestamped migration files. Update README setup instructions.
- **Affected files:** `supabase/`, `README.md`

---

## 5 · Testing Requirements

### TEST-01 — Fix Contradictory Test Count in README `P4`
- **Current:** README line 295 says "36 tests"; line 630 says "299 passing tests".
- **Requirement:** State the single correct test count. Automate this from CI output if possible.
- **Affected files:** `README.md`

### TEST-02 — Increase Test Coverage to Target `P4`
- **Current:** 25.89% overall (target: 70%).
- **Requirement:** Prioritize coverage for service layer, validation utilities, and React Query hooks. Add integration tests for the approval workflows.
- **Affected files:** `src/test/`

### TEST-03 — Optimize CI Pipeline `P4`
- **Current:** `ci.yml` runs `test:run` then `test:coverage` — executing tests twice.
- **Requirement:** Merge into a single `test:coverage` step that produces both results and the coverage report.
- **Affected files:** `.github/workflows/ci.yml`

---

## 6 · UX / Polish Requirements

### UX-01 — Extract Inline SVG Icons `P5`
- **Current:** 12+ SVG icon components are defined inline in `Layout.tsx`.
- **Requirement:** Move icons to a dedicated `src/components/icons/` directory or adopt an icon library (e.g., `lucide-react`, `heroicons`).
- **Affected files:** `src/components/Layout.tsx`

### UX-02 — Add Required PWA Icons `P5`
- **Current:** PWA manifest only declares 16×16, 32×32, and 180×180 icons.
- **Requirement:** Add 192×192 and 512×512 icons for proper installability on mobile and desktop.
- **Affected files:** `vite.config.ts`, `public/icons/`

### UX-03 — Make Email Domain Configurable `P5`
- **Current:** `ALLOWED_EMAIL_DOMAIN = '@dabdoob.com'` is hardcoded.
- **Requirement:** Load from `VITE_ALLOWED_EMAIL_DOMAIN` environment variable with `'@dabdoob.com'` as default.
- **Affected files:** `src/constants/index.ts`, `.env.example`

### UX-04 — Configure Supabase Client Properly `P5`
- **Current:** `supabase.ts` uses `createClient()` with no options.
- **Requirement:** Configure auth persistence strategy (`localStorage` vs `sessionStorage`), auto-refresh, global headers, and retry options.
- **Affected files:** `src/lib/supabase.ts`

### UX-05 — Cap In-Memory Error Log `P5`
- **Current:** `ErrorHandler` stores up to 100 errors in memory without expiration.
- **Requirement:** Add a TTL or reduce the cap. Consider using a ring buffer that doesn't grow unbounded for very long sessions.
- **Affected files:** `src/lib/errorHandler.ts`

### UX-06 — Consolidate Documentation `P5`
- **Current:** `docs/` contains 33 files (~350KB) with significant overlap (7 accessibility docs, for example).
- **Requirement:** Merge related docs into logical groupings (e.g., single `accessibility.md`, single `testing.md`, single `deployment.md`). Aim for ≤10 doc files.
- **Affected files:** `docs/`
