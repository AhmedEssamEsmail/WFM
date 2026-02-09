import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import type { User, Shift, ShiftType } from '../../types'
import { shiftsService } from '../../services'
import { formatDate } from '../../utils'
import { swapRequestSchema } from '../../utils/validators'
import { ROUTES, ERROR_MESSAGES } from '../../constants'
import { ValidationError } from '../../types/errors'

const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  AM: 'AM Shift',
  PM: 'PM Shift',
  BET: 'BET Shift',
  OFF: 'Day Off'
}

export default function CreateSwapRequest() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [agents, setAgents] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [targetUserId, setTargetUserId] = useState('')
  const [myShifts, setMyShifts] = useState<Shift[]>([])
  const [targetShifts, setTargetShifts] = useState<Shift[]>([])
  const [myShiftId, setMyShiftId] = useState('')
  const [targetShiftId, setTargetShiftId] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [loadingShifts, setLoadingShifts] = useState(false)
  const [error, setError] = useState('')

  // New state for "submit on behalf of" feature
  const [requesterUserId, setRequesterUserId] = useState('')
  const [loadingAllUsers, setLoadingAllUsers] = useState(false)

  // Check if current user can submit on behalf of others (WFM or TL roles)
  const canSubmitOnBehalf = user?.role === 'wfm' || user?.role === 'tl'

  // Fetch other agents on mount
  useEffect(() => {
    if (canSubmitOnBehalf) {
      fetchAllUsers()
    }
    // Set default requester to current user
    if (user) {
      setRequesterUserId(user.id)
    }
  }, [user, canSubmitOnBehalf])

  // Fetch agents and requester's shifts when requester changes
  useEffect(() => {
    if (requesterUserId) {
      fetchAgents()
      fetchRequesterShifts()
    }
  }, [requesterUserId])

  // Fetch target user's shifts when target changes
  useEffect(() => {
    if (targetUserId) {
      fetchTargetShifts()
    } else {
      setTargetShifts([])
      setTargetShiftId('')
    }
  }, [targetUserId])

  const fetchAllUsers = async () => {
    setLoadingAllUsers(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name')

      if (error) throw error
      setAllUsers(data || [])
    } catch (err) {
      console.error('Error fetching all users:', err)
    } finally {
      setLoadingAllUsers(false)
    }
  }

  const fetchAgents = async () => {
    setLoadingAgents(true)
    try {
      // Get the effective requester ID (selected user for WFM/TL, or current user)
      const effectiveRequesterId = canSubmitOnBehalf ? requesterUserId : user!.id

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'agent')
        .neq('id', effectiveRequesterId)
        .order('name')

      if (error) throw error
      setAgents(data || [])
      // Reset target selection when requester changes
      setTargetUserId('')
      setTargetShifts([])
      setTargetShiftId('')
    } catch (err) {
      console.error('Error fetching agents:', err)
    } finally {
      setLoadingAgents(false)
    }
  }

  const fetchRequesterShifts = async () => {
    try {
      const effectiveRequesterId = canSubmitOnBehalf ? requesterUserId : user!.id
      const today = new Date().toISOString().split('T')[0]
      const data = await shiftsService.getUserShifts(effectiveRequesterId, today)
      setMyShifts(data.slice(0, 30)) // Limit to 30 shifts
      setMyShiftId('')
    } catch (err) {
      console.error('Error fetching requester shifts:', err)
    }
  }

  const fetchTargetShifts = async () => {
    setLoadingShifts(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const data = await shiftsService.getUserShifts(targetUserId, today)
      setTargetShifts(data.slice(0, 30)) // Limit to 30 shifts
      setTargetShiftId('')
    } catch (err) {
      console.error('Error fetching target shifts:', err)
    } finally {
      setLoadingShifts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Use selected requester ID (for WFM/TL submitting on behalf) or current user ID
    const effectiveRequesterId = canSubmitOnBehalf ? requesterUserId : user!.id

    // Validate with Zod
    const result = swapRequestSchema.safeParse({
      target_user_id: targetUserId,
      requester_shift_id: myShiftId,
      target_shift_id: targetShiftId,
    })

    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      const { error: insertError } = await supabase
        .from('swap_requests')
        .insert({
          requester_id: effectiveRequesterId,
          requester_shift_id: myShiftId,
          target_user_id: targetUserId,
          target_shift_id: targetShiftId,
          status: 'pending_acceptance',
          // Store ALL 4 original shift types for complete swap display
          requester_original_date: myShifts.find(s => s.id === myShiftId)?.date,
          requester_original_shift_type: myShifts.find(s => s.id === myShiftId)?.shift_type,
          target_original_date: targetShifts.find(s => s.id === targetShiftId)?.date,
          target_original_shift_type: targetShifts.find(s => s.id === targetShiftId)?.shift_type,
          // Store the other two shift types (requester on target date, target on requester date)
          requester_original_shift_type_on_target_date: myShifts.find(s => s.date === targetShifts.find(t => t.id === targetShiftId)?.date)?.shift_type,
          target_original_shift_type_on_requester_date: targetShifts.find(s => s.date === myShifts.find(m => m.id === myShiftId)?.date)?.shift_type
        })

      if (insertError) throw insertError

      navigate(ROUTES.DASHBOARD)
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.message)
      } else {
        console.error('Error creating swap request:', err)
        setError(ERROR_MESSAGES.SERVER)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatShiftOption = (shift: Shift) => {
    return `${formatDate(shift.date)} - ${SHIFT_TYPE_LABELS[shift.shift_type]}`
  }

  // Get the name of the selected requester for display
  const getRequesterName = () => {
    if (!canSubmitOnBehalf) return user?.name
    const selectedUser = allUsers.find(u => u.id === requesterUserId)
    return selectedUser?.name || user?.name
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">New Swap Request</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Requester selector for WFM/TL roles */}
          {canSubmitOnBehalf && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submit Request For (Requester)
              </label>
              <select
                value={requesterUserId}
                onChange={(e) => setRequesterUserId(e.target.value)}
                disabled={loadingAllUsers}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {loadingAllUsers ? (
                  <option>Loading users...</option>
                ) : (
                  allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.id === user?.id ? '(You)' : `(${u.role})`}
                    </option>
                  ))
                )}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                As a {user?.role?.toUpperCase()}, you can submit swap requests on behalf of any user.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getRequesterName()}'s Shift to Swap
            </label>
            <select
              value={myShiftId}
              onChange={(e) => setMyShiftId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a shift</option>
              {myShifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {formatShiftOption(shift)}
                </option>
              ))}
            </select>
            {myShifts.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">No upcoming shifts found</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Swap With Agent
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              disabled={loadingAgents}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select an agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            {loadingAgents && (
              <p className="mt-1 text-sm text-gray-500">Loading agents...</p>
            )}
          </div>

          {targetUserId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Agent's Shift
              </label>
              <select
                value={targetShiftId}
                onChange={(e) => setTargetShiftId(e.target.value)}
                disabled={loadingShifts}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a shift</option>
                {targetShifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {formatShiftOption(shift)}
                  </option>
                ))}
              </select>
              {loadingShifts ? (
                <p className="mt-1 text-sm text-gray-500">Loading shifts...</p>
              ) : targetShifts.length === 0 ? (
                <p className="mt-1 text-sm text-gray-500">No upcoming shifts found</p>
              ) : null}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !myShiftId || !targetShiftId}
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
