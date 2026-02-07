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
- [License](#license)

---

## Features

### Shift Management
- View and manage daily shifts with four shift types: **AM**, **PM**, **BET**, and **OFF**
- Bulk schedule upload support for WFM administrators
- Interactive calendar-based schedule view

### Swap Requests
- Request shift swaps with colleagues
- Multi-level approval workflow (peer acceptance → TL → WFM)
- Track original shift information after swaps are completed
- Full request detail pages with status timelines

### Leave Management
- Submit leave requests for multiple leave types: **Sick**, **Annual**, **Casual**, **Public Holiday**, **Bereavement**
- Multi-level approval workflow (TL → WFM)
- Leave balance tracking per employee
- Support for denied status with reason tracking

### Headcount Management
- Employee directory with search and filtering (by department, status, role)
- Individual employee detail pages
- Department-level analytics and headcount metrics
- Track employee status (active, on leave, terminated, etc.)
- Protected edit functionality for authorized users

### Comment System
- Add comments on leave and swap requests for team discussions
- Threaded discussions on request detail pages

### WFM Settings
- Auto-approve toggle to streamline approval workflows
- Configurable settings for WFM administrators

### Role-Based Access Control (RBAC)

| Role | Capabilities |
|------|-------------|
| **Agent** | View own shifts, request swaps and leaves, comment on own requests |
| **Team Lead (TL)** | All Agent permissions + approve/reject team requests, add comments on team requests |
| **WFM** | All TL permissions + final approval authority, manage settings, schedule upload, auto-approve configuration, headcount management |

---

## Approval Workflows

### Leave Requests

```
Agent submits leave request
  └─→ Status: pending_tl
        └─→ TL approves
              └─→ Status: pending_wfm (or approved if auto-approve is enabled)
                    └─→ WFM approves
                          └─→ Status: approved
```

### Swap Requests

```
Agent requests swap
  └─→ Status: pending_acceptance
        └─→ Target user accepts
              └─→ Status: pending_tl
                    └─→ TL approves
                          └─→ Status: pending_wfm (or approved if auto-approve is enabled)
                                └─→ WFM approves
                                      └─→ Status: approved
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
├── src/
│   ├── main.tsx                     # Application entry point
│   ├── App.tsx                      # Root component with routing configuration
│   ├── components/
│   │   ├── Layout.tsx               # App shell with sidebar navigation & RBAC
│   │   └── Headcount/
│   ├── hooks/
│   │   ├── useAuth.ts               # Authentication hook
│   │   └── useHeadcount.ts          # Headcount data fetching & mutations
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client initialization
│   │   └── AuthContext.tsx          # Auth provider with session management
│   ├── pages/                       # All route pages
│   └── types/
│       └── index.ts                 # TypeScript type definitions
├── .env.example                     # Environment variable template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                      # Vercel config (SPA rewrites + security headers)
└── vite.config.ts
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| **users** | User profiles linked to Supabase Auth |
| **shifts** | Daily shift assignments |
| **swap_requests** | Shift swap requests with multi-level approval |
| **leave_requests** | Leave/time-off requests with type and approval status |
| **leave_balances** | Per-user leave entitlement balances |
| **comments** | Comments on swap/leave requests |
| **wfm_settings** | Application-wide WFM configuration |

*All tables are protected with Row-Level Security policies.*

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

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to the SQL Editor and run the migrations in order:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_add_shifts.sql`
     - `supabase/migrations/003_comments_and_settings.sql`
   - Copy your project URL and anon key from Settings -> API

4. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your Supabase credentials.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/     # Reusable UI components
│   └── Layout.tsx  # Main app layout with navigation
├── hooks/          # Custom React hooks
│   └── useAuth.ts  # Authentication hook
├── lib/            # Utilities and configurations
│   ├── supabase.ts # Supabase client
│   └── AuthContext.tsx # Auth context provider
├── pages/          # Route pages
│   ├── Dashboard.tsx
│   ├── LeaveRequests.tsx
│   ├── LeaveRequestDetail.tsx
│   ├── SwapRequests.tsx
│   ├── SwapRequestDetail.tsx
│   ├── Settings.tsx
│   └── ...
├── types/          # TypeScript type definitions
│   └── index.ts
├── App.tsx         # Root component with routing
└── main.tsx        # Entry point
```

## Database Schema

### Tables

- **users**: User profiles with roles (agent, tl, wfm)
- **shifts**: Daily shift assignments
- **swap_requests**: Shift swap requests with approval tracking
- **leave_requests**: Leave requests with approval tracking
- **comments**: Discussion comments on requests
- **settings**: Application settings (e.g., auto-approve)
