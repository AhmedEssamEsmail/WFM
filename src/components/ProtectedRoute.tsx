import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Layout from './Layout'
import { UnauthorizedAccessError } from '../types/errors'
import { logUnauthorizedAccess } from '../lib/securityLogger'
import type { UserRole } from '../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
}

/**
 * ProtectedRoute component that handles:
 * 1. Authentication check - redirects to /login if not authenticated
 * 2. Domain-based access control - only @dabdoob.com emails allowed
 * 3. Role-based authorization - optional role restrictions
 * 4. Post-login redirect - preserves requested URL for redirect after login
 */
export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, loading, signOut } = useAuth()
  const location = useLocation()
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  // Redirect to login if not authenticated, preserving requested URL
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  // Domain-based access control: only @dabdoob.com emails allowed
  if (user.email && !user.email.endsWith('@dabdoob.com')) {
    // Log the domain violation
    logUnauthorizedAccess(
      user.id,
      user.role,
      location.pathname,
      `Invalid email domain: ${user.email}`,
      'domain_violation'
    )
    
    // Sign out the user before redirecting
    signOut()
    return <Navigate to="/unauthorized" replace />
  }
  
  // Role-based authorization: check if user has required role
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role)) {
      // Log unauthorized access attempt with security logger
      logUnauthorizedAccess(
        user.id,
        user.role,
        location.pathname,
        `Insufficient role permissions. Required: ${requiredRoles.join(', ')}, Has: ${user.role}`,
        'role_violation'
      )
      
      // Also log to console for immediate visibility
      console.warn('Unauthorized access attempt:', {
        userId: user.id,
        userRole: user.role,
        requestedRoute: location.pathname,
        requiredRoles,
        timestamp: new Date().toISOString(),
        reason: 'Insufficient role permissions'
      })
      
      // Create error for potential logging/monitoring
      const error = new UnauthorizedAccessError(
        user.id,
        location.pathname,
        user.role,
        requiredRoles
      )
      
      // Log the error (could be sent to monitoring service)
      console.error(error.message)
      
      // Redirect to dashboard instead of showing error page
      return <Navigate to="/dashboard" replace />
    }
  }
  
  // User is authenticated, has valid domain, and has required role
  return <Layout>{children}</Layout>
}
