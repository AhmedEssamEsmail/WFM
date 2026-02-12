import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { leaveTypesService } from '../../services'
import type { LeaveTypeConfig, LeaveType } from '../../types'
import { handleDatabaseError } from '../../lib/errorHandler'

export default function LeaveTypeManager() {
  const { success, error: showError } = useToast()
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([])
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(false)
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveTypeConfig | null>(null)
  const [newLeaveType, setNewLeaveType] = useState({ 
    code: '', 
    label: '', 
    description: '', 
    color: '#E5E7EB', 
    display_order: 0, 
    is_active: true 
  })
  const [showAddLeaveType, setShowAddLeaveType] = useState(false)

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
    fetchLeaveTypes()
  }, [fetchLeaveTypes])

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

  return (
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
  )
}
