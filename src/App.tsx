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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/leave-requests" element={
            <ProtectedRoute>
              <LeaveRequests />
            </ProtectedRoute>
          } />
          <Route path="/leave-requests/new" element={
            <ProtectedRoute>
              <CreateLeaveRequest />
            </ProtectedRoute>
          } />
          <Route path="/leave-requests/:id" element={
            <ProtectedRoute>
              <LeaveRequestDetail />
            </ProtectedRoute>
          } />
          <Route path="/swap-requests" element={
            <ProtectedRoute>
              <SwapRequests />
            </ProtectedRoute>
          } />
          <Route path="/swap-requests/new" element={
            <ProtectedRoute>
              <CreateSwapRequest />
            </ProtectedRoute>
          } />
          <Route path="/swap-requests/:id" element={
            <ProtectedRoute>
              <SwapRequestDetail />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
