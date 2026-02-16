import { useState } from 'react'
import { ShiftConfiguration } from '../types'
import { BUTTON_STYLES, INPUT_STYLES } from '../lib/designSystem'

interface ShiftConfigurationsProps {
  shifts: ShiftConfiguration[]
  onUpdateShift: (shiftId: string, updates: Partial<ShiftConfiguration>) => Promise<void>
  onToggleShift: (shiftId: string, isActive: boolean) => Promise<void>
  onCreateShift: (shift: Omit<ShiftConfiguration, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onDeleteShift: (shiftId: string) => Promise<void>
}

export default function ShiftConfigurations({
  shifts,
  onUpdateShift,
  onToggleShift,
  onCreateShift,
  onDeleteShift,
}: ShiftConfigurationsProps) {
  const [editingShift, setEditingShift] = useState<string | null>(null)
  const [editedShift, setEditedShift] = useState<Partial<ShiftConfiguration>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newShift, setNewShift] = useState({
    shift_code: '',
    shift_label: '',
    start_time: '09:00:00',
    end_time: '17:00:00',
    description: '',
    display_order: shifts.length + 1,
    is_active: true,
  })

  const handleEdit = (shift: ShiftConfiguration) => {
    setEditingShift(shift.id)
    setEditedShift({
      shift_label: shift.shift_label,
      start_time: shift.start_time,
      end_time: shift.end_time,
      description: shift.description,
      display_order: shift.display_order,
    })
  }

  const handleSave = async (shiftId: string) => {
    setIsSaving(true)
    try {
      await onUpdateShift(shiftId, editedShift)
      setEditingShift(null)
      setEditedShift({})
    } catch (error) {
      console.error('Failed to update shift:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingShift(null)
    setEditedShift({})
  }

  const handleToggle = async (shiftId: string, currentStatus: boolean) => {
    try {
      await onToggleShift(shiftId, !currentStatus)
    } catch (error) {
      console.error('Failed to toggle shift:', error)
    }
  }

  const handleCreate = async () => {
    if (!newShift.shift_code || !newShift.shift_label) {
      alert('Please fill in shift code and label')
      return
    }

    setIsSaving(true)
    try {
      await onCreateShift(newShift)
      setShowAddForm(false)
      setNewShift({
        shift_code: '',
        shift_label: '',
        start_time: '09:00:00',
        end_time: '17:00:00',
        description: '',
        display_order: shifts.length + 1,
        is_active: true,
      })
    } catch (error) {
      console.error('Failed to create shift:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (shiftId: string, shiftCode: string) => {
    if (!confirm(`Are you sure you want to delete the ${shiftCode} shift? This cannot be undone.`)) {
      return
    }

    try {
      await onDeleteShift(shiftId)
    } catch (error) {
      console.error('Failed to delete shift:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Shift Configurations</h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure shift times for break schedule management
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className={`${BUTTON_STYLES.primary} text-sm`}
        >
          Add Shift
        </button>
      </div>

      {/* Add new shift form */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Shift</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Shift Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newShift.shift_code}
                  onChange={(e) => setNewShift({ ...newShift, shift_code: e.target.value.toUpperCase() })}
                  className={`${INPUT_STYLES.default} text-sm`}
                  placeholder="e.g., NIGHT"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">Unique code (uppercase)</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Shift Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newShift.shift_label}
                  onChange={(e) => setNewShift({ ...newShift, shift_label: e.target.value })}
                  className={`${INPUT_STYLES.default} text-sm`}
                  placeholder="e.g., Night Shift"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  step="900"
                  value={newShift.start_time.substring(0, 5)}
                  onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value + ':00' })}
                  className={`${INPUT_STYLES.default} text-sm`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  step="900"
                  value={newShift.end_time.substring(0, 5)}
                  onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value + ':00' })}
                  className={`${INPUT_STYLES.default} text-sm`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={newShift.display_order}
                  onChange={(e) => setNewShift({ ...newShift, display_order: parseInt(e.target.value) || 0 })}
                  className={`${INPUT_STYLES.default} text-sm`}
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newShift.description}
                onChange={(e) => setNewShift({ ...newShift, description: e.target.value })}
                className={`${INPUT_STYLES.default} text-sm`}
                placeholder="Optional description"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={isSaving}
                className={`${BUTTON_STYLES.primary} text-sm`}
              >
                Create Shift
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                disabled={isSaving}
                className={`${BUTTON_STYLES.secondary} text-sm`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shifts list */}
      <div className="space-y-3">
        {shifts.map((shift) => {
          const isEditing = editingShift === shift.id
          const displayShift = isEditing ? { ...shift, ...editedShift } : shift

          return (
            <div
              key={shift.id}
              className={`bg-white border rounded-lg p-4 ${
                shift.is_active ? 'border-green-300' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800">
                      {shift.shift_code}
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayShift.shift_label}
                        onChange={(e) => setEditedShift({ ...editedShift, shift_label: e.target.value })}
                        className={`${INPUT_STYLES.default} text-sm max-w-[200px]`}
                      />
                    ) : (
                      <h4 className="text-sm font-medium text-gray-900">{shift.shift_label}</h4>
                    )}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        shift.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {shift.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Start:</span>
                        {isEditing ? (
                          <input
                            type="time"
                            step="900"
                            value={displayShift.start_time?.substring(0, 5)}
                            onChange={(e) => setEditedShift({ ...editedShift, start_time: e.target.value + ':00' })}
                            className={`${INPUT_STYLES.default} text-xs max-w-[100px]`}
                          />
                        ) : (
                          <span className="font-medium text-gray-900">
                            {shift.start_time.substring(0, 5)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">End:</span>
                        {isEditing ? (
                          <input
                            type="time"
                            step="900"
                            value={displayShift.end_time?.substring(0, 5)}
                            onChange={(e) => setEditedShift({ ...editedShift, end_time: e.target.value + ':00' })}
                            className={`${INPUT_STYLES.default} text-xs max-w-[100px]`}
                          />
                        ) : (
                          <span className="font-medium text-gray-900">
                            {shift.end_time.substring(0, 5)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Order:</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={displayShift.display_order}
                            onChange={(e) => setEditedShift({ ...editedShift, display_order: parseInt(e.target.value) || 0 })}
                            className={`${INPUT_STYLES.default} text-xs max-w-[60px]`}
                            min="0"
                          />
                        ) : (
                          <span className="font-medium text-gray-900">{shift.display_order}</span>
                        )}
                      </div>
                    </div>
                    {shift.description && (
                      <p className="text-xs text-gray-600">{shift.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSave(shift.id)}
                        disabled={isSaving}
                        className={`${BUTTON_STYLES.primary} text-xs px-3 py-1`}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className={`${BUTTON_STYLES.secondary} text-xs px-3 py-1`}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(shift)}
                        className={`${BUTTON_STYLES.secondary} text-xs px-3 py-1`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggle(shift.id, shift.is_active)}
                        className={`${
                          shift.is_active ? BUTTON_STYLES.warning : BUTTON_STYLES.success
                        } text-xs px-3 py-1`}
                      >
                        {shift.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      {shift.shift_code !== 'OFF' && (
                        <button
                          onClick={() => handleDelete(shift.id, shift.shift_code)}
                          className={`${BUTTON_STYLES.danger} text-xs px-3 py-1`}
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
