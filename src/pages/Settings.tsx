import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../lib/ToastContext'
import { settingsService, leaveTypesService, breakRulesService, shiftConfigurationsService } from '../services'
import type { LeaveTypeConfig, LeaveType, DistributionStrategy, ApplyMode, BreakScheduleRule, ShiftConfiguration } from '../types'
import { ROUTES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants'
import { handleDatabaseError } from '../lib/errorHandler'
import AutoDistributionSettings from '../components/Settings/AutoDistributionSettings'
import RulesConfig from '../components/BreakSchedule/RulesConfig'
import ShiftConfigurations from '../components/Settings/ShiftConfigurations'

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [autoApprove, setAutoApprove] = useState(false)
  const [allowLeaveExceptions, setAllowLeaveExceptions] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Leave types state
  const [activeTab, setActiveTab] = useState<'general' | 'leave-types' | 'break-schedule'>('general')
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([])
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(false)
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveTypeConfig | null>(null)
  const [newLeaveType, setNewLeaveType] = useState({ code: '', label: '', description: '', color: '#E5E7EB', display_order: 0, is_active: true })
  const [showAddLeaveType, setShowAddLeaveType] = useState(false)

  // Break schedule settings state
  const [defaultStrategy, setDefaultStrategy] = useState<DistributionStrategy>('balanced_coverage')
  const [defaultApplyMode, setDefaultApplyMode] = useState<ApplyMode>('only_unscheduled')
  const [breakRules, setBreakRules] = useState<BreakScheduleRule[]>([])
  const [loadingBreakRules, setLoadingBreakRules] = useState(false)
  const [shiftConfigurations, setShiftConfigurations] = useState<ShiftConfiguration[]>([])
  const [loadingShiftConfigurations, setLoadingShiftConfigurations] = useState(false)

  const fetchLeaveTypes = useCallback(async () => {
    setLoadingLeaveTypes(true)
    try {
      const data = await leaveTypesService.getAllLeaveTypes()
      setLeaveTypes(data)
    } catch (error) {
      handleDatabaseError(error, 'fetch leave types')
      showError('Failed to load leave types')
    } finally {
      setLoadingLeaveTypes(false)
    }
  }, [showError])

  useEffect(() => {
    // Redirect if not WFM
    if (user && user.role !== 'wfm') {
      navigate(ROUTES.DASHBOARD)
      return
    }
    fetchSettings()
  }, [user, navigate])

  useEffect(() => {
    if (activeTab === 'leave-types') {
      fetchLeaveTypes()
    } else if (activeTab === 'break-schedule') {
      fetchBreakRules()
      fetchShiftConfigurations()
    }
  }, [activeTab, fetchLeaveTypes])

  async function fetchBreakRules() {
    setLoadingBreakRules(true)
    try {
      const data = await breakRulesService.getRules()
      setBreakRules(data)
    } catch (error) {
      handleDatabaseError(error, 'fetch break rules')
      showError('Failed to load break rules')
    } finally {
      setLoadingBreakRules(false)
    }
  }

  async function fetchShiftConfigurations() {
    setLoadingShiftConfigurations(true)
    try {
      const data = await shiftConfigurationsService.getAllShiftConfigurations()
      setShiftConfigurations(data)
    } catch (error) {
      handleDatabaseError(error, 'fetch shift configurations')
      showError('Failed to load shift configurations')
    } finally {
      setLoadingShiftConfigurations(false)
    }
  }

  async function fetchSettings() {
    try {
      // Use service to fetch settings
      const autoApproveValue = await settingsService.getAutoApproveSetting()
      const exceptionsValue = await settingsService.getAllowLeaveExceptionsSetting()
      
      setAutoApprove(autoApproveValue)
      setAllowLeaveExceptions(exceptionsValue)

      // Fetch break schedule settings
      const strategyValue = await settingsService.getSetting('break_distribution_strategy')
      const applyModeValue = await settingsService.getSetting('break_apply_mode')
      
      if (strategyValue) setDefaultStrategy(strategyValue as DistributionStrategy)
      if (applyModeValue) setDefaultApplyMode(applyModeValue as ApplyMode)
    } catch (err) {
      handleDatabaseError(err, 'fetch settings')
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

  async function saveLeaveType() {
    if (!editingLeaveType) return

    try {
      await leaveTypesService.updateLeaveType(editingLeaveType.id, {
        label: editingLeaveType.label,
        description: editingLeaveType.description,
        color: editingLeaveType.color,
        display_order: editingLeaveType.display_order,
        is_active: editingLeaveType.is_active
      })

      await fetchLeaveTypes()
      setEditingLeaveType(null)
      success('Leave type updated successfully')
    } catch (error) {
      handleDatabaseError(error, 'update leave type')
      showError('Failed to update leave type')
    }
  }

  async function addLeaveType() {
    if (!newLeaveType.label || !newLeaveType.code) {
      showError('Please fill in code and label')
      return
    }

    try {
      await leaveTypesService.createLeaveType({
        code: newLeaveType.code as LeaveType,
        label: newLeaveType.label,
        description: newLeaveType.description,
        color: newLeaveType.color,
        display_order: newLeaveType.display_order || leaveTypes.length,
        is_active: newLeaveType.is_active
      })

      await fetchLeaveTypes()
      setNewLeaveType({ code: '', label: '', description: '', color: '#E5E7EB', display_order: 0, is_active: true })
      setShowAddLeaveType(false)
      success('Leave type added successfully')
    } catch (error) {
      handleDatabaseError(error, 'add leave type')
      showError('Failed to add leave type')
    }
  }

  async function deleteLeaveType(id: string) {
    if (!confirm('Are you sure you want to deactivate this leave type?')) return

    try {
      await leaveTypesService.deactivateLeaveType(id)
      await fetchLeaveTypes()
      success('Leave type deactivated successfully')
    } catch (error) {
      handleDatabaseError(error, 'deactivate leave type')
      showError('Failed to deactivate leave type')
    }
  }

  async function handleSaveBreakScheduleSettings(strategy: DistributionStrategy, applyMode: ApplyMode) {
    try {
      await settingsService.updateSetting('break_distribution_strategy', strategy)
      await settingsService.updateSetting('break_apply_mode', applyMode)
      
      setDefaultStrategy(strategy)
      setDefaultApplyMode(applyMode)
      success('Break schedule settings saved successfully')
    } catch (error) {
      handleDatabaseError(error, 'save break schedule settings')
      showError('Failed to save break schedule settings')
    }
  }

  async function handleUpdateRule(ruleId: string, updates: Partial<BreakScheduleRule>) {
    try {
      await breakRulesService.updateRule(ruleId, updates)
      await fetchBreakRules()
      success('Rule updated successfully')
    } catch (error) {
      handleDatabaseError(error, 'update break rule')
      showError('Failed to update rule')
    }
  }

  async function handleToggleRule(ruleId: string, isActive: boolean) {
    try {
      await breakRulesService.toggleRule(ruleId, isActive)
      await fetchBreakRules()
      success(`Rule ${isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      handleDatabaseError(error, 'toggle break rule')
      showError('Failed to toggle rule')
    }
  }

  async function handleUpdateShift(shiftId: string, updates: Partial<ShiftConfiguration>) {
    try {
      await shiftConfigurationsService.updateShiftConfiguration(shiftId, updates)
      await fetchShiftConfigurations()
      success('Shift updated successfully')
    } catch (error) {
      handleDatabaseError(error, 'update shift configuration')
      showError('Failed to update shift')
    }
  }

  async function handleToggleShift(shiftId: string, isActive: boolean) {
    try {
      await shiftConfigurationsService.toggleShiftActive(shiftId, isActive)
      await fetchShiftConfigurations()
      success(`Shift ${isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      handleDatabaseError(error, 'toggle shift')
      showError('Failed to toggle shift')
    }
  }

  async function handleCreateShift(shift: Omit<ShiftConfiguration, 'id' | 'created_at' | 'updated_at'>) {
    try {
      await shiftConfigurationsService.createShiftConfiguration(shift)
      await fetchShiftConfigurations()
      success('Shift created successfully')
    } catch (error) {
      handleDatabaseError(error, 'create shift')
      showError('Failed to create shift')
    }
  }

  async function handleDeleteShift(shiftId: string) {
    try {
      await shiftConfigurationsService.deleteShiftConfiguration(shiftId)
      await fetchShiftConfigurations()
      success('Shift deleted successfully')
    } catch (error) {
      handleDatabaseError(error, 'delete shift')
      showError('Failed to delete shift')
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
    <div className="max-w-4xl mx-auto p-6">
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
            onClick={() => setActiveTab('break-schedule')}
            className={`${
              activeTab === 'break-schedule'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Break Schedule
          </button>
        </nav>
      </div>

      {activeTab === 'general' && (
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
      )}

      {activeTab === 'leave-types' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Leave Types</h3>
              <p className="mt-1 text-sm text-gray-500">Manage available leave types for the organization</p>
            </div>
            <button
              onClick={() => setShowAddLeaveType(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Add Leave Type
            </button>
          </div>

          {loadingLeaveTypes ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {leaveTypes.map(lt => (
                <li key={lt.id} className="px-4 py-4 sm:px-6">
                  {editingLeaveType?.id === lt.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Code (enum)</label>
                          <input
                            type="text"
                            value={editingLeaveType.code}
                            disabled
                            className="w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                          <input
                            type="text"
                            value={editingLeaveType.label}
                            onChange={e => setEditingLeaveType({ ...editingLeaveType, label: e.target.value })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                            placeholder="e.g., Sick Leave"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={editingLeaveType.description || ''}
                          onChange={e => setEditingLeaveType({ ...editingLeaveType, description: e.target.value })}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                          placeholder="Full description"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Color (hex)</label>
                          <input
                            type="text"
                            value={editingLeaveType.color}
                            onChange={e => setEditingLeaveType({ ...editingLeaveType, color: e.target.value })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm font-mono"
                            placeholder="#E5E7EB"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Display Order</label>
                          <input
                            type="number"
                            value={editingLeaveType.display_order}
                            onChange={e => setEditingLeaveType({ ...editingLeaveType, display_order: parseInt(e.target.value) })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                          <label className="flex items-center mt-2">
                            <input
                              type="checkbox"
                              checked={editingLeaveType.is_active}
                              onChange={e => setEditingLeaveType({ ...editingLeaveType, is_active: e.target.checked })}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-600">Active</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={saveLeaveType}
                          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingLeaveType(null)}
                          className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded border border-gray-300" 
                            style={{ backgroundColor: lt.color }}
                            title={lt.color}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{lt.label}</p>
                            <p className="text-xs text-gray-500">
                              Code: <span className="font-mono">{lt.code}</span>
                              {lt.description && ` • ${lt.description}`}
                              {' • Order: '}{lt.display_order}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lt.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {lt.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => setEditingLeaveType(lt)}
                          className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                        {lt.is_active && (
                          <button
                            onClick={() => deleteLeaveType(lt.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {leaveTypes.length === 0 && (
                <li className="px-4 py-8 text-center text-gray-500">
                  No leave types configured. Add one to get started.
                </li>
              )}
            </ul>
          )}

          {/* Add new leave type form */}
          {showAddLeaveType && (
            <div className="px-4 py-4 sm:px-6 border-t bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Leave Type</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Code (enum value)</label>
                    <input
                      type="text"
                      value={newLeaveType.code}
                      onChange={e => setNewLeaveType({ ...newLeaveType, code: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm font-mono"
                      placeholder="e.g., maternity"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must match database enum value</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                    <input
                      type="text"
                      value={newLeaveType.label}
                      onChange={e => setNewLeaveType({ ...newLeaveType, label: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                      placeholder="e.g., Maternity Leave"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={newLeaveType.description}
                    onChange={e => setNewLeaveType({ ...newLeaveType, description: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    placeholder="Full description"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Color (hex)</label>
                    <input
                      type="text"
                      value={newLeaveType.color}
                      onChange={e => setNewLeaveType({ ...newLeaveType, color: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm font-mono"
                      placeholder="#E5E7EB"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={newLeaveType.display_order}
                      onChange={e => setNewLeaveType({ ...newLeaveType, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <label className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        checked={newLeaveType.is_active}
                        onChange={e => setNewLeaveType({ ...newLeaveType, is_active: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Active</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={addLeaveType}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                  >
                    Add Leave Type
                  </button>
                  <button
                    onClick={() => {
                      setShowAddLeaveType(false)
                      setNewLeaveType({ code: '', label: '', description: '', color: '#E5E7EB', display_order: 0, is_active: true })
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'break-schedule' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <AutoDistributionSettings
              defaultStrategy={defaultStrategy}
              defaultApplyMode={defaultApplyMode}
              onSave={handleSaveBreakScheduleSettings}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            {loadingShiftConfigurations ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <ShiftConfigurations
                shifts={shiftConfigurations}
                onUpdateShift={handleUpdateShift}
                onToggleShift={handleToggleShift}
                onCreateShift={handleCreateShift}
                onDeleteShift={handleDeleteShift}
              />
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            {loadingBreakRules ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <RulesConfig
                rules={breakRules}
                onUpdateRule={handleUpdateRule}
                onToggleRule={handleToggleRule}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
