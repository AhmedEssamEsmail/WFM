import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { LeaveType, User } from '../types'

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'sick', label: 'Sick' },
  { value: 'annual', label: 'Annual' },
  { value: 'casual', label: 'Casual' },
  { value: 'public_holiday', label: 'Public Holiday' },
  { value: 'bereavement', label: 'Bereavement' }
]

export default function CreateLeaveRequest() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [leaveType, setLeaveType] = useState<LeaveType>('annual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // New state for "submit on behalf of" feature
  const [agents, setAgents] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loadingAgents, setLoadingAgents] = useState(false)

  // Check if current user can submit on behalf of others (WFM or TL roles)
  const canSubmitOnBehalf = user?.role === 'wfm' || user?.role === 'tl'

  // Fetch agents if user has WFM or TL role
  useEffect(() => {
    if (canSubmitOnBehalf) {
      fetchAgents()
    }
    // Set default selected user to current user
    if (user) {
      setSelectedUserId(user.id)
    }
  }, [user, canSubmitOnBehalf])

  const fetchAgents = async () => {
    setLoadingAgents(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name')

      if (error) throw error
      setAgents(data || [])
    } catch (err) {
      console.error('Error fetching agents:', err)
    } finally {
      setLoadingAgents(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!startDate || !endDate) {
      setError('Please select both start and end dates')
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date')
      return
    }

    // Use selected user ID (for WFM/TL submitting on behalf) or current user ID
    const targetUserId = canSubmitOnBehalf ? selectedUserId : user!.id

    setLoading(true)
    try {
      const { error: insertError } = await supabase
        .from('leave_requests')
        .insert({
          user_id: targetUserId,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          notes: notes || null,
          status: 'pending_tl'
        })

      if (insertError) throw insertError

      navigate('/dashboard')
    } catch (err) {
      console.error('Error creating leave request:', err)
      setError('Failed to create leave request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">New Leave Request</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* User selector for WFM/TL roles */}
          {canSubmitOnBehalf && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submit Request For
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={loadingAgents}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {loadingAgents ? (
                  <option>Loading users...</option>
                ) : (
                  agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} {agent.id === user?.id ? '(You)' : `(${agent.role})`}
                    </option>
                  ))
                )}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                As a {user?.role?.toUpperCase()}, you can submit leave requests on behalf of any user.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {LEAVE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
