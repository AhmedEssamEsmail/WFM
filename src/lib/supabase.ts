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
    // Configure fetch timeout (30 seconds) using Supabase's native configuration
    // This is safer than overriding globalThis.fetch as it only affects Supabase requests
    fetch: (url: RequestInfo | URL, init?: RequestInit) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      return fetch(url, {
        ...init,
        signal: init?.signal || controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId)
      })
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
