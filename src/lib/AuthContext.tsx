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
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper: Convert Supabase errors to the specific user messages you requested
function getUserFriendlyError(error: any): Error {
  const errorMessage = typeof error === 'string' 
    ? error 
    : (error?.message || error?.error_description || error?.msg || 'Unknown error')
  
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

  const fetchUserProfile = useCallback(async (userId: string, retryCount = 0) => {
    try {
      console.log('Fetching user profile for:', userId, 'Retry:', retryCount)
      const data = await authService.getUserProfile(userId)
      console.log('User profile fetched:', data)
      setUser(data)
    } catch (error: any) {
      console.error('Error fetching user profile:', error)
      // If user profile doesn't exist yet (OAuth user), retry a few times
      // The database trigger might still be creating the profile
      if (retryCount < 3 && (error?.code === 'PGRST116' || error?.message?.includes('No rows'))) {
        console.log('Retrying profile fetch...')
        setTimeout(() => fetchUserProfile(userId, retryCount + 1), 500)
        return
      }
      handleDatabaseError(error, 'fetch user profile')
      setUser(null)
    } finally {
      if (retryCount === 0) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    console.log('AuthProvider mounted')
    alert('AuthProvider mounted - checking OAuth callback')
    
    // Check for error in URL hash (OAuth errors)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const error = hashParams.get('error')
    const errorDescription = hashParams.get('error_description')
    const accessToken = hashParams.get('access_token')
    
    console.log('Hash params:', { error, errorDescription, accessToken, fullHash: window.location.hash })
    
    if (error) {
      console.error('OAuth error:', error, errorDescription)
      alert(`OAuth Error: ${errorDescription || error}`)
    }
    
    if (accessToken) {
      alert('Access token found in URL! OAuth succeeded.')
    }

    console.log('Getting initial session...')
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Initial session:', session, 'Error:', error)
      alert(`Session check: ${session ? 'Session exists' : 'No session'} ${error ? 'Error: ' + error.message : ''}`)
      setSession(session)
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        console.log('User found in session, fetching profile...')
        fetchUserProfile(session.user.id)
      } else {
        console.log('No user in session')
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session:', session)
      alert(`Auth event: ${event}`)
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
    } catch (error: any) {
      return { error: error instanceof Error ? error : getUserFriendlyError(error), session: null }
    }
  }

  async function signInWithGoogle() {
    try {
      await authService.signInWithGoogle()
      // OAuth will redirect, so no need to handle response here
    } catch (error) {
      console.error('Google sign-in error:', error)
      throw getUserFriendlyError(error)
    }
  }

  async function signOut() {
    await authService.signOut()
    setUser(null)
    setSupabaseUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, supabaseUser, session, loading, isAuthenticated, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
