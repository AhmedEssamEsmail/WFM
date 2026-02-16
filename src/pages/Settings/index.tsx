import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { settingsService } from '../../services'
import { ROUTES } from '../../constants'
import { handleDatabaseError } from '../../lib/errorHandler'
import GeneralSettings from './GeneralSettings'
import LeaveTypeManager from './LeaveTypeManager'
import BreakScheduleSettings from './BreakScheduleSettings'
import ShiftConfigSettings from './ShiftConfigSettings'
import SkillsManager from './SkillsManager'

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'general' | 'leave-types' | 'break-schedule' | 'shift-configurations' | 'skills'>('general')
  const [autoApprove, setAutoApprove] = useState(false)
  const [allowLeaveExceptions, setAllowLeaveExceptions] = useState(true)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">WFM Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`${
              activeTab === 'general'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('leave-types')}
            className={`${
              activeTab === 'leave-types'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Leave Types
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`${
              activeTab === 'skills'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Skills
          </button>
          <button
            onClick={() => setActiveTab('break-schedule')}
            className={`${
              activeTab === 'break-schedule'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Break Schedule
          </button>
          <button
            onClick={() => setActiveTab('shift-configurations')}
            className={`${
              activeTab === 'shift-configurations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Shift Configurations
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <GeneralSettings
          autoApprove={autoApprove}
          allowLeaveExceptions={allowLeaveExceptions}
          onAutoApproveChange={setAutoApprove}
          onAllowLeaveExceptionsChange={setAllowLeaveExceptions}
        />
      )}

      {activeTab === 'leave-types' && <LeaveTypeManager />}

      {activeTab === 'skills' && <SkillsManager />}

      {activeTab === 'break-schedule' && <BreakScheduleSettings />}

      {activeTab === 'shift-configurations' && <ShiftConfigSettings />}
    </div>
  )
}
