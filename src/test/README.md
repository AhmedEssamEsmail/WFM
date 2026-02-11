# Test Database Setup

This document explains how to set up and use the local test database for running tests.

## Overview

The WFM application uses Supabase for its database. For testing, we use a local Supabase instance that runs in Docker containers. This provides:

- **Isolation**: Tests run against a separate database, not production
- **Speed**: Local database is faster than remote connections
- **Consistency**: Same schema and data for all developers
- **Safety**: No risk of affecting production data

## Prerequisites

1. **Docker Desktop**: Must be installed and running
   - Download from: https://www.docker.com/products/docker-desktop/
   - Ensure Docker daemon is running before starting Supabase

2. **Node.js**: Version 18.x or higher
   - Check version: `node --version`

3. **Supabase CLI**: Installed via npx (no separate installation needed)
   - Verify: `npx supabase --version`

## Quick Start

### 1. Start Local Supabase

```bash
npx supabase start
```

This command will:
- Pull required Docker images (first time only, ~2-5 minutes)
- Start all Supabase services (database, API, auth, storage, etc.)
- Run all migrations to create the schema
- Display connection details

**Expected Output:**
```
Started supabase local development setup.

╭──────────────────────────────────────╮
│ 🔧 Development Tools                 │
├─────────┬────────────────────────────┤
│ Studio  │ http://127.0.0.1:54323     │
│ Mailpit │ http://127.0.0.1:54324     │
╰─────────┴────────────────────────────╯

╭──────────────────────────────────────────────────────╮
│ 🌐 APIs                                              │
├────────────────┬─────────────────────────────────────┤
│ Project URL    │ http://127.0.0.1:54321              │
│ REST           │ http://127.0.0.1:54321/rest/v1      │
╰────────────────┴─────────────────────────────────────╯

╭───────────────────────────────────────────────────────────────╮
│ ⛁ Database                                                    │
├─────┬─────────────────────────────────────────────────────────┤
│ URL │ postgresql://postgres:postgres@127.0.0.1:54322/postgres │
╰─────┴─────────────────────────────────────────────────────────╯
```

### 2. Seed Test Data

```bash
npm run seed-test-data
```

This will populate the test database with:
- 13 test users (2 WFM, 3 TL, 8 agents)
- 60 days of shifts for each user
- Leave balances for all users
- Sample swap requests (various statuses)
- Sample leave requests (various statuses)
- Sample comments

### 3. Run Tests

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm test

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### 4. Stop Supabase (when done)

```bash
npx supabase stop
```

## Test Database Configuration

The test database connection is configured in:

1. **Environment Variables** (`.env.example`):
   ```env
   VITE_SUPABASE_TEST_URL=http://127.0.0.1:54321
   VITE_SUPABASE_TEST_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
   ```

2. **Vitest Config** (`vite.config.ts`):
   ```typescript
   test: {
     env: {
       VITE_SUPABASE_TEST_URL: 'http://127.0.0.1:54321',
       VITE_SUPABASE_TEST_ANON_KEY: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
     },
   }
   ```

## Useful Commands

### Check Supabase Status

```bash
npx supabase status
```

Shows all running services and their URLs.

### View Database in Studio

Open http://127.0.0.1:54323 in your browser to:
- Browse tables and data
- Run SQL queries
- View RLS policies
- Manage users

### Reset Database

```bash
npx supabase db reset
```

This will:
- Drop all tables
- Re-run all migrations
- Clear all data

After reset, run `npm run seed-test-data` to repopulate test data.

### View Logs

```bash
npx supabase logs
```

View logs from all Supabase services.

## Test Data Structure

### Users
- **WFM**: 2 users (full access)
- **TL**: 3 users (team lead permissions)
- **Agents**: 8 users (basic permissions)

All users have email format: `{role}{number}@dabdoob.com`

### Shifts
- 60 days of shifts per user (30 days past, 30 days future)
- 80% working shifts (AM, PM, BET)
- 20% OFF days

### Leave Balances
- Annual: 5-25 days
- Casual: 2-12 days
- Sick: 5-20 days
- Public Holiday: 10 days
- Bereavement: 3 days

### Requests
- 5 swap requests (various statuses)
- 8 leave requests (various statuses)
- Comments on some requests

## Writing Tests with Test Database

### Example: Testing a Service

```typescript
import { createClient } from '@supabase/supabase-js';

const testSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL!,
  process.env.VITE_SUPABASE_TEST_ANON_KEY!
);

describe('Swap Requests Service', () => {
  it('should fetch swap requests', async () => {
    const { data, error } = await testSupabase
      .from('swap_requests')
      .select('*')
      .limit(10);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
  });
});
```

### Example: Testing RLS Policies

```typescript
describe('RLS Policies', () => {
  it('should allow agents to view their own shifts', async () => {
    // Get a test agent user
    const { data: users } = await testSupabase
      .from('users')
      .select('*')
      .eq('role', 'agent')
      .limit(1);
    
    const agent = users[0];
    
    // Query shifts as that agent
    const { data: shifts, error } = await testSupabase
      .from('shifts')
      .select('*')
      .eq('user_id', agent.id);
    
    expect(error).toBeNull();
    expect(shifts).toBeDefined();
  });
});
```

## Troubleshooting

### Docker Not Running

**Error**: `Cannot connect to the Docker daemon`

**Solution**: Start Docker Desktop and wait for it to fully start.

### Port Already in Use

**Error**: `Port 54321 is already allocated`

**Solution**: 
1. Stop Supabase: `npx supabase stop`
2. Check for other processes using the port
3. Restart Supabase: `npx supabase start`

### Migrations Failing

**Error**: `ERROR: relation "table_name" does not exist`

**Solution**:
1. Reset database: `npx supabase db reset`
2. Restart Supabase: `npx supabase start`
3. Re-seed data: `npm run seed-test-data`

### Test Database Connection Timeout

**Error**: `Connection timeout`

**Solution**:
1. Verify Supabase is running: `npx supabase status`
2. Check Docker containers: `docker ps`
3. Restart Supabase if needed

## CI/CD Integration

For GitHub Actions, the test database setup is handled automatically:

```yaml
- name: Start Supabase
  run: npx supabase start

- name: Seed test data
  run: npm run seed-test-data

- name: Run tests
  run: npm run test:run
```

## Best Practices

1. **Always start Supabase before running tests**
   - Tests will fail if the database is not running

2. **Seed data before running integration tests**
   - Unit tests may not need seeded data
   - Integration tests rely on realistic test data

3. **Clean up after tests**
   - Use `afterEach` or `afterAll` to clean up test data
   - Or re-seed data before each test run

4. **Don't commit test database credentials**
   - Test credentials are safe to commit (local only)
   - Production credentials must never be committed

5. **Use transactions for test isolation**
   - Wrap tests in transactions when possible
   - Rollback after each test to maintain clean state

## Additional Resources

- [Supabase Local Development Docs](https://supabase.com/docs/guides/cli/local-development)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
