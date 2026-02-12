import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './lib/AuthContext'
import { ToastProvider, useToast } from './lib/ToastContext'
import { initializeErrorHandler } from './lib/errorHandler'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

// Eager load critical pages (only Login for immediate access)
import Login from './pages/Auth/Login'

// Lazy load all other pages for optimal code splitting
const Signup = lazy(() => import('./pages/Auth/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Unauthorized = lazy(() => import('./pages/Auth/Unauthorized'))
const LeaveRequests = lazy(() => import('./pages/LeaveRequests/LeaveRequests'))
const SwapRequests = lazy(() => import('./pages/SwapRequests/SwapRequests'))
const CreateLeaveRequest = lazy(() => import('./pages/LeaveRequests/CreateLeaveRequest'))
const CreateSwapRequest = lazy(() => import('./pages/SwapRequests/CreateSwapRequest'))
const LeaveRequestDetail = lazy(() => import('./pages/LeaveRequests/LeaveRequestDetail'))
const SwapRequestDetail = lazy(() => import('./pages/SwapRequests/SwapRequestDetail'))
const Settings = lazy(() => import('./pages/Settings'))
const Schedule = lazy(() => import('./pages/Schedule/Schedule'))
const ScheduleUpload = lazy(() => import('./pages/Schedule/ScheduleUpload'))
const LeaveBalances = lazy(() => import('./pages/LeaveRequests/LeaveBalances'))
const Reports = lazy(() => import('./pages/Reports'))
const EmployeeDirectory = lazy(() => import('./pages/Headcount/EmployeeDirectory'))
const EmployeeDetail = lazy(() => import('./pages/Headcount/EmployeeDetail'))
const BreakSchedule = lazy(() => import('./pages/BreakSchedule'))
const NotFound = lazy(() => import('./pages/NotFound'))

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

                {/* Protected routes - Employee accessible */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
                <Route path="/break-schedule" element={<ProtectedRoute><BreakSchedule /></ProtectedRoute>} />
                <Route path="/swap-requests" element={<ProtectedRoute><SwapRequests /></ProtectedRoute>} />
                <Route path="/swap-requests/create" element={<ProtectedRoute><CreateSwapRequest /></ProtectedRoute>} />
                <Route path="/swap-requests/:id" element={<ProtectedRoute><SwapRequestDetail /></ProtectedRoute>} />
                <Route path="/leave-requests" element={<ProtectedRoute><LeaveRequests /></ProtectedRoute>} />
                <Route path="/leave-requests/create" element={<ProtectedRoute><CreateLeaveRequest /></ProtectedRoute>} />
                <Route path="/leave-requests/:id" element={<ProtectedRoute><LeaveRequestDetail /></ProtectedRoute>} />
                <Route path="/leave-balances" element={<ProtectedRoute><LeaveBalances /></ProtectedRoute>} />

                {/* WFM only routes - Admin access */}
                <Route path="/settings" element={<ProtectedRoute requiredRoles={['wfm']}><Settings /></ProtectedRoute>} />
                <Route path="/schedule/upload" element={<ProtectedRoute requiredRoles={['wfm']}><ScheduleUpload /></ProtectedRoute>} />

                {/* TL and WFM routes - Manager access */}
                <Route path="/reports" element={<ProtectedRoute requiredRoles={['tl', 'wfm']}><Reports /></ProtectedRoute>} />
                <Route path="/headcount/employees" element={<ProtectedRoute requiredRoles={['tl', 'wfm']}><EmployeeDirectory /></ProtectedRoute>} />
                <Route path="/headcount/employees/:id" element={<ProtectedRoute requiredRoles={['tl', 'wfm']}><EmployeeDetail /></ProtectedRoute>} />

                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* 404 — Page Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </ToastProvider>
      </AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default App
