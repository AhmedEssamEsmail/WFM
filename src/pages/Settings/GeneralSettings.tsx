import { useState } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { settingsService } from '../../services'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../constants'

interface GeneralSettingsProps {
  autoApprove: boolean
  allowLeaveExceptions: boolean
  onAutoApproveChange: (value: boolean) => void
  onAllowLeaveExceptionsChange: (value: boolean) => void
}

export default function GeneralSettings({
  autoApprove,
  allowLeaveExceptions,
  onAutoApproveChange,
  onAllowLeaveExceptionsChange
}: GeneralSettingsProps) {
  const { success, error: showError } = useToast()
  const [saving, setSaving] = useState(false)

  async function handleAutoApproveToggle() {
    setSaving(true)
    try {
      const newValue = !autoApprove
      await settingsService.updateSetting('wfm_auto_approve', newValue.toString())
      onAutoApproveChange(newValue)
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
      onAllowLeaveExceptionsChange(newValue)
      success(SUCCESS_MESSAGES.SAVE)
    } catch (err) {
      console.error('Error saving settings:', err)
      showError(ERROR_MESSAGES.SERVER)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
      {/* Auto-Approve Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">Auto-Approve Requests</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Automatically approve swap and leave requests when TL approves them
          </p>
        </div>
        <button
          onClick={handleAutoApproveToggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            autoApprove ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ring-0 transition duration-200 ease-in-out ${
              autoApprove ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Allow Leave Exceptions Toggle */}
      <div className="flex items-center justify-between border-t pt-6">
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">Allow Leave Exceptions</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Allow users to request exceptions for denied leave requests (insufficient balance)
          </p>
        </div>
        <button
          onClick={handleExceptionsToggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            allowLeaveExceptions ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ring-0 transition duration-200 ease-in-out ${
              allowLeaveExceptions ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="text-xs text-slate-400 dark:text-slate-500 mt-4 border-t pt-4">
        <p>Note: Changes take effect immediately for all new requests.</p>
      </div>
    </div>
  )
}



