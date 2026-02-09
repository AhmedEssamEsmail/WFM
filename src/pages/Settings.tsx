import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../lib/ToastContext'
import { settingsService, authService } from '../services'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants'
import { handleDatabaseError } from '../lib/errorHandler'

export default function Settings() {
  const navigate = useNavigate()
  const { user, supabaseUser } = useAuth()
  const { success, error: showError } = useToast()
  const [autoApprove, setAutoApprove] = useState(false)
  const [allowLeaveExceptions, setAllowLeaveExceptions] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [identities, setIdentities] = useState<any[]>([])
  const [loadingIdentities, setLoadingIdentities] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchIdentities()
  }, [user, navigate])

  async function fetchSettings() {
    // Only fetch WFM settings if user is WFM
    if (user?.role !== 'wfm') {
      setLoading(false)
      return
    }

    try {
      // Use service to fetch settings
      const autoApproveValue = await settingsService.getAutoApproveSetting()
      const exceptionsValue = await settingsService.getAllowLeaveExceptionsSetting()
      
      setAutoApprove(autoApproveValue)
      setAllowLeaveExceptions(exceptionsValue)
    } catch (err) {
      handleDatabaseError(err, 'fetch settings')
    } finally {
      setLoading(false)
    }
  }

  async function fetchIdentities() {
    if (!supabaseUser) return
    
    setLoadingIdentities(true)
    try {
      const { identities: userIdentities } = await authService.getUserIdentities()
      setIdentities(userIdentities || [])
    } catch (err) {
      console.error('Error fetching identities:', err)
    } finally {
      setLoadingIdentities(false)
    }
  }

  async function handleLinkGoogle() {
    setSaving(true)
    try {
      await authService.linkGoogleIdentity()
      // OAuth will redirect, so no need to handle response here
    } catch (err: any) {
      console.error('Error linking Google:', err)
      showError(err.message || 'Failed to link Google account')
      setSaving(false)
    }
  }

  async function handleUnlinkGoogle() {
    const googleIdentity = identities.find(id => id.provider === 'google')
    if (!googleIdentity) return

    if (identities.length <= 1) {
      showError('Cannot unlink your only sign-in method')
      return
    }

    if (!confirm('Are you sure you want to unlink your Google account?')) return

    setSaving(true)
    try {
      await authService.unlinkIdentity(googleIdentity)
      success('Google account unlinked successfully')
      await fetchIdentities()
    } catch (err: any) {
      console.error('Error unlinking Google:', err)
      showError(err.message || 'Failed to unlink Google account')
    } finally {
      setSaving(false)
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Account Linking Section - Available to all users */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Account Linking</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Google Account</h3>
            <p className="text-sm text-gray-500">
              {identities.some(id => id.provider === 'google')
                ? 'Your Google account is linked. You can sign in with Google.'
                : 'Link your Google account to sign in with Google'}
            </p>
          </div>
          <div>
            {loadingIdentities ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : identities.some(id => id.provider === 'google') ? (
              <button
                onClick={handleUnlinkGoogle}
                disabled={saving || identities.length <= 1}
                className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Unlinking...' : 'Unlink Google'}
              </button>
            ) : (
              <button
                onClick={handleLinkGoogle}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {saving ? 'Linking...' : 'Link Google'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* WFM Settings - Only for WFM users */}
      {user?.role === 'wfm' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">WFM Settings</h2>

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
      )}
    </div>
  )
}
