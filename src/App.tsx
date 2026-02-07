import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './lib/AuthContext'
import { ToastProvider, useToast } from './lib/ToastContext'
import { initializeErrorHandler } from './lib/errorHandler'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'

// Eager load critical pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Unauthorized from './pages/Unauthorized'

// Lazy load heavy pages for code splitting
const LeaveRequests = lazy(() => import('./pages/LeaveRequests'))
const SwapRequests = lazy(() => import('./pages/SwapRequests'))
const CreateLeaveRequest = lazy(() => import('./pages/CreateLeaveRequest'))
const CreateSwapRequest = lazy(() => import('./pages/CreateSwapRequest'))
const LeaveRequestDetail = lazy(() => import('./pages/LeaveRequestDetail'))
const SwapRequestDetail = lazy(() => import('./pages/SwapRequestDetail'))
const Settings = lazy(() => import('./pages/Settings'))
const Schedule = lazy(() => import('./pages/Schedule'))
const ScheduleUpload = lazy(() => import('./pages/ScheduleUpload'))
const LeaveBalances = lazy(() => import('./pages/LeaveBalances'))
const Reports = lazy(() => import('./pages/Reports'))
const EmployeeDirectory = lazy(() => import('./pages/Headcount/EmployeeDirectory'))
const EmployeeDetail = lazy(() => import('./pages/Headcount/EmployeeDetail'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
}

// Initialize error handler with toast function
function ErrorHandlerInitializer() {
  const { error: showError } = useToast()
  
  useEffect(() => {
    // Create a wrapper that matches the expected signature
    const errorToastFn = (message: string, type: 'error' | 'success' | 'warning' | 'info') => {
      if (type === 'error') {
        showError(message)
      }
    }
    initializeErrorHandler(errorToastFn)
  }, [showError])
  
  return null
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Check if user email is from allowed domain
  if (user.email && !user.email.endsWith('@dabdoob.com')) {
    signOut()
    return <Navigate to="/unauthorized" replace />
  }
  
  return <Layout>{children}</Layout>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function WFMOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (user.email && !user.email.endsWith('@dabdoob.com')) {
    signOut()
    return <Navigate to="/unauthorized" replace />
  }
  
  if (user.role !== 'wfm') {
    return <Navigate to="/dashboard" replace />
  }
  
  return <Layout>{children}</Layout>
}

// NEW: TL and WFM can view headcount, only WFM can edit
function HeadcountRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut, canViewHeadcount } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (user.email && !user.email.endsWith('@dabdoob.com')) {
    signOut()
    return <Navigate to="/unauthorized" replace />
  }
  
  if (!canViewHeadcount()) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <Layout>{children}</Layout>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ErrorHandlerInitializer />
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
                <Route path="/swap-requests" element={<ProtectedRoute><SwapRequests /></ProtectedRoute>} />
                <Route path="/swap-requests/create" element={<ProtectedRoute><CreateSwapRequest /></ProtectedRoute>} />
                <Route path="/swap-requests/new" element={<ProtectedRoute><CreateSwapRequest /></ProtectedRoute>} />
                <Route path="/swap-requests/:id" element={<ProtectedRoute><SwapRequestDetail /></ProtectedRoute>} />
                <Route path="/leave-requests" element={<ProtectedRoute><LeaveRequests /></ProtectedRoute>} />
                <Route path="/leave-requests/create" element={<ProtectedRoute><CreateLeaveRequest /></ProtectedRoute>} />
                <Route path="/leave-requests/new" element={<ProtectedRoute><CreateLeaveRequest /></ProtectedRoute>} />
                <Route path="/leave-requests/:id" element={<ProtectedRoute><LeaveRequestDetail /></ProtectedRoute>} />
                <Route path="/leave-balances" element={<ProtectedRoute><LeaveBalances /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                
                {/* WFM only routes */}
                <Route path="/schedule/upload" element={<WFMOnlyRoute><ScheduleUpload /></WFMOnlyRoute>} />
                
                {/* TL and WFM routes */}
                <Route path="/reports" element={<HeadcountRoute><Reports /></HeadcountRoute>} />
                <Route path="/headcount/employees" element={<HeadcountRoute><EmployeeDirectory /></HeadcountRoute>} />
                <Route path="/headcount/employees/:id" element={<HeadcountRoute><EmployeeDetail /></HeadcountRoute>} />
                
                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Catch all */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </ToastProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
