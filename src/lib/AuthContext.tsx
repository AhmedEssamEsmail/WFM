import { createContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { User } from '../types'

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

// Helper function to convert Supabase errors to user-friendly messages
function getUserFriendlyError(error: AuthError | Error): Error {
  const message = error.message.toLowerCase()
  
  // Check for specific Supabase error messages
  if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
    return new Error('Invalid email or password. Please check your credentials and try again.')
  }
  
  if (message.includes('email not confirmed')) {
    return new Error('Please verify your email address before signing in. Check your inbox for the confirmation link.')
  }
  
  if (message.includes('user not found')) {
    return new Error('No account found with this email address. Please sign up first.')
  }
  
  if (message.includes('invalid email')) {
    return new Error('Please enter a valid email address.')
  }
  
  if (message.includes('password is too short') || message.includes('password should be at least')) {
    return new Error('Password must be at least 6 characters long.')
  }
  
  if (message.includes('user already registered')) {
    return new Error('An account with this email already exists. Please sign in instead.')
  }
  
  if (message.includes('only @dabdoob.com')) {
    return new Error('Only @dabdoob.com email addresses are allowed.')
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return new Error('Network error. Please check your internet connection and try again.')
  }
  
  if (message.includes('rate limit')) {
    return new Error('Too many attempts. Please wait a moment and try again.')
  }
  
  // If no specific error matched, return a generic message but keep the original for debugging
  console.error('Auth error:', error)
  return new Error('An error occurred during authentication. Please try again.')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Computed property for authenticated state
  const isAuthenticated = !!session && !!user

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUser(data as User)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

  async function signUp(email: string, password: string, name: string) {
    try {
      // Sign up with user metadata - trigger will create profile automatically
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })

      if (error) throw getUserFriendlyError(error)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw getUserFriendlyError(error)

      // Wait for session to be established and user profile to be fetched
      if (data.session?.user) {
        setSession(data.session)
        setSupabaseUser(data.session.user)
        await fetchUserProfile(data.session.user.id)
      }

      return { error: null, session: data.session }
    } catch (error) {
      setLoading(false)
      return { error: error as Error, session: null }
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setSupabaseUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      supabaseUser, 
      session, 
      loading, 
      isAuthenticated,
      signUp, 
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}
