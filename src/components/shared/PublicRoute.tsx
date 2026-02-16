import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface PublicRouteProps {
  children: React.ReactNode
}

/**
 * PublicRoute component for login/signup pages
 * Redirects authenticated users to dashboard or their originally requested route
 */
export default function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  // If user is authenticated, redirect to dashboard or originally requested route
  if (user) {
    // Check if there's a redirect location from ProtectedRoute
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }
  
  // User is not authenticated, show public page
  return <>{children}</>
}
