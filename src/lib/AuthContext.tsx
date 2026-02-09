import { createContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { User } from '../types'
import { authService } from '../services'
import { ERROR_MESSAGES } from '../constants'
import { handleDatabaseError } from './errorHandler'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null; session: Session | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper: Convert Supabase errors to the specific user messages you requested
function getUserFriendlyError(error: unknown): Error {
  const errorMessage = typeof error === 'string' 
    ? error 
    : (error && typeof error === 'object' && 'message' in error ? (error as { message?: string; error_description?: string; msg?: string }).message || (error as { error_description?: string }).error_description || (error as { msg?: string }).msg : undefined) || 'Unknown error'
  
  const message = errorMessage.toLowerCase()
  
  // 1. Not Confirmed User
  if (message.includes('email not confirmed')) {
    return new Error('Please verify your email address. Check your inbox for the confirmation link.')
  }

  // 2. Wrong Password or Invalid Credentials
  // Supabase returns 'Invalid login credentials' for both wrong password and wrong email (security best practice)
  if (message.includes('invalid login credentials') || message.includes('invalid email or password') || message.includes('invalid grant')) {
    return new Error('Invalid email or password. Please check your credentials.')
  }

  // 3. User Not Found (Rarely returned directly by Supabase for security, but handled just in case)
  if (message.includes('user not found')) {
    return new Error('No account found with this email. Please sign up first.')
  }

  // 4. Other common errors
  if (message.includes('invalid email')) return new Error('Please enter a valid email address.')
  if (message.includes('rate limit')) return new Error('Too many login attempts. Please wait a moment.')
  if (message.includes('network') || message.includes('fetch')) return new Error(ERROR_MESSAGES.NETWORK)

  return new Error(errorMessage) // Fallback
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!session && !!user

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const data = await authService.getUserProfile(userId)
      setUser(data)
    } catch (error) {
      handleDatabaseError(error, 'fetch user profile')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setSupabaseUser(session?.user ?? null)
      if (session?.user) fetchUserProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setSupabaseUser(session?.user ?? null)
      if (session?.user) fetchUserProfile(session.user.id)
      else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

  async function signUp(email: string, password: string, name: string) {
    try {
      await authService.signUp(email, password, name)
      return { error: null }
    } catch (error) {
      return { error: getUserFriendlyError(error) }
    }
  }

  async function signIn(email: string, password: string) {
    try {
      // Note: We avoid setting global loading(true) here to prevent UI flickers that might reset form state
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw getUserFriendlyError(error)

      if (data.session?.user) {
        setSession(data.session)
        setSupabaseUser(data.session.user)
        await fetchUserProfile(data.session.user.id)
      }

      return { error: null, session: data.session }
    } catch (error) {
      return { error: error instanceof Error ? error : getUserFriendlyError(error), session: null }
    }
  }

  async function signOut() {
    await authService.signOut()
    setUser(null)
    setSupabaseUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, supabaseUser, session, loading, isAuthenticated, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
