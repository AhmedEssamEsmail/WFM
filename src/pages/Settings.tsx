import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../lib/ToastContext'
import { settingsService } from '../services'
import { ROUTES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants'

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [autoApprove, setAutoApprove] = useState(false)
  const [allowLeaveExceptions, setAllowLeaveExceptions] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Redirect if not WFM
    if (user && user.role !== 'wfm') {
      navigate(ROUTES.DASHBOARD)
      return
    }
    fetchSettings()
  }, [user, navigate])

  async function fetchSettings() {
    try {
      // Use service to fetch settings
      const autoApproveValue = await settingsService.getAutoApproveSetting()
      const exceptionsValue = await settingsService.getAllowLeaveExceptionsSetting()
      
      setAutoApprove(autoApproveValue)
      setAllowLeaveExceptions(exceptionsValue)
    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAutoApproveToggle() {
    setSaving(true)

    try {
      const newValue = !autoApprove
      await settingsService.updateSetting('wfm_auto_approve', newValue.toString())
      
      setAutoApprove(newValue)
      success(SUCCESS_MESSAGES.SAVE)
    } catch (err) {
      console.error('Error saving settings:', err)
      showError(ERROR_MESSAGES.SERVER)
    } finally {
      setSaving(false)
    }
  }

  async function handleExceptionsToggle() {
    setSaving(true)

    try {
      const newValue = !allowLeaveExceptions
      await settingsService.updateSetting('allow_leave_exceptions', newValue.toString())
      
      setAllowLeaveExceptions(newValue)
      success(SUCCESS_MESSAGES.SAVE)
    } catch (err) {
      console.error('Error saving settings:', err)
      showError(ERROR_MESSAGES.SERVER)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">WFM Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Auto-Approve Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Auto-Approve Requests</h3>
            <p className="text-sm text-gray-500">
              Automatically approve swap and leave requests when TL approves them
            </p>
          </div>
          <button
            onClick={handleAutoApproveToggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              autoApprove ? 'bg-indigo-600' : 'bg-gray-200'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                autoApprove ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Allow Leave Exceptions Toggle */}
        <div className="flex items-center justify-between border-t pt-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Allow Leave Exceptions</h3>
            <p className="text-sm text-gray-500">
              Allow users to request exceptions for denied leave requests (insufficient balance)
            </p>
          </div>
          <button
            onClick={handleExceptionsToggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              allowLeaveExceptions ? 'bg-indigo-600' : 'bg-gray-200'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                allowLeaveExceptions ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="text-xs text-gray-400 mt-4 border-t pt-4">
          <p>Note: Changes take effect immediately for all new requests.</p>
        </div>
      </div>
    </div>
  )
}
