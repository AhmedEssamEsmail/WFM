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
- Multi-level approval workflow (TL → WFM)
- Automatic leave balance validation before submission
- Auto-denial for insufficient balance with optional exception requests
- Leave balance tracking per employee with history
- Support for denied status with reason tracking
- Comment system for discussions on leave requests
- Date range selection with validation
- **Unified design system** with consistent status colors

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
- **Chunk Loading Error Handling**: Automatic page reload on deployment-related chunk errors with service worker cleanup
- **Enhanced UI/UX**:
  - Status badges repositioned for consistency across Leave and Swap request pages
  - Agent name filter added to Leave Balances page for TL/WFM users
  - Updated Reports navigation icon for better visual distinction
- **Database Optimization**:
  - Removed FTE (Full-Time Equivalent) tracking from all employee pages and database
  - Simplified headcount metrics and department summaries
  - Updated database views to exclude FTE calculations
- **Performance Indexes**: Added database indexes for frequently queried fields
- **System Comment Protection**: Enhanced RLS policies to prevent unauthorized comment modifications
- **Atomic Swap Execution**: Improved swap request approval with transaction safety

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
- Automatic balance initialization for new users
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
- Real-time settings updates across the application

### Role-Based Access Control (RBAC)

| Role | Capabilities |
|------|-------------|
| **Agent** | View own shifts, request swaps and leaves, comment on own requests, view own leave balances |
| **Team Lead (TL)** | All Agent permissions + approve/reject team requests, add comments on team requests, view headcount directory (read-only) |
| **WFM** | All TL permissions + final approval authority, manage settings, schedule upload, auto-approve configuration, full headcount management (create/edit/delete), bulk imports, leave balance management |

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
| **Testing** | Vitest + React Testing Library (36 tests) |
| **Linting** | ESLint 9 + typescript-eslint + React Hooks plugin |
| **Deployment** | Vercel |

### Build Stats
- **Bundle Size**: 571 KB (150 KB gzipped) - Optimized with code splitting
- **Test Coverage**: 36 passing unit tests
- **TypeScript**: Strict mode enabled with zero errors
- **Performance**: PWA-enabled with offline support and caching

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
├── public/                          # Static assets (favicons, manifest)
├── supabase/
│   ├── schema.sql                   # Full database schema (tables, RLS, triggers)
│   └── migrations/                  # Incremental SQL migrations
│       ├── 003_comments_and_settings.sql
│       ├── 004_phase4.sql
│       ├── 005_swap_requests_rls_policies.sql
│       ├── 006_swap_requests_original_shift_info.sql
│       ├── 007_add_denied_status_to_leave_requests.sql
│       └── 007_swap_requests_additional_original_shift_types.sql
├── src/
│   ├── main.tsx                     # Application entry point
│   ├── App.tsx                      # Root component with routing & route guards
│   ├── index.css                    # Global styles with Tailwind directives
│   ├── components/
│   │   ├── Layout.tsx               # App shell with sidebar navigation & RBAC
│   │   ├── ErrorBoundary.tsx        # Error boundary for graceful error handling
│   │   ├── Toast.tsx                # Toast notification component
│   │   ├── ToastContainer.tsx       # Toast container with positioning
│   │   ├── Skeleton.tsx             # Loading skeleton components (7 variants)
│   │   └── Headcount/
│   │       ├── EmployeeTable.tsx    # Employee directory table component
│   │       └── ProtectedEdit.tsx    # Protected edit wrapper for WFM-only actions
│   ├── hooks/
│   │   ├── useAuth.ts               # Authentication hook with role helpers
│   │   ├── useHeadcount.ts          # Headcount data fetching & mutations
│   │   ├── useSwapRequests.ts       # Swap requests with React Query
│   │   ├── useLeaveRequests.ts      # Leave requests with React Query
│   │   └── useSettings.ts           # Settings management with React Query
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client initialization
│   │   ├── AuthContext.tsx          # Auth provider with session management
│   │   ├── ToastContext.tsx         # Toast notification context
│   │   ├── queryClient.ts           # React Query client configuration
│   │   └── designSystem.ts          # Unified design system (colors, styles, helpers)
│   ├── pages/
│   │   ├── Dashboard.tsx            # Main dashboard with pending requests
│   │   ├── Login.tsx                # Login page with domain validation
│   │   ├── Signup.tsx               # User registration
│   │   ├── Schedule.tsx             # Calendar view of shifts
│   │   ├── ScheduleUpload.tsx       # CSV bulk upload for shifts (WFM only)
│   │   ├── SwapRequests.tsx         # List of swap requests
│   │   ├── SwapRequestDetail.tsx    # Individual swap request details
│   │   ├── CreateSwapRequest.tsx    # Create new swap request
│   │   ├── LeaveRequests.tsx        # List of leave requests
│   │   ├── LeaveRequestDetail.tsx   # Individual leave request details
│   │   ├── CreateLeaveRequest.tsx   # Create new leave request
│   │   ├── LeaveBalances.tsx        # Leave balance management (WFM only)
│   │   ├── Reports.tsx              # Reports dashboard with charts (TL/WFM only)
│   │   ├── Settings.tsx             # WFM settings configuration
│   │   ├── Unauthorized.tsx         # Unauthorized domain access page
│   │   └── Headcount/
│   │       ├── HeadcountDashboard.tsx    # Headcount metrics dashboard
│   │       ├── EmployeeDirectory.tsx     # Employee directory with filters
│   │       └── EmployeeDetail.tsx        # Individual employee profile
│   ├── test/                        # Unit tests (36 passing tests)
│   │   ├── setup.ts                 # Test configuration
│   │   ├── components/              # Component tests
│   │   ├── hooks/                   # Hook tests
│   │   └── utils/                   # Utility tests
│   └── types/
│       └── index.ts                 # TypeScript type definitions
├── .env.example                     # Environment variable template
├── .gitignore
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── postcss.config.js
├── vercel.json                      # Vercel config (SPA rewrites + security headers)
└── vite.config.ts
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
| **leave_types** | Configurable leave type definitions | id, label, color, is_active |

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

*All tables are protected with Row-Level Security (RLS) policies based on user roles.*

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

```bash
git clone https://github.com/AhmedEssamEsmail/WFM.git
cd WFM
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public API key |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## Deployment

Configured for **Vercel** with SPA rewrite rules and security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

---

## Security

- Authentication via **Supabase Auth** (email/password)
- **Row-Level Security** at the database level
- Role-based route guards on the frontend
- Security headers via Vercel
- Only public/anon keys exposed to client

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
| `npm run test` | Run unit tests with Vitest |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:coverage` | Generate test coverage report |

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

### Deployment Security
- Security headers via Vercel configuration:
  - `X-Frame-Options: DENY` (prevents clickjacking)
  - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin` (controls referrer information)
- HTTPS enforced on production
- Environment variables secured in Vercel dashboard

---

## Key Features Implementation

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