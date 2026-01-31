# SwapTool

A shift management and swap request system for teams. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Shift Management**: View and manage daily shifts (AM/PM/BET/OFF)
- **Swap Requests**: Request shift swaps with colleagues with multi-level approval
- **Leave Management**: Submit and track leave requests
- **Role-Based Access**:
  - **Agent**: View shifts, request swaps and leaves
  - **Team Lead (TL)**: Approve/reject team requests
  - **WFM**: Final approval authority, manage settings

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Routing**: React Router v6

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
   - Go to the SQL Editor and run the schema from `supabase/schema.sql`
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
│   ├── AuthContext.tsx  # Auth context provider
│   └── supabase.ts      # Supabase client
├── pages/          # Page components
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   └── Signup.tsx
├── types/          # TypeScript type definitions
│   └── index.ts
├── App.tsx         # Main app with routing
├── main.tsx        # Entry point
└── index.css       # Global styles with Tailwind
```

## Authentication

- Only `@dabdoob.com` email addresses can register
- New users are assigned the 'agent' role by default
- Role changes require WFM access

## Database Schema

See `supabase/schema.sql` for the complete database schema including:
- Users with roles (agent/tl/wfm)
- Shifts with types (AM/PM/BET/OFF)
- Swap requests with approval workflow
- Leave requests with approval workflow
- Leave balances per user
- Comments on requests
- Settings for WFM configuration

## License

Private - All rights reserved
