import { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { useOvertimeSettings, useUpdateOvertimeSetting } from '../../hooks/useOvertimeSettings'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../constants'

export default function OvertimeSettings() {
  const { success, error: showError } = useToast()
  const { data: settings, isLoading } = useOvertimeSettings()
  const updateSetting = useUpdateOvertimeSetting()

  // Local state for form inputs
  const [autoApprove, setAutoApprove] = useState(false)
  const [dailyLimitRegular, setDailyLimitRegular] = useState('4')
  const [dailyLimitDouble, setDailyLimitDouble] = useState('4')
  const [weeklyLimitRegular, setWeeklyLimitRegular] = useState('12')
  const [weeklyLimitDouble, setWeeklyLimitDouble] = useState('12')
  const [shiftVerification, setShiftVerification] = useState(true)
  const [submissionDeadline, setSubmissionDeadline] = useState('7')
  const [payMultiplierRegular, setPayMultiplierRegular] = useState('1.5')
  const [payMultiplierDouble, setPayMultiplierDouble] = useState('2.0')

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Sync settings to local state
  useEffect(() => {
    if (settings) {
      setAutoApprove(settings.auto_approve.enabled)
      setDailyLimitRegular(settings.max_daily_hours.regular.toString())
      setDailyLimitDouble(settings.max_daily_hours.double.toString())
      setWeeklyLimitRegular(settings.max_weekly_hours.regular.toString())
      setWeeklyLimitDouble(settings.max_weekly_hours.double.toString())
      setShiftVerification(settings.require_shift_verification.enabled)
      setSubmissionDeadline(settings.approval_deadline_days.days.toString())
      setPayMultiplierRegular(settings.pay_multipliers.regular.toString())
      setPayMultiplierDouble(settings.pay_multipliers.double.toString())
    }
  }, [settings])

  function validatePositiveNumber(value: string, fieldName: string): boolean {
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      setErrors(prev => ({ ...prev, [fieldName]: 'Must be a positive number' }))
      return false
    }
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
    return true
  }

  async function handleAutoApproveToggle() {
    try {
      await updateSetting.mutateAsync({
        key: 'auto_approve',
        value: { enabled: !autoApprove }
      })
      setAutoApprove(!autoApprove)
      success(SUCCESS_MESSAGES.SAVE)
    } catch (err) {
      console.error('Error saving setting:', err)
      showError(ERROR_MESSAGES.SERVER)
    }
  }

  async function handleShiftVerificationToggle() {
    try {
      await updateSetting.mutateAsync({
        key: 'require_shift_verification',
        value: { enabled: !shiftVerification }
      })
      setShiftVerification(!shiftVerification)
      success(SUCCESS_MESSAGES.SAVE)
    } catch (err) {
      console.error('Error saving setting:', err)
      showError(ERROR_MESSAGES.SERVER)
    }
  }

  async function handleNumberUpdate(key: string, value: string, setter: (v: string) => void) {
    if (!validatePositiveNumber(value, key)) {
      return
    }

    try {
      const numValue = parseFloat(value)
      
      // Map the key to the correct setting structure
      if (key === 'daily_limit_regular' || key === 'daily_limit_double') {
        const currentSettings = settings?.max_daily_hours || { regular: 4, double: 4 }
        await updateSetting.mutateAsync({
          key: 'max_daily_hours',
          value: {
            regular: key === 'daily_limit_regular' ? numValue : currentSettings.regular,
            double: key === 'daily_limit_double' ? numValue : currentSettings.double,
          }
        })
      } else if (key === 'weekly_limit_regular' || key === 'weekly_limit_double') {
        const currentSettings = settings?.max_weekly_hours || { regular: 12, double: 12 }
        await updateSetting.mutateAsync({
          key: 'max_weekly_hours',
          value: {
            regular: key === 'weekly_limit_regular' ? numValue : currentSettings.regular,
            double: key === 'weekly_limit_double' ? numValue : currentSettings.double,
          }
        })
      } else if (key === 'pay_multiplier_regular' || key === 'pay_multiplier_double') {
        const currentSettings = settings?.pay_multipliers || { regular: 1.5, double: 2.0 }
        await updateSetting.mutateAsync({
          key: 'pay_multipliers',
          value: {
            regular: key === 'pay_multiplier_regular' ? numValue : currentSettings.regular,
            double: key === 'pay_multiplier_double' ? numValue : currentSettings.double,
          }
        })
      } else if (key === 'submission_deadline') {
        await updateSetting.mutateAsync({
          key: 'approval_deadline_days',
          value: { days: numValue }
        })
      }
      
      setter(value)
      success(SUCCESS_MESSAGES.SAVE)
    } catch (err) {
      console.error('Error saving setting:', err)
      showError(ERROR_MESSAGES.SERVER)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-gray-600">Loading overtime settings...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Overtime Settings</h2>
        <p className="text-sm text-gray-500">
          Configure overtime request rules and approval settings
        </p>
      </div>

      {/* Auto-Approve Toggle */}
      <div className="flex items-center justify-between border-t pt-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Auto-Approve Overtime</h3>
          <p className="text-sm text-gray-500">
            Automatically approve overtime requests when TL approves them (skip WFM approval)
          </p>
        </div>
        <button
          onClick={handleAutoApproveToggle}
          disabled={updateSetting.isPending}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            autoApprove ? 'bg-indigo-600' : 'bg-gray-200'
          } ${updateSetting.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              autoApprove ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Daily Limits */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Limits (hours)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regular Overtime
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={dailyLimitRegular}
              onChange={(e) => setDailyLimitRegular(e.target.value)}
              onBlur={(e) => handleNumberUpdate('daily_limit_regular', e.target.value, setDailyLimitRegular)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.daily_limit_regular ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.daily_limit_regular && (
              <p className="text-sm text-red-600 mt-1">{errors.daily_limit_regular}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Double Overtime
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={dailyLimitDouble}
              onChange={(e) => setDailyLimitDouble(e.target.value)}
              onBlur={(e) => handleNumberUpdate('daily_limit_double', e.target.value, setDailyLimitDouble)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.daily_limit_double ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.daily_limit_double && (
              <p className="text-sm text-red-600 mt-1">{errors.daily_limit_double}</p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Limits */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Limits (hours)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regular Overtime
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={weeklyLimitRegular}
              onChange={(e) => setWeeklyLimitRegular(e.target.value)}
              onBlur={(e) => handleNumberUpdate('weekly_limit_regular', e.target.value, setWeeklyLimitRegular)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.weekly_limit_regular ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.weekly_limit_regular && (
              <p className="text-sm text-red-600 mt-1">{errors.weekly_limit_regular}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Double Overtime
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={weeklyLimitDouble}
              onChange={(e) => setWeeklyLimitDouble(e.target.value)}
              onBlur={(e) => handleNumberUpdate('weekly_limit_double', e.target.value, setWeeklyLimitDouble)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.weekly_limit_double ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.weekly_limit_double && (
              <p className="text-sm text-red-600 mt-1">{errors.weekly_limit_double}</p>
            )}
          </div>
        </div>
      </div>

      {/* Shift Verification Toggle */}
      <div className="flex items-center justify-between border-t pt-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Shift Verification</h3>
          <p className="text-sm text-gray-500">
            Require agents to have a scheduled shift on the overtime work date
          </p>
        </div>
        <button
          onClick={handleShiftVerificationToggle}
          disabled={updateSetting.isPending}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            shiftVerification ? 'bg-indigo-600' : 'bg-gray-200'
          } ${updateSetting.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              shiftVerification ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Submission Deadline */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Deadline</h3>
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Days after work date
          </label>
          <input
            type="number"
            min="1"
            value={submissionDeadline}
            onChange={(e) => setSubmissionDeadline(e.target.value)}
            onBlur={(e) => handleNumberUpdate('submission_deadline', e.target.value, setSubmissionDeadline)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.submission_deadline_days ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.submission_deadline_days && (
            <p className="text-sm text-red-600 mt-1">{errors.submission_deadline_days}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Agents must submit overtime requests within this many days after the work date
          </p>
        </div>
      </div>

      {/* Pay Multipliers */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pay Multipliers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regular Overtime
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              value={payMultiplierRegular}
              onChange={(e) => setPayMultiplierRegular(e.target.value)}
              onBlur={(e) => handleNumberUpdate('pay_multiplier_regular', e.target.value, setPayMultiplierRegular)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.pay_multiplier_regular ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.pay_multiplier_regular && (
              <p className="text-sm text-red-600 mt-1">{errors.pay_multiplier_regular}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">e.g., 1.5 = 150% of regular pay</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Double Overtime
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              value={payMultiplierDouble}
              onChange={(e) => setPayMultiplierDouble(e.target.value)}
              onBlur={(e) => handleNumberUpdate('pay_multiplier_double', e.target.value, setPayMultiplierDouble)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.pay_multiplier_double ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.pay_multiplier_double && (
              <p className="text-sm text-red-600 mt-1">{errors.pay_multiplier_double}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">e.g., 2.0 = 200% of regular pay</p>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 mt-4 border-t pt-4">
        <p>Note: Changes take effect immediately for all new overtime requests.</p>
      </div>
    </div>
  )
}
