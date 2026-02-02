import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import LeaveRequests from './pages/LeaveRequests'
import SwapRequests from './pages/SwapRequests'
import CreateLeaveRequest from './pages/CreateLeaveRequest'
import CreateSwapRequest from './pages/CreateSwapRequest'
import LeaveRequestDetail from './pages/LeaveRequestDetail'
import SwapRequestDetail from './pages/SwapRequestDetail'
import Settings from './pages/Settings'
import Schedule from './pages/Schedule'
import ScheduleUpload from './pages/ScheduleUpload'
import LeaveBalances from './pages/LeaveBalances'
import Unauthorized from './pages/Unauthorized'

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
    // Sign out user with invalid domain
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
  
  // Check if user email is from allowed domain
  if (user.email && !user.email.endsWith('@dabdoob.com')) {
    signOut()
    return <Navigate to="/unauthorized" replace />
  }
  
  // Only allow WFM users
  if (user.role !== 'wfm') {
    return <Navigate to="/dashboard" replace />
  }
  
  return <Layout>{children}</Layout>
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
          <Route path="/swap-requests" element={<ProtectedRoute><SwapRequests /></ProtectedRoute>} />
          {/* Create routes must come BEFORE :id routes to prevent "create" from being matched as an ID */}
          <Route path="/swap-requests/create" element={<ProtectedRoute><CreateSwapRequest /></ProtectedRoute>} />
          <Route path="/swap-requests/new" element={<ProtectedRoute><CreateSwapRequest /></ProtectedRoute>} />
          <Route path="/swap-requests/:id" element={<ProtectedRoute><SwapRequestDetail /></ProtectedRoute>} />
          <Route path="/leave-requests" element={<ProtectedRoute><LeaveRequests /></ProtectedRoute>} />
          {/* Create routes must come BEFORE :id routes to prevent "create" from being matched as an ID */}
          <Route path="/leave-requests/create" element={<ProtectedRoute><CreateLeaveRequest /></ProtectedRoute>} />
          <Route path="/leave-requests/new" element={<ProtectedRoute><CreateLeaveRequest /></ProtectedRoute>} />
          <Route path="/leave-requests/:id" element={<ProtectedRoute><LeaveRequestDetail /></ProtectedRoute>} />
          <Route path="/leave-balances" element={<ProtectedRoute><LeaveBalances /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
          {/* WFM only routes */}
          <Route path="/schedule/upload" element={<WFMOnlyRoute><ScheduleUpload /></WFMOnlyRoute>} />
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
