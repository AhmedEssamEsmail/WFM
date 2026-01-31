# SwapTool

A shift management and swap request system for teams. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Shift Management**: View and manage daily shifts (AM/PM/BET/OFF)
- **Swap Requests**: Request shift swaps with colleagues with multi-level approval
- **Leave Management**: Submit and track leave requests
- **Request Detail Pages**: View full request info with status timeline and comments
- **Comment System**: Add comments on leave and swap requests for discussions
- **WFM Settings**: Auto-approve toggle to streamline approval workflow
- **Role-Based Access**:
  - **Agent**: View shifts, request swaps and leaves, comment on own requests
  - **Team Lead (TL)**: Approve/reject team requests, add comments
  - **WFM**: Final approval authority, manage settings, auto-approve configuration

## Approval Workflow

### Leave Requests
1. Agent submits leave request → Status: `pending_tl`
2. TL approves → Status: `pending_wfm` (or `approved` if auto-approve enabled)
3. WFM approves → Status: `approved`

### Swap Requests
1. Agent requests swap → Status: `pending_acceptance`
2. Target user accepts → Status: `pending_tl`
3. TL approves → Status: `pending_wfm` (or `approved` if auto-approve enabled)
4. WFM approves → Status: `approved`

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Routing**: React Router v6
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AhmedEssamEsmail/SwapTool.git
   cd SwapTool
   ```

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

## License

MIT
