import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCreateOvertimeRequest, useOvertimeRequests } from '../../hooks/useOvertimeRequests'
import { useOvertimeSettings } from '../../hooks/useOvertimeSettings'
import { shiftsService } from '../../services'
import { calculateHours, validateOvertimeRequest } from '../../utils/overtimeValidation'
import type { OvertimeType, Shift } from '../../types'
import { ROUTES } from '../../constants'

const SHIFT_TYPE_LABELS: Record<string, string> = {
  AM: 'AM Shift',
  PM: 'PM Shift',
  BET: 'BET Shift',
  OFF: 'Day Off'
}

export default function CreateOvertimeRequest() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: settings, isLoading: loadingSettings } = useOvertimeSettings()
  const { overtimeRequests: existingRequests } = useOvertimeRequests()
  const createMutation = useCreateOvertimeRequest()
  
  const [requestDate, setRequestDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [overtimeType, setOvertimeType] = useState<OvertimeType>('regular')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  
  // Shift information
  const [shift, setShift] = useState<Shift | null>(null)
  const [loadingShift, setLoadingShift] = useState(false)
  
  // Calculate total hours
  const totalHours = startTime && endTime ? calculateHours(startTime, endTime) : 0

  // Fetch shift information when date changes
  useEffect(() => {
    if (requestDate && user && settings?.require_shift_verification.enabled) {
      fetchShiftInfo()
    } else {
      setShift(null)
    }
  }, [requestDate, user, settings])

  const fetchShiftInfo = async () => {
    if (!user || !requestDate) return
    
    setLoadingShift(true)
    try {
      const shifts = await shiftsService.getUserShifts(user.id, requestDate, requestDate)
      setShift(shifts.length > 0 ? shifts[0] : null)
    } catch (err) {
      console.error('Error fetching shift info:', err)
      setShift(null)
    } finally {
      setLoadingShift(false)
    }
  }

  // Validate form on input changes
  useEffect(() => {
    if (!requestDate || !startTime || !endTime || !reason || !settings) {
      setErrors([])
      setWarnings([])
      return
    }

    const input = {
      request_date: requestDate,
      start_time: startTime,
      end_time: endTime,
      overtime_type: overtimeType,
      reason
    }

    const validation = validateOvertimeRequest(input, settings, existingRequests)
    
    setErrors(validation.errors)
    setWarnings(validation.warnings)
  }, [requestDate, startTime, endTime, overtimeType, reason, settings, existingRequests])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (errors.length > 0) {
      return
    }

    try {
      await createMutation.mutateAsync({
        request_date: requestDate,
        start_time: startTime,
        end_time: endTime,
        overtime_type: overtimeType,
        reason
      })
      
      navigate(ROUTES.OVERTIME_REQUESTS)
    } catch (err) {
      console.error('Error creating overtime request:', err)
    }
  }

  const isSubmitDisabled = 
    !requestDate || 
    !startTime || 
    !endTime || 
    !reason || 
    errors.length > 0 || 
    createMutation.isPending ||
    loadingSettings

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">New Overtime Request</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error messages */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warning messages */}
          {warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
              <ul className="list-disc list-inside space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Mutation error */}
          {createMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Failed to create overtime request. Please try again.
            </div>
          )}

          {/* Work Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Date
            </label>
            <input
              type="date"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Shift Information */}
          {settings?.require_shift_verification.enabled && requestDate && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Scheduled Shift</h3>
              {loadingShift ? (
                <p className="text-sm text-gray-500">Loading shift information...</p>
              ) : shift ? (
                <div className="text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Shift Type:</span>{' '}
                    {SHIFT_TYPE_LABELS[shift.shift_type] || shift.shift_type}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-yellow-600">
                  ⚠️ No scheduled shift found for this date
                </p>
              )}
            </div>
          )}

          {/* Overtime Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overtime Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="regular"
                  checked={overtimeType === 'regular'}
                  onChange={(e) => setOvertimeType(e.target.value as OvertimeType)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Regular Overtime (1.5x pay)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="double"
                  checked={overtimeType === 'double'}
                  onChange={(e) => setOvertimeType(e.target.value as OvertimeType)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Double Time (2.0x pay)
                </span>
              </label>
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Calculated Total Hours */}
          {totalHours > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <p className="text-sm text-gray-700">
                Total Hours: <span className="font-medium text-lg">{totalHours.toFixed(2)}</span>
              </p>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Explain why you worked overtime (10-250 characters)..."
              required
              minLength={10}
              maxLength={250}
            />
            <p className="mt-1 text-sm text-gray-500">
              {reason.length}/250 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.OVERTIME_REQUESTS)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
