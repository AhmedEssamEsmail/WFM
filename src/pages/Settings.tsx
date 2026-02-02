import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [autoApprove, setAutoApprove] = useState(false)
  const [allowLeaveExceptions, setAllowLeaveExceptions] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Redirect if not WFM
    if (user && user.role !== 'wfm') {
      navigate('/dashboard')
      return
    }
    fetchSettings()
  }, [user, navigate])

  async function fetchSettings() {
    try {
      // Fetch all settings at once
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['wfm_auto_approve', 'allow_leave_exceptions'])

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      // Set values from fetched data
      if (data) {
        const autoApproveData = data.find(d => d.key === 'wfm_auto_approve')
        const exceptionsData = data.find(d => d.key === 'allow_leave_exceptions')
        
        setAutoApprove(autoApproveData?.value === 'true')
        setAllowLeaveExceptions(exceptionsData?.value !== 'false') // Default to true
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAutoApproveToggle() {
    setSaving(true)
    setMessage('')

    try {
      const newValue = !autoApprove

      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'wfm_auto_approve',
          value: newValue.toString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })

      if (error) throw error

      setAutoApprove(newValue)
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleExceptionsToggle() {
    setSaving(true)
    setMessage('')

    try {
      const newValue = !allowLeaveExceptions

      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'allow_leave_exceptions',
          value: newValue.toString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })

      if (error) throw error

      setAllowLeaveExceptions(newValue)
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setMessage('Failed to save settings')
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

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

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
