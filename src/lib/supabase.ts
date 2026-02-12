import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use localStorage for persistent sessions across browser tabs/windows
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Auto-refresh tokens before they expire
    autoRefreshToken: true,
    // Persist session across page reloads
    persistSession: true,
    // Detect session from URL (for email confirmation links, etc.)
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'wfm-system',
    },
  },
  db: {
    schema: 'public',
  },
  // Retry failed requests with exponential backoff
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
