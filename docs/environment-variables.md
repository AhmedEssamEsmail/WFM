# Environment Variables

This document describes all environment variables used in the WFM application.

## Required Variables

### Supabase Configuration

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Description**: Supabase project URL and anonymous key for database and authentication.

**How to get**:
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL and anon/public key

### Email Domain Restriction

```bash
VITE_ALLOWED_EMAIL_DOMAIN=dabdoob.com
```

**Description**: Email domain allowed for user registration and authentication.

**Default**: `dabdoob.com`

### Sentry Configuration (Production)

```bash
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**Description**: Sentry DSN for error tracking and performance monitoring in production.

**How to get**:
1. Create a project in Sentry
2. Go to Settings → Projects → [Your Project] → Client Keys (DSN)
3. Copy the DSN

**Note**: Only used in production builds. Optional for development.

## Environment Files

### `.env.example`
Template file with placeholder values. Copy this to create your local environment file.

```bash
cp .env.example .env
```

### `.env`
Local development environment variables. **Never commit this file**.

### `.env.test`
Environment variables for running tests. Used by Vitest.

### `.env.production`
Production environment variables. Set these in your deployment platform (Vercel, etc.).

## Setup Instructions

### Local Development

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_ALLOWED_EMAIL_DOMAIN=dabdoob.com
   ```

3. (Optional) Add Sentry DSN for local error tracking:
   ```bash
   VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Testing

1. Copy the test example file:
   ```bash
   cp .env.test.example .env.test
   ```

2. Fill in test Supabase credentials (use a separate test project):
   ```bash
   VITE_SUPABASE_URL=https://your-test-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-test-anon-key
   VITE_ALLOWED_EMAIL_DOMAIN=dabdoob.com
   ```

3. Run tests:
   ```bash
   npm test
   ```

### Production Deployment (Vercel)

1. Go to your Vercel project settings
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ALLOWED_EMAIL_DOMAIN`
   - `VITE_SENTRY_DSN`

4. Deploy:
   ```bash
   npm run build
   ```

## Variable Naming Convention

All client-side environment variables must be prefixed with `VITE_` to be exposed to the application.

**Example**:
```bash
# ✅ Correct - Will be available in the app
VITE_API_URL=https://api.example.com

# ❌ Wrong - Will NOT be available in the app
API_URL=https://api.example.com
```

## Security Notes

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use different credentials for development and production**
3. **Rotate keys regularly** - Especially if they're exposed
4. **Use Supabase RLS policies** - Don't rely solely on client-side security
5. **Keep `.env.example` updated** - But with placeholder values only

## Troubleshooting

### "Invalid API key" error
- Check that your `VITE_SUPABASE_ANON_KEY` is correct
- Verify the key matches your Supabase project
- Ensure the key is the anon/public key, not the service role key

### "Unauthorized domain" error
- Check that your email domain matches `VITE_ALLOWED_EMAIL_DOMAIN`
- Verify the domain is set correctly in your environment

### Environment variables not loading
- Ensure variables are prefixed with `VITE_`
- Restart the development server after changing `.env`
- Check that `.env` file is in the project root

### Sentry not tracking errors
- Verify `VITE_SENTRY_DSN` is set correctly
- Check that you're running a production build (`npm run build`)
- Sentry is disabled in development mode

## References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Documentation](https://supabase.com/docs)
- [Sentry Documentation](https://docs.sentry.io/)
