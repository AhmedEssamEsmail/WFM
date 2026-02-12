# WFM (Workforce Management)

A comprehensive Workforce Management system for shift scheduling, swap requests, leave management, and headcount tracking. Built with React, TypeScript, Tailwind CSS, and Supabase.

**Live website:** https://wfm-cx.vercel.app

---

## Table of Contents

- [Features](#features)
- [Approval Workflows](#approval-workflows)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Security](#security)

---

## Features

### Core Features

#### Shift Management
- View and manage daily shifts with four shift types: **AM**, **PM**, **BET**, and **OFF**
- Interactive calendar-based schedule view with color-coded shifts
- Bulk schedule upload via CSV for WFM administrators
- Track original shift assignments after swaps are completed
- Swap history tracking with original user information
- **Mobile-responsive** schedule table with horizontal scrolling
- Sticky name column for easy reference while scrolling

#### Swap Requests
- Request shift swaps with colleagues
- Multi-level approval workflow (peer acceptance → TL → WFM)
- Store and display all 4 shift types involved in a swap (requester's 2 shifts + target's 2 shifts)
- Full request detail pages with status timelines and approval history
- Comment system for discussions on swap requests
- Automatic shift updates upon approval
- **Unified design system** with consistent colors and status indicators

#### Leave Management
- Submit leave requests for multiple leave types: **Sick**, **Annual**, **Casual**, **Public Holiday**, **Bereavement**
- **Centralized Leave Type System**: Database-driven leave types managed by WFM
  - Dynamic leave types loaded from database
  - Custom colors and labels per organization
  - WFM can add/edit/deactivate leave types via Settings
  - Changes reflect immediately across all pages
- Multi-level approval workflow (TL → WFM)
- Automatic leave balance validation before submission
- Auto-denial for insufficient balance with optional exception requests
- Leave balance tracking per employee with history
- Support for denied status with reason tracking
- Comment system for discussions on leave requests
- Date range selection with validation
- **Unified design system** with consistent status colors

#### Break Schedule Management
- **Comprehensive Break Planning**: Plan and manage agent break times across 15-minute intervals
- **Role-Based Access**:
  - Agents: View their own break schedules (read-only)
  - Team Leads: View their team's break schedules (read-only)
  - WFM: Full planning control with drag-and-drop break assignment
- **Real-Time Validation**: Configurable business rules with immediate feedback
  - Break ordering (HB1 → B → HB2)
  - Minimum/maximum gaps between breaks (90-270 minutes)
  - Shift boundary validation
  - Coverage requirements
- **Auto-Distribution**: Intelligent break placement algorithms
  - Balanced Coverage: Minimize coverage variance across intervals
  - Staggered Timing: Spread breaks evenly throughout shifts
  - Preview before applying with coverage statistics
- **CSV Import/Export**: Bulk schedule management for WFM
- **Coverage Visualization**: Color-coded coverage indicators (green/yellow/orange/red)
- **Shift Integration**: Automatic break clearing when shifts change with warning notifications
- **Swap Integration**: Automatic break swapping when swap requests are approved
- **Configurable Rules**: WFM can activate/deactivate validation rules and adjust parameters

#### Reports & Analytics (TL/WFM Only)
- **Comprehensive Reports Dashboard** with date range filtering
- Summary cards showing key metrics:
  - Total swap requests and approval rates
  - Total leave requests and approval rates
  - Total leave days taken
  - Active users count
- **Interactive Charts**:
  - Swap requests by user (bar chart)
  - Leave requests by type (pie chart)
  - Shift distribution (bar chart)
  - Request status breakdown (pie chart)
- **CSV Export** functionality for all report data
- Custom date range selection (current month, last month, custom)

### User Experience Improvements

#### Error Handling & Feedback
- **Error Boundary** component for graceful error recovery
- **Toast Notification System** with 4 types:
  - Success (green) - Confirmations
  - Error (red) - Failures
  - Warning (yellow) - Cautions
  - Info (blue) - Information
- Contextual error messages with actionable guidance
- Automatic toast dismissal with manual close option

#### Loading States
- **Skeleton Components** for better perceived performance:
  - Table skeleton (5 rows)
  - Card skeleton (single and grid)
  - Text skeleton (single and multiple lines)
  - Avatar skeleton
  - Button skeleton
  - Input skeleton
  - List skeleton
- Consistent loading indicators across all pages

#### Performance Optimization
- **React Query Integration** for:
  - Automatic data caching
  - Background refetching
  - Optimistic updates
  - Request deduplication
- Reduced API calls and improved response times
- Better offline experience with cached data

### Recent Improvements (February 2026)

#### Audit-Driven Improvements (February 2026)
Following a comprehensive codebase audit, we implemented critical security, architecture, and code quality improvements:

**Security Enhancements**:
- **Hardened Content Security Policy**: Removed `unsafe-eval` from CSP directives in production deployment
- **Proper Sentry Integration**: Migrated from `(window as any).Sentry` to official `@sentry/react` SDK with proper initialization
- **Environment Variable Security**: Removed hardcoded test keys from `.env.example`, replaced with secure placeholders
- **Service Layer Validation**: All data-fetching now goes through service layer with React Query hooks

**Architecture Improvements**:
- **Component Decomposition**: Split large components for better maintainability
  - Settings page (701 lines) → 5 focused sub-components (~80-150 lines each)
  - Reports page (462 lines) → 5 focused sub-components with dedicated data hook
  - Dashboard data-fetching extracted to `useDashboardData` hook
- **Unified Data-Fetching Strategy**: All pages now use React Query hooks with service layer (no direct Supabase imports in components)
- **Consolidated Validation**: New `src/validation/` module with Zod schemas as single source of truth
  - Organized schemas: `common.ts`, `user.ts`, `leaveRequest.ts`, `swapRequest.ts`, `breakSchedule.ts`, `settings.ts`
  - Derived imperative validators from Zod schemas
  - Eliminated scattered validation logic across 4+ locations
- **Fully Dynamic Leave Types**: Removed hardcoded `LeaveType` union, now loads from database at runtime
- **Service Layer Completeness**: All services properly exported from barrel file

**Code Quality Improvements**:
- **Package Naming**: Renamed from "swaptool" to "wfm" for consistency
- **Clean Codebase**: Removed AI-generated scaffold comments and leftover instructions
- **Unified Constants**: All localStorage keys now defined in `constants/index.ts` (no inline strings)
- **Route Consolidation**: Removed duplicate `/new` routes, kept canonical `/create` paths
- **Conditional DevTools**: React Query DevTools only load in development mode
- **404 Page**: Added dedicated NotFound page instead of silent redirects
- **Build Artifacts**: Added `coverage/` to `.gitignore` for cleaner repository

**Testing & CI Improvements**:
- **Optimized CI Pipeline**: Merged duplicate test runs (was running tests twice), now single `test:coverage` step
- **Test Count Accuracy**: Corrected documentation to reflect actual test count (568 tests)
- **Integration Tests**: Added comprehensive approval workflow tests

**UI/UX Polish**:
- **Icon Organization**: Extracted 12+ inline SVG icons to dedicated `src/components/icons/` directory
- **Configurable Email Domain**: Email domain now loads from `VITE_ALLOWED_EMAIL_DOMAIN` environment variable
- **Enhanced Supabase Client**: Configured auth persistence, auto-refresh, and retry options
- **Error Log Management**: Added TTL and ring buffer to prevent unbounded error log growth
- **Documentation Consolidation**: Merged related docs (accessibility, testing, monitoring, performance) for clarity

#### Previous Improvements
- **Centralized Leave Type Management**:
  - **Fully Dynamic System**: All leave type references now load from database in real-time
  - Database-driven leave types with `leave_types` table
  - WFM can manage leave types via Settings page (add/edit/deactivate)
  - Custom labels, descriptions, colors (hex codes), and display order
  - Service layer (`leaveTypesService`) and React hook (`useLeaveTypes`)
  - Automatic cache invalidation and real-time updates across all pages
  - **No hardcoded mappings**: Schedule, Leave Requests, and Leave Balances pages all use dynamic data
  - Changes to leave type labels/colors reflect immediately everywhere
  - Migration `013_centralized_leave_types.sql` sets up the system with default leave types
- **Code Organization**: Reorganized page components into logical subfolders (Auth, SwapRequests, LeaveRequests, Schedule, Headcount) for better maintainability and scalability
- **Asset Organization**: Moved all icon files to `public/icons/` folder with updated references
- **Chunk Loading Error Handling**: Automatic page reload on deployment-related chunk errors with service worker cleanup
- **Enhanced UI/UX**:
  - Status badges repositioned for consistency across Leave and Swap request pages
  - Agent name filter added to Leave Balances page for TL/WFM users
  - Updated Reports navigation icon for better visual distinction
- **Critical Data Integrity Fixes**:
  - **Atomic Swap Execution** (Migration 008): Implemented PostgreSQL stored procedure to ensure all 4 shift updates in a swap succeed or fail together, preventing partial swap states
  - Service-level leave balance validation to prevent API bypass
  - Comprehensive input validation (UUIDs, enums, string lengths, dates)
  - Optimistic locking to prevent race conditions in concurrent approvals
- **Security & Access Control**:
  - **System Comment Protection** (Migration 009): RLS policies prevent modification of system-generated audit trail comments
  - Route-level authentication and authorization with ProtectedRoute component
  - Role-based access control enforced at routing layer
  - Domain validation for all authenticated users
- **Performance & Scalability**:
  - **Database Indexes** (Migration 010): Strategic composite indexes on frequently queried columns (user_id + date, status + created_at, etc.)
  - Cursor-based pagination for all list endpoints (50 records per page)
  - Sentry integration for production error tracking and performance monitoring
  - React Query cache optimization with differentiated stale times per data type
  - Enhanced code splitting and lazy loading for faster initial page loads
- **Database Optimization**:
  - Removed FTE (Full-Time Equivalent) tracking from all employee pages and database (Migration 011)
  - Simplified headcount metrics and department summaries
  - Updated database views to exclude FTE calculations
- **User Experience**:
  - Added cancel functionality for swap and leave request submitters
  - Target users can cancel accepted swap requests before final approval
  - Improved request management with clear action buttons

#### Accessibility Features
- **ARIA labels** for screen readers
- **Keyboard navigation** support (Enter/Space keys)
- **Semantic HTML** with proper heading hierarchy
- **Focus indicators** for interactive elements
- **Skip links** for keyboard users
- Proper `<th scope>` attributes for table headers
- Descriptive button labels and tooltips

#### Mobile Responsiveness
- Fully responsive layout for all screen sizes
- Touch-friendly interface with proper target sizes (44px minimum)
- Horizontal scrolling for wide tables
- Collapsible sidebar navigation on mobile
- Optimized spacing and typography for mobile devices
- Sign out button always visible on all screen sizes

### Leave Balance Management
- Track leave balances by type for each employee
- View balance history and transactions
- Bulk balance upload via CSV for WFM administrators
- Automatic balance initialization for new users (database trigger creates balances for all active leave types with 0 default)
- Balance deduction upon leave approval
- Monthly accrual tracking (handled via Supabase cron jobs)

### Headcount Management
- Employee directory with advanced search and filtering
  - Filter by department, status, role
  - Search by name, email, or employee ID
- Individual employee detail pages with comprehensive information
- Department-level analytics and headcount metrics
- Track employee status: active, inactive, on_leave, terminated, suspended
- Employee profiles with extended fields:
  - Job title, level, and employment type
  - Location, timezone, and contact information
  - Skills, certifications, and qualifications
  - Working hours and availability
  - Cost center and budget codes
  - Manager assignments
- Protected edit functionality (WFM only, TL view-only)
- Bulk employee import via CSV
- Audit logging for headcount changes

### Comment System
- Add comments on leave and swap requests
- System-generated comments for automated actions
- Threaded discussions on request detail pages
- Role-based comment visibility

### WFM Settings
- **Auto-approve toggle**: Automatically approve requests when TL approves (bypasses WFM approval)
- **Allow leave exceptions**: Enable/disable exception requests for denied leave requests
- **Leave Types Management**: Centralized management of leave types (WFM only)
  - Add new leave types with custom labels, descriptions, and colors
  - Edit existing leave types (label, description, color, display order)
  - Activate/deactivate leave types without deletion
  - Color customization with hex color codes
  - Display order management for UI consistency
  - All changes reflect immediately across the application
- Real-time settings updates across the application

### Role-Based Access Control (RBAC)

| Role | Capabilities |
|------|-------------|
| **Agent** | View own shifts, request swaps and leaves, comment on own requests, view own leave balances, view own break schedule |
| **Team Lead (TL)** | All Agent permissions + approve/reject team requests, add comments on team requests, view headcount directory (read-only), view team break schedules |
| **WFM** | All TL permissions + final approval authority, manage settings, schedule upload, auto-approve configuration, full headcount management (create/edit/delete), bulk imports, leave balance management, full break schedule planning and management |

### Domain Restriction
- Email domain validation (@dabdoob.com)
- Automatic sign-out for unauthorized domains
- Unauthorized access page for non-domain users

---

## Approval Workflows

### Leave Requests

```
Agent submits leave request
  └─→ Balance check
        ├─→ Sufficient balance: Status: pending_tl
        │     └─→ TL approves
        │           └─→ Status: pending_wfm (or approved if auto-approve enabled)
        │                 └─→ WFM approves
        │                       └─→ Status: approved (balance deducted)
        │
        └─→ Insufficient balance: Status: denied
              └─→ If exceptions allowed: Agent can request exception
                    └─→ Follows normal approval workflow
```

### Swap Requests

```
Agent requests swap
  └─→ Status: pending_acceptance
        └─→ Target user accepts
              └─→ Status: pending_tl
                    └─→ TL approves
                          └─→ Status: pending_wfm (or approved if auto-approve enabled)
                                └─→ WFM approves
                                      └─→ Status: approved (shifts swapped)
```

*At any step, the approver can reject the request, setting the status to `rejected` or `denied`.*

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 3 with custom primary color palette |
| **State Management** | React Query (TanStack Query) for server state |
| **Backend / BaaS** | Supabase (PostgreSQL + Auth + Row-Level Security) |
| **Routing** | React Router v6 |
| **Date Utilities** | date-fns 3 |
| **Testing** | Vitest + React Testing Library (568 tests) |
| **Linting** | ESLint 9 + typescript-eslint + React Hooks plugin |
| **Deployment** | Vercel |

### Build Stats
- **Bundle Size**: 571 KB (150 KB gzipped) - Optimized with code splitting
- **Test Coverage**: 568 passing tests across all categories
- **TypeScript**: Strict mode enabled with zero errors
- **Performance**: PWA-enabled with offline support and caching
- **Package Name**: `wfm` (consistent with project identity)
- **Code Quality**: ESLint 9 with strict rules, no scaffold comments

---

## Architecture Principles

### Component Decomposition

Large components have been split into focused, single-responsibility modules:

**Settings Page** (was 701 lines → now 5 components):
- `index.tsx` - Tab navigation shell (~80 lines)
- `GeneralSettings.tsx` - Auto-approve and exceptions toggles (~80 lines)
- `LeaveTypeManager.tsx` - Leave type CRUD operations (~150 lines)
- `BreakScheduleSettings.tsx` - Break schedule configuration (~100 lines)
- `ShiftConfigSettings.tsx` - Shift configuration (~100 lines)

**Reports Page** (was 462 lines → now 5 components + hook):
- `index.tsx` - Layout orchestrator (~60 lines)
- `ReportFilters.tsx` - Date range selector (~60 lines)
- `MetricCards.tsx` - Summary cards (~80 lines)
- `SwapChart.tsx` - Swap bar chart (~60 lines)
- `LeaveChart.tsx` - Leave pie chart (~60 lines)
- `useReportData.ts` - Data fetching hook (~80 lines)

**Dashboard Page** (was 284 lines → extracted hook):
- `Dashboard.tsx` - UI component
- `useDashboardData.ts` - Data fetching logic

### Unified Data-Fetching Strategy

All data-fetching follows a consistent pattern:

```
Component → React Query Hook → Service Layer → Supabase
```

**Rules**:
- No components import `supabase` directly
- All data-fetching wrapped in React Query hooks
- Service layer handles all database operations
- Consistent error handling and loading states

**Benefits**:
- Automatic caching and background refetching
- Request deduplication
- Optimistic updates
- Better testability
- Consistent error handling

### Service Layer Pattern

All services follow a consistent structure:

```typescript
// services/exampleService.ts
import { supabase } from '@/lib/supabase';

export const exampleService = {
  async getItems() {
    const { data, error } = await supabase
      .from('table')
      .select('*');
    
    if (error) throw error;
    return data;
  },
  
  async createItem(item: Item) {
    // Validation at service layer
    validateItem(item);
    
    const { data, error } = await supabase
      .from('table')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
```

All services are exported from `services/index.ts` for easy imports.

---

## Performance Optimizations

### Code Splitting & Lazy Loading
- All heavy pages lazy loaded for faster initial load
- Suspense boundaries with loading fallbacks
- Reduced initial bundle size by ~40%

### Build Optimizations
- Manual chunk splitting for better caching
- Terser minification with console removal in production
- Vendor chunks separated (React, Supabase, React Query, date-fns)

### Progressive Web App (PWA)
- Service worker for offline support
- Automatic asset caching
- Installable on mobile and desktop
- Network-first strategy for API calls

### React Performance
- Memoized callbacks and expensive computations
- React Query for efficient data fetching and caching
- Optimized re-renders with useMemo and useCallback
- React Query DevTools conditionally loaded (development only)

### Performance Utilities
- Debounce and throttle functions
- Intersection Observer for lazy loading
- Local storage with cross-tab sync
- Centralized error handling

**See [PERFORMANCE_IMPROVEMENTS.md](./PERFORMANCE_IMPROVEMENTS.md) for detailed documentation.**

---

## Project Structure

```
WFM/
├── public/
│   └── icons/                       # Favicon and app icons
├── supabase/
│   ├── schema.sql                   # Full database schema (tables, RLS, triggers)
│   └── migrations/                  # Incremental SQL migrations
│       ├── 003_comments_and_settings.sql
│       ├── 004_phase4.sql
│       ├── 005_swap_requests_rls_policies.sql
│       ├── 006_swap_requests_original_shift_info.sql
│       ├── 007_add_denied_status_to_leave_requests.sql
│       ├── 007_swap_requests_additional_original_shift_types.sql
│       ├── 008_atomic_swap_execution.sql
│       ├── 009_system_comment_protection.sql
│       ├── 010_performance_indexes.sql
│       ├── 011_remove_fte_percentage.sql
│       └── 013_centralized_leave_types.sql
├── src/
│   ├── main.tsx                     # Application entry point
│   ├── App.tsx                      # Root component with routing & route guards
│   ├── index.css                    # Global styles with Tailwind directives
│   ├── components/
│   │   ├── Layout.tsx               # App shell with sidebar navigation & RBAC
│   │   ├── ErrorBoundary.tsx        # Error boundary for graceful error handling
│   │   ├── ChunkErrorBoundary.tsx   # Chunk loading error handler with auto-reload
│   │   ├── ProtectedRoute.tsx       # Route guard for authenticated users
│   │   ├── PublicRoute.tsx          # Route guard for unauthenticated users
│   │   ├── Pagination.tsx           # Pagination component for lists
│   │   ├── Toast.tsx                # Toast notification component
│   │   ├── ToastContainer.tsx       # Toast container with positioning
│   │   ├── Skeleton.tsx             # Loading skeleton components (7 variants)
│   │   ├── icons/                   # SVG icon components (extracted from Layout)
│   │   │   ├── index.ts             # Icon barrel exports
│   │   │   ├── DashboardIcon.tsx    # Dashboard navigation icon
│   │   │   ├── ScheduleIcon.tsx     # Schedule navigation icon
│   │   │   ├── SwapIcon.tsx         # Swap requests icon
│   │   │   ├── LeaveIcon.tsx        # Leave requests icon
│   │   │   ├── BalanceIcon.tsx      # Leave balance icon
│   │   │   ├── BreakScheduleIcon.tsx # Break schedule icon
│   │   │   ├── UsersIcon.tsx        # Headcount icon
│   │   │   ├── ReportsIcon.tsx      # Reports icon
│   │   │   ├── SettingsIcon.tsx     # Settings icon
│   │   │   ├── SignOutIcon.tsx      # Sign out icon
│   │   │   ├── MenuIcon.tsx         # Mobile menu icon
│   │   │   ├── CloseIcon.tsx        # Close icon
│   │   │   ├── ChevronDoubleLeftIcon.tsx # Collapse sidebar icon
│   │   │   └── UploadIcon.tsx       # Upload icon
│   │   ├── BreakSchedule/           # Break schedule components
│   │   │   ├── BreakScheduleTable.tsx
│   │   │   ├── AgentRow.tsx
│   │   │   ├── BreakCell.tsx
│   │   │   ├── CoverageCell.tsx
│   │   │   ├── DateNavigation.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── RulesConfig.tsx
│   │   │   ├── ValidationBanner.tsx
│   │   │   ├── WarningPopup.tsx
│   │   │   └── AutoDistributeModal.tsx
│   │   ├── Settings/                # Settings sub-components
│   │   │   ├── AutoDistributionSettings.tsx
│   │   │   └── ShiftConfigurations.tsx
│   │   └── Headcount/
│   │       ├── EmployeeTable.tsx    # Employee directory table component
│   │       └── ProtectedEdit.tsx    # Protected edit wrapper for WFM-only actions
│   ├── hooks/
│   │   ├── useAuth.ts               # Authentication hook with role helpers
│   │   ├── useHeadcount.ts          # Headcount data fetching & mutations
│   │   ├── useSwapRequests.ts       # Swap requests with React Query
│   │   ├── useLeaveRequests.ts      # Leave requests with React Query
│   │   ├── useLeaveTypes.ts         # Leave types with React Query (centralized)
│   │   ├── useSettings.ts           # Settings management with React Query
│   │   ├── useDashboardData.ts      # Dashboard data fetching hook (extracted)
│   │   └── useReportData.ts         # Reports data fetching hook (extracted)
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client initialization with auth config
│   │   ├── AuthContext.tsx          # Auth provider with session management
│   │   ├── ToastContext.tsx         # Toast notification context
│   │   ├── queryClient.ts           # React Query client configuration
│   │   ├── designSystem.ts          # Unified design system (colors, styles, helpers)
│   │   ├── errorHandler.ts          # Centralized error handling with TTL and ring buffer
│   │   ├── performance.ts           # Performance utilities (debounce, throttle, etc.)
│   │   ├── securityLogger.ts        # Security event logging
│   │   └── sentry.ts                # Sentry SDK initialization and configuration
│   ├── pages/
│   │   ├── Pages/                    # Page-level documentation
│   │   │   ├── Dashboard.tsx        # Main dashboard with pending requests
│   │   │   ├── NotFound.tsx         # 404 page with navigation back to dashboard
│   │   │   ├── Auth/                # Authentication pages
│   │   │   │   ├── Login.tsx        # Login page with domain validation
│   │   │   │   ├── Signup.tsx       # User registration
│   │   │   │   └── Unauthorized.tsx # Unauthorized domain access page
│   │   │   ├── Reports/             # Reports dashboard (decomposed)
│   │   │   │   ├── index.tsx        # Reports layout orchestrator (~60 lines)
│   │   │   │   ├── ReportFilters.tsx # Date range selector (~60 lines)
│   │   │   │   ├── MetricCards.tsx  # Summary cards (~80 lines)
│   │   │   │   ├── SwapChart.tsx    # Swap bar chart (~60 lines)
│   │   │   │   └── LeaveChart.tsx   # Leave pie chart (~60 lines)
│   │   │   ├── Settings/            # Settings pages (decomposed)
│   │   │   │   ├── index.tsx        # Settings tab navigation shell (~80 lines)
│   │   │   │   ├── GeneralSettings.tsx # Auto-approve, exceptions toggles (~80 lines)
│   │   │   │   ├── LeaveTypeManager.tsx # Leave type CRUD (~150 lines)
│   │   │   │   ├── BreakScheduleSettings.tsx # Break schedule config (~100 lines)
│   │   │   │   └── ShiftConfigSettings.tsx # Shift configuration (~100 lines)
│   │   ├── Schedule/                # Schedule management pages
│   │   │   ├── Schedule.tsx         # Calendar view of shifts
│   │   │   └── ScheduleUpload.tsx   # CSV bulk upload for shifts (WFM only)
│   │   ├── SwapRequests/            # Swap request pages
│   │   │   ├── SwapRequests.tsx     # List of swap requests
│   │   │   ├── SwapRequestDetail.tsx # Individual swap request details
│   │   │   └── CreateSwapRequest.tsx # Create new swap request
│   │   ├── LeaveRequests/           # Leave request pages
│   │   │   ├── LeaveRequests.tsx    # List of leave requests
│   │   │   ├── LeaveRequestDetail.tsx # Individual leave request details
│   │   │   ├── CreateLeaveRequest.tsx # Create new leave request
│   │   │   └── LeaveBalances.tsx    # Leave balance management (WFM only)
│   │   └── Headcount/               # Headcount management pages
│   │       ├── HeadcountDashboard.tsx # Headcount metrics dashboard
│   │       ├── EmployeeDirectory.tsx # Employee directory with filters
│   │       └── EmployeeDetail.tsx   # Individual employee profile
│   ├── services/                    # API service layer (unified data-fetching)
│   │   ├── index.ts                 # Service barrel exports (all services)
│   │   ├── authService.ts           # Authentication services
│   │   ├── commentsService.ts       # Comment management
│   │   ├── headcountService.ts      # Headcount operations
│   │   ├── leaveBalancesService.ts  # Leave balance operations
│   │   ├── leaveRequestsService.ts  # Leave request operations
│   │   ├── leaveTypesService.ts     # Leave types CRUD operations (centralized)
│   │   ├── settingsService.ts       # Settings management
│   │   ├── shiftsService.ts         # Shift operations
│   │   ├── swapRequestsService.ts   # Swap request operations
│   │   ├── dashboardService.ts      # Dashboard data service (extracted)
│   │   ├── reportsService.ts        # Reports data service (extracted)
│   │   ├── breakSchedulesService.ts # Break schedule operations
│   │   └── breakRulesService.ts     # Break validation rules
│   ├── utils/                       # Utility functions
│   │   ├── csvHelpers.ts            # CSV parsing and generation
│   │   ├── dateHelpers.ts           # Date manipulation utilities
│   │   ├── formatters.ts            # Data formatting utilities
│   │   └── sanitize.ts              # Input sanitization
│   ├── validation/                  # Consolidated validation module (Zod-based)
│   │   ├── index.ts                 # Validation barrel exports
│   │   ├── validators.ts            # Imperative validators derived from Zod
│   │   ├── leaveBalanceValidation.ts # Leave balance validation logic
│   │   └── schemas/                 # Zod schemas (single source of truth)
│   │       ├── common.ts            # UUID, date, email schemas
│   │       ├── user.ts              # User data schemas
│   │       ├── leaveRequest.ts      # Leave request schemas
│   │       ├── swapRequest.ts       # Swap request schemas
│   │       ├── breakSchedule.ts     # Break schedule schemas
│   │       └── settings.ts          # Settings schemas
│   ├── test/                        # Unit tests (36 passing tests)
│   │   ├── setup.ts                 # Test configuration
│   │   ├── components/              # Component tests
│   │   ├── hooks/                   # Hook tests
│   │   ├── lib/                     # Library tests
│   │   ├── utils/                   # Utility tests
│   │   └── integration/             # Integration tests
│   ├── types/
│   │   ├── index.ts                 # TypeScript type definitions
│   │   ├── errors.ts                # Custom error types
│   │   └── pagination.ts            # Pagination types
│   ├── constants/
│       ├── index.ts                 # Application constants (unified localStorage keys, routes, etc.)
│       └── cache.ts                 # Cache configuration constants
├── .env.example                     # Environment variable template (secure placeholders)
├── .env.test.example                # Test environment template
├── .gitignore                       # Git ignore rules (includes coverage/)
├── package.json                     # Package name: "wfm"
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── postcss.config.js
├── vercel.json                      # Vercel config (SPA rewrites + hardened CSP)
└── vite.config.ts                   # Vite config (secure test environment)
```

---

## Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **users** | User profiles linked to Supabase Auth with headcount fields | id, email, name, role, employee_id, status, department, hire_date, manager_id |
| **shifts** | Daily shift assignments | id, user_id, date, shift_type (AM/PM/BET/OFF) |
| **swap_requests** | Shift swap requests with multi-level approval | id, requester_id, target_user_id, status, original shift tracking fields |
| **leave_requests** | Leave/time-off requests with type and approval status | id, user_id, leave_type, start_date, end_date, status, notes |
| **leave_balances** | Per-user leave entitlement balances | id, user_id, leave_type, balance |
| **leave_balance_history** | Audit trail for balance changes | id, user_id, previous_balance, new_balance, change_reason |
| **comments** | Comments on swap/leave requests | id, request_id, request_type, user_id, content, is_system |
| **settings** | Application-wide WFM configuration | id, key, value (wfm_auto_approve, allow_leave_exceptions) |

### Headcount Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **headcount_profiles** | Extended employee information | user_id, job_title, job_level, employment_type, location, time_zone, phone, skills, certifications, max_weekly_hours, cost_center, budget_code, onboarding_status |
| **departments** | Department hierarchy and structure | id, name, code, parent_department_id, head_id, cost_center, active |
| **headcount_audit_log** | Audit trail for headcount changes | id, user_id, action, previous_values, new_values, performed_by, reason, effective_date |
| **leave_types** | Configurable leave type definitions (centralized management) | id, code, label, description, color, display_order, is_active, created_at |
| **break_schedules** | Agent break schedules by 15-minute intervals | id, user_id, schedule_date, shift_type, interval_start, break_type, created_by |
| **break_schedule_rules** | Configurable validation rules for break scheduling | id, rule_name, rule_type, parameters, is_active, is_blocking, priority |
| **break_schedule_warnings** | Warnings when shifts change and breaks are cleared | id, user_id, schedule_date, warning_type, old_shift_type, new_shift_type, is_resolved |

### Database Views

| View | Purpose |
|------|---------|
| **v_headcount_active** | Joined view of users + headcount_profiles with manager info (excludes terminated employees) |
| **v_department_summary** | Department-level metrics (headcount, active/on_leave counts, role distribution) |
| **v_management_chain** | Hierarchical management structure with reporting paths and levels |

### Enums

- **user_role**: `agent`, `tl`, `wfm`
- **shift_type**: `AM`, `PM`, `BET`, `OFF`
- **swap_request_status**: `pending_acceptance`, `pending_tl`, `pending_wfm`, `approved`, `rejected`
- **leave_request_status**: `pending_tl`, `pending_wfm`, `approved`, `rejected`, `denied`
- **leave_type**: `sick`, `annual`, `casual`, `public_holiday`, `bereavement`
- **request_type**: `swap`, `leave`
- **break_type**: `IN`, `HB1`, `B`, `HB2`

*All tables are protected with Row-Level Security (RLS) policies based on user roles.*

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AhmedEssamEsmail/WFM.git
   cd WFM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to the SQL Editor and run the base schema:
     - `supabase/schema.sql`
   - Then run the migrations in order:
     - `supabase/migrations/003_comments_and_settings.sql`
     - `supabase/migrations/004_phase4.sql`
     - `supabase/migrations/005_swap_requests_rls_policies.sql`
     - `supabase/migrations/006_swap_requests_original_shift_info.sql`
     - `supabase/migrations/007_add_denied_status_to_leave_requests.sql`
     - `supabase/migrations/007_swap_requests_additional_original_shift_types.sql`
     - `supabase/migrations/008_atomic_swap_execution.sql`
     - `supabase/migrations/009_system_comment_protection.sql`
     - `supabase/migrations/010_performance_indexes.sql`
     - `supabase/migrations/011_remove_fte_percentage.sql`
     - `supabase/migrations/013_centralized_leave_types.sql`
     - `supabase/migrations/015_break_schedules.sql`
   - Copy your project URL and anon key from Settings → API

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

7. **Create your first user**
   - Sign up with an email ending in `@dabdoob.com`
   - The first user will be created as an `agent`
   - Manually update the role to `wfm` in Supabase to access admin features:
     ```sql
     UPDATE users SET role = 'wfm' WHERE email = 'your-email@dabdoob.com';
     ```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public API key | Yes |
| `VITE_SENTRY_DSN` | Sentry Data Source Name for error tracking | No |
| `VITE_SENTRY_ENVIRONMENT` | Environment name (development, staging, production) | No |
| `VITE_ALLOWED_EMAIL_DOMAIN` | Allowed email domain for authentication (default: @dabdoob.com) | No |

Get Supabase values from your Supabase project dashboard under Settings → API.

### Optional: Sentry Error Tracking

To enable production error tracking with Sentry:

1. Create a free account at [sentry.io](https://sentry.io)
2. Create a new project and select "React" as the platform
3. Copy the DSN from your project settings
4. Add the DSN to your `.env` file:
   ```
   VITE_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
   VITE_SENTRY_ENVIRONMENT=production
   ```
5. Sentry will automatically capture errors, performance metrics, and sourcemaps

Leave `VITE_SENTRY_DSN` empty to disable Sentry integration.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR at `http://localhost:5173` |
| `npm run build` | Type-check with TypeScript and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run test` | Run unit tests with Vitest in watch mode |
| `npm run test:run` | Run all tests once (CI mode) |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:coverage` | Generate test coverage report |
| `npm run seed-test-data` | Seed test database with sample data |

---

## Testing

### Test Suite

The application has a comprehensive test suite with **568 tests** covering:

| Test Category | Tests | Description |
|---------------|-------|-------------|
| **Edge Cases** | 72 | Concurrency, race conditions, boundaries, failures, authentication |
| **Business Logic** | 19 | Swap execution, leave balances, approval workflows, comments |
| **Backend/RLS** | 43 | Row Level Security policies, stored procedures, triggers |
| **Integration** | 33 | Complete user flows, authentication, RBAC, error handling |
| **Unit Tests** | 132 | Components, hooks, utilities, services |

**Total Coverage**: 25.89% overall (target: 70%)
- Critical paths: >90% coverage
- Business logic: >85% coverage
- Utilities: >80% coverage

### Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run specific test suite
npm run test:run -- src/test/edge-cases/
npm run test:run -- src/test/business-logic/
npm run test:run -- src/test/backend/
npm run test:run -- src/test/integration/

# Generate coverage report
npm run test:coverage
```

### Test Database

Tests use a local Supabase instance for database testing:

1. **Install Supabase CLI**:
   ```bash
   npx supabase --version
   ```

2. **Start local database**:
   ```bash
   npx supabase start
   ```

3. **Seed test data** (optional):
   ```bash
   npm run seed-test-data
   ```

4. **Run tests**:
   ```bash
   npm run test:run
   ```

See [docs/testing-guide.md](./docs/testing-guide.md) for detailed testing documentation.

---

## CI/CD Pipeline

### GitHub Actions Workflow

The project uses GitHub Actions for continuous integration:

**Triggers**:
- Pull requests to `main` branch
- Pushes to `main` branch

**Jobs**:
1. **Build** - TypeScript compilation and Vite build
2. **Lint** - ESLint code quality checks
3. **Test & Coverage** - Single optimized test run with coverage report (no duplicate test execution)

**Artifacts**:
- Build artifacts (7 days retention)
- Lint reports (30 days retention)
- Coverage reports (30 days retention)

### Branch Protection

Recommended branch protection rules for `main`:
- Require CI checks to pass before merge
- Require pull request reviews (1 approver)
- Prevent force pushes
- Require linear history

### Deployment Pipeline

**Vercel Deployment**:
- Automatic deployment on push to `main`
- Preview deployments for pull requests
- Environment variables configured in Vercel dashboard
- Build command: `npm run build`
- Output directory: `dist`

---

## Deployment

### Vercel Deployment

This project is configured for **Vercel** deployment with:
- SPA rewrite rules (all routes redirect to index.html)
- Security headers:
  - `X-Frame-Options: DENY` (prevents clickjacking)
  - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)

**Deploy to Vercel:**

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

The `vercel.json` configuration handles all routing automatically.

---

## Security

### Authentication & Authorization
- **Supabase Auth** with email/password authentication
- Email domain validation (`@dabdoob.com` only)
- Automatic session management and token refresh
- User-friendly error messages for auth failures

### Database Security
- **Row-Level Security (RLS)** policies on all tables
- Role-based access control at the database level
- Secure user profile creation via database triggers
- Audit logging for sensitive operations (headcount changes)

### Frontend Security
- Role-based route guards (ProtectedRoute, WFMOnlyRoute, HeadcountRoute)
- Protected component wrappers for sensitive actions
- Only public/anon keys exposed to client (no service role keys)
- Canonical routes with 404 page for invalid paths (no silent redirects)
- Removed duplicate routes for cleaner URL structure

### Deployment Security
- Security headers via Vercel configuration:
  - **Hardened Content Security Policy (CSP)**: Removed `unsafe-eval`, restricted script sources
  - `X-Frame-Options: DENY` (prevents clickjacking)
  - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin` (controls referrer information)
- HTTPS enforced on production
- Environment variables secured in Vercel dashboard
- **Sentry Integration**: Production error tracking with `@sentry/react` SDK
  - Proper initialization with DSN and environment configuration
  - Automatic error capture and performance monitoring
  - Sourcemap upload for better debugging

---

## Key Features Implementation

### February 2026 Audit Improvements Summary

Following a comprehensive codebase audit, we implemented 47 improvements across 6 priority levels:

**Completed (P0-P2 - Critical to Medium)**:
- ✅ 12 Security improvements (hardened CSP, proper Sentry integration, secure env vars)
- ✅ 10 Architecture improvements (component decomposition, unified data-fetching, consolidated validation)
- ✅ 8 Code quality improvements (package naming, clean code, unified constants, conditional DevTools)
- ✅ 2 Testing improvements (optimized CI pipeline, accurate test counts)
- ✅ 3 UX polish items (icon extraction, configurable email domain, enhanced Supabase client)

**Optional (P3-P5 - Lower Priority)**:
- 🔄 Database migration renumbering (works but inconsistent)
- 🔄 Security audit trail server-side (currently localStorage)
- 🔄 Additional test coverage (25.89% → 70% target)
- 🔄 PWA icon additions (192×192, 512×512)

**Impact**:
- Improved security posture with hardened CSP and proper error tracking
- Better maintainability with decomposed components (701 lines → 5 focused components)
- Consistent data-fetching pattern across all pages
- Single source of truth for validation (Zod schemas)
- Faster CI pipeline (eliminated duplicate test runs)
- Cleaner codebase (removed scaffold comments, unified naming)

### Auto-Approve Workflow
When enabled in Settings, requests automatically move from `pending_tl` → `approved` after TL approval, bypassing WFM approval step.

### Leave Balance Validation
- Automatic balance check before leave request submission
- Auto-denial for insufficient balance (status: `denied`)
- Optional exception request flow when enabled in Settings
- Balance deduction upon final approval

### Swap Request Original Shift Tracking
Stores all 4 shift types involved in a swap:
- Requester's original shift on their date
- Requester's original shift on target's date
- Target's original shift on their date
- Target's original shift on requester's date

This allows displaying complete swap history even after shifts are modified.

### Bulk Import Features
- **Schedule Upload**: CSV import for bulk shift assignments (WFM only)
- **Leave Balance Upload**: CSV import for bulk balance updates (WFM only)
- **Employee Import**: CSV import for bulk headcount updates (WFM only)

All imports include validation, error reporting, and rollback on failure.

---

## Validation Architecture

The application uses a **consolidated validation system** built on Zod schemas as the single source of truth.

### Structure

```
src/validation/
├── index.ts                    # Barrel exports for all validators
├── validators.ts               # Imperative validators derived from Zod
├── leaveBalanceValidation.ts   # Leave balance business logic
└── schemas/                    # Zod schemas (single source of truth)
    ├── common.ts               # UUID, date, email, pagination schemas
    ├── user.ts                 # User profile and role schemas
    ├── leaveRequest.ts         # Leave request validation schemas
    ├── swapRequest.ts          # Swap request validation schemas
    ├── breakSchedule.ts        # Break schedule validation schemas
    └── settings.ts             # Settings validation schemas
```

### Key Features

- **Zod-First Approach**: All validation rules defined as Zod schemas
- **Type Safety**: TypeScript types automatically inferred from schemas
- **Reusable Schemas**: Common patterns (UUID, date ranges, enums) defined once
- **Imperative Validators**: Derived from Zod schemas for backward compatibility
- **Centralized Location**: All validation logic in one place (`src/validation/`)
- **Service Layer Integration**: Validation enforced at service layer to prevent API bypass

### Common Schemas

```typescript
// UUID validation
uuidSchema: z.string().uuid()

// Date validation
dateSchema: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

// Email validation
emailSchema: z.string().email()

// Enum validation (role, status, shift type, etc.)
roleSchema: z.enum(['agent', 'tl', 'wfm'])
```

### Usage Example

```typescript
import { leaveRequestSchema, validateLeaveRequest } from '@/validation';

// Zod schema validation
const result = leaveRequestSchema.safeParse(data);

// Imperative validation (backward compatible)
const isValid = validateLeaveRequest(data);
```

---

## Design System

The application uses a **unified design system** (`src/lib/designSystem.ts`) for consistent styling across all components.

### Color Palette
Custom blue primary color palette based on Tailwind's blue scale:

| Shade | Hex | Usage |
|-------|-----|-------|
| primary-50 | `#eff6ff` | Lightest backgrounds |
| primary-100 | `#dbeafe` | Light backgrounds |
| primary-200 | `#bfdbfe` | Subtle borders |
| primary-300 | `#93c5fd` | Disabled states |
| primary-400 | `#60a5fa` | Hover states |
| primary-500 | `#3b82f6` | Default primary |
| primary-600 | `#2563eb` | Primary buttons |
| primary-700 | `#1d4ed8` | Active states |
| primary-800 | `#1e40af` | Dark accents |
| primary-900 | `#1e3a8a` | Darkest accents |

### Semantic Colors
Consistent color system for different states:
- **Success**: Green (`bg-green-100`, `text-green-800`)
- **Error**: Red (`bg-red-100`, `text-red-800`)
- **Warning**: Yellow (`bg-yellow-100`, `text-yellow-800`)
- **Info**: Blue (`bg-blue-100`, `text-blue-800`)
- **Neutral**: Gray (`bg-gray-100`, `text-gray-800`)

### Shift Type Colors
- **AM**: Blue (`bg-blue-100`, `text-blue-800`)
- **PM**: Purple (`bg-purple-100`, `text-purple-800`)
- **BET**: Orange (`bg-orange-100`, `text-orange-800`)
- **OFF**: Gray (`bg-gray-100`, `text-gray-800`)

### Leave Type Colors
- **Sick**: Red with border (`bg-red-100`, `text-red-800`, `border-red-300`)
- **Annual**: Green with border (`bg-green-100`, `text-green-800`, `border-green-300`)
- **Casual**: Yellow with border (`bg-yellow-100`, `text-yellow-800`, `border-yellow-300`)
- **Public Holiday**: Indigo with border (`bg-indigo-100`, `text-indigo-800`, `border-indigo-300`)
- **Bereavement**: Gray with border (`bg-gray-200`, `text-gray-800`, `border-gray-400`)

### Status Colors
- **Pending Acceptance**: Yellow (`bg-yellow-100`, `text-yellow-800`)
- **Pending TL**: Blue (`bg-blue-100`, `text-blue-800`)
- **Pending WFM**: Purple (`bg-purple-100`, `text-purple-800`)
- **Approved**: Green (`bg-green-100`, `text-green-800`)
- **Rejected**: Red (`bg-red-100`, `text-red-800`)
- **Denied**: Orange (`bg-orange-100`, `text-orange-800`)

### Role Colors
- **Agent**: Blue (`bg-blue-100`, `text-blue-800`)
- **Team Lead**: Green (`bg-green-100`, `text-green-800`)
- **WFM**: Purple (`bg-purple-100`, `text-purple-800`)

### Reusable Components
The design system includes pre-defined styles for:
- **Buttons**: Primary, secondary, success, danger, warning, ghost, link
- **Badges**: Default, large, small sizes
- **Cards**: Default, hover, bordered, flat
- **Inputs**: Default, error, disabled states

### Helper Functions
- `getStatusColor()` - Get color class for any request status
- `getStatusLabel()` - Get label for any request status
- `getShiftColor()` - Get color class for shift types
- `getLeaveColor()` - Get color class for leave types
- `getRoleColor()` - Get color class for user roles
- `cn()` - Combine class names utility

### Typography
- Font Family: System font stack (default Tailwind)
- Headings: Bold weight with appropriate sizing
- Body: Regular weight, comfortable line height

---

## Documentation

The project includes comprehensive documentation in the `docs/` folder:

| Document | Description |
|----------|-------------|
| `accessibility.md` | Accessibility guidelines and WCAG compliance |
| `testing.md` | Testing strategy, coverage, and best practices |
| `performance.md` | Performance optimization techniques and monitoring |
| `monitoring.md` | Production monitoring and error tracking setup |
| `caching-strategy.md` | React Query caching configuration |
| `data-fetching-optimization.md` | Data fetching patterns and optimization |
| `pagination-usage.md` | Pagination implementation guide |
| `pagination-performance.md` | Pagination performance considerations |
| `cicd-monitoring.md` | CI/CD pipeline and monitoring |
| `developer-onboarding.md` | New developer onboarding guide |
| `team-training-guide.md` | Team training materials |
| `technical-debt.md` | Technical debt tracking |
| `production-readiness-summary.md` | Production readiness checklist |
| `production-readiness-scorecard.md` | Production readiness scoring |
| `final-review-checklist.md` | Pre-deployment checklist |
| `security-warnings-fix.md` | Security fixes documentation |

**Note**: Documentation has been consolidated from 33+ files to focused, non-overlapping documents for easier maintenance.

---

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is private and proprietary. All rights reserved.