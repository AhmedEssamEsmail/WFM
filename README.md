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

### Shift Management
- View and manage daily shifts with four shift types: **AM**, **PM**, **BET**, and **OFF**
- Interactive calendar-based schedule view with color-coded shifts
- Bulk schedule upload via CSV for WFM administrators
- Track original shift assignments after swaps are completed
- Swap history tracking with original user information

### Swap Requests
- Request shift swaps with colleagues
- Multi-level approval workflow (peer acceptance → TL → WFM)
- Store and display all 4 shift types involved in a swap (requester's 2 shifts + target's 2 shifts)
- Full request detail pages with status timelines and approval history
- Comment system for discussions on swap requests
- Automatic shift updates upon approval

### Leave Management
- Submit leave requests for multiple leave types: **Sick**, **Annual**, **Casual**, **Public Holiday**, **Bereavement**
- Multi-level approval workflow (TL → WFM)
- Automatic leave balance validation before submission
- Auto-denial for insufficient balance with optional exception requests
- Leave balance tracking per employee with history
- Support for denied status with reason tracking
- Comment system for discussions on leave requests
- Date range selection with validation

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
  - FTE percentage and working hours
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
| **Backend / BaaS** | Supabase (PostgreSQL + Auth + Row-Level Security) |
| **Routing** | React Router v6 |
| **Date Utilities** | date-fns 3 |
| **Linting** | ESLint 9 + typescript-eslint + React Hooks plugin |
| **Deployment** | Vercel |

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
│   │   └── Headcount/
│   │       ├── EmployeeTable.tsx    # Employee directory table component
│   │       └── ProtectedEdit.tsx    # Protected edit wrapper for WFM-only actions
│   ├── hooks/
│   │   ├── useAuth.ts               # Authentication hook with role helpers
│   │   └── useHeadcount.ts          # Headcount data fetching & mutations
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client initialization
│   │   └── AuthContext.tsx          # Auth provider with session management
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
│   │   ├── Settings.tsx             # WFM settings configuration
│   │   ├── Unauthorized.tsx         # Unauthorized domain access page
│   │   └── Headcount/
│   │       ├── HeadcountDashboard.tsx    # Headcount metrics dashboard
│   │       ├── EmployeeDirectory.tsx     # Employee directory with filters
│   │       └── EmployeeDetail.tsx        # Individual employee profile
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
| **users** | User profiles linked to Supabase Auth with headcount fields | id, email, name, role, employee_id, status, department, hire_date, manager_id, fte_percentage |
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
| **v_headcount_active** | Joined view of users + headcount_profiles with manager info |
| **v_department_summary** | Department-level metrics (headcount, FTE, role distribution) |
| **v_management_chain** | Hierarchical management structure with reporting paths |

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

Get these values from your Supabase project dashboard under Settings → API.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR at `http://localhost:5173` |
| `npm run build` | Type-check with TypeScript and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |

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

### Color Palette
The application uses a custom blue primary color palette based on Tailwind's blue scale:

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

### Shift Type Colors
- **AM**: Blue (`bg-blue-100`, `text-blue-800`)
- **PM**: Green (`bg-green-100`, `text-green-800`)
- **BET**: Purple (`bg-purple-100`, `text-purple-800`)
- **OFF**: Gray (`bg-gray-100`, `text-gray-800`)

### Status Colors
- **Pending**: Yellow (`bg-yellow-100`, `text-yellow-800`)
- **Approved**: Green (`bg-green-100`, `text-green-800`)
- **Rejected/Denied**: Red (`bg-red-100`, `text-red-800`)

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