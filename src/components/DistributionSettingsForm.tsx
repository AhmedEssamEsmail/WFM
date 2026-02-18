import { useState, useEffect } from 'react'
import { useDistributionSettings } from '../hooks/useDistributionSettings'
import { BUTTON_STYLES } from '../lib/designSystem'
import type { DistributionSettingsUpdate, ShiftType } from '../types'

export default function DistributionSettingsForm() {
  const { settings, isLoading, updateSettings, resetToDefaults } = useDistributionSettings()
  
  const [formData, setFormData] = useState<Partial<Record<ShiftType, DistributionSettingsUpdate>>>({
    AM: { shift_type: 'AM', hb1_start_column: 4, b_offset_minutes: 150, hb2_offset_minutes: 150, ladder_increment: 1 },
    PM: { shift_type: 'PM', hb1_start_column: 16, b_offset_minutes: 150, hb2_offset_minutes: 150, ladder_increment: 1 },
    BET: { shift_type: 'BET', hb1_start_column: 8, b_offset_minutes: 150, hb2_offset_minutes: 150, ladder_increment: 1 },
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load settings into form only once on initial mount
  useEffect(() => {
    if (settings && settings.length > 0 && !isInitialized) {
      const newFormData: Partial<Record<ShiftType, DistributionSettingsUpdate>> = {
        AM: { shift_type: 'AM', hb1_start_column: 4, b_offset_minutes: 150, hb2_offset_minutes: 150, ladder_increment: 1 },
        PM: { shift_type: 'PM', hb1_start_column: 16, b_offset_minutes: 150, hb2_offset_minutes: 150, ladder_increment: 1 },
        BET: { shift_type: 'BET', hb1_start_column: 8, b_offset_minutes: 150, hb2_offset_minutes: 150, ladder_increment: 1 },
      }
      
      for (const setting of settings) {
        newFormData[setting.shift_type] = {
          shift_type: setting.shift_type,
          hb1_start_column: setting.hb1_start_column,
          b_offset_minutes: setting.b_offset_minutes,
          hb2_offset_minutes: setting.hb2_offset_minutes,
          ladder_increment: setting.ladder_increment,
        }
      }
      
      setFormData(newFormData)
      setIsInitialized(true)
    }
  }, [settings, isInitialized])

  // Convert column to time string for display
  const columnToTime = (column: number): string => {
    const baseMinutes = 9 * 60 // 9:00 AM
    const totalMinutes = baseMinutes + (column * 15)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    for (const shiftType of ['AM', 'PM', 'BET'] as ShiftType[]) {
      const data = formData[shiftType]
      
      if (!data) continue
      
      if (data.hb1_start_column < 0 || data.hb1_start_column >= 48) {
        newErrors[`${shiftType}_column`] = 'Start column must be between 0 and 47'
      }
      
      if (data.b_offset_minutes < 90) {
        newErrors[`${shiftType}_b_offset`] = 'B offset must be at least 90 minutes'
      }
      
      if (data.hb2_offset_minutes < 90) {
        newErrors[`${shiftType}_hb2_offset`] = 'HB2 offset must be at least 90 minutes'
      }
      
      if (data.ladder_increment < 1 || data.ladder_increment > 20) {
        newErrors[`${shiftType}_ladder_increment`] = 'Ladder increment must be between 1 and 20'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleColumnChange = (shiftType: ShiftType, value: string) => {
    const column = parseInt(value, 10)
    if (!isNaN(column)) {
      setFormData(prev => ({
        ...prev,
        [shiftType]: { ...prev[shiftType], hb1_start_column: column }
      }))
      setHasChanges(true)
    }
  }

  const handleOffsetChange = (shiftType: ShiftType, field: 'b_offset_minutes' | 'hb2_offset_minutes', value: string) => {
    const minutes = parseInt(value, 10)
    if (!isNaN(minutes)) {
      setFormData(prev => ({
        ...prev,
        [shiftType]: { ...prev[shiftType], [field]: minutes }
      }))
      setHasChanges(true)
    }
  }

  const handleSave = async () => {
    if (!validateForm()) return
    
    const updates = Object.values(formData).filter((data): data is DistributionSettingsUpdate => data !== undefined)
    await updateSettings.mutateAsync(updates)
    setHasChanges(false)
    // Don't reset isInitialized so the form doesn't reload after save
  }

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      await resetToDefaults.mutateAsync()
      setHasChanges(false)
      setIsInitialized(false) // Allow form to reload with default values
    }
  }

  if (isLoading) {
    return <div className="text-sm text-gray-600">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Ladder Distribution Settings
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure the starting times and intervals for the ladder distribution algorithm.
          Column 0 = 9:00 AM, each column = 15 minutes.
        </p>
      </div>

      {/* Settings for each shift type */}
      {(['AM', 'PM', 'BET'] as ShiftType[]).map((shiftType) => {
        const data = formData[shiftType]
        if (!data) return null
        
        return (
        <div key={shiftType} className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900">{shiftType} Shift</h4>
          
          {/* HB1 Start Column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HB1 Start Column (Time: {columnToTime(data.hb1_start_column)})
            </label>
            <input
              type="number"
              min="0"
              max="47"
              value={data.hb1_start_column}
              onChange={(e) => handleColumnChange(shiftType, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors[`${shiftType}_column`] && (
              <p className="mt-1 text-sm text-red-600">{errors[`${shiftType}_column`]}</p>
            )}
          </div>

          {/* B Offset */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time between HB1 and B (minutes)
            </label>
            <input
              type="number"
              min="90"
              step="15"
              value={data.b_offset_minutes}
              onChange={(e) => handleOffsetChange(shiftType, 'b_offset_minutes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors[`${shiftType}_b_offset`] && (
              <p className="mt-1 text-sm text-red-600">{errors[`${shiftType}_b_offset`]}</p>
            )}
          </div>

          {/* HB2 Offset */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time between B and HB2 (minutes)
            </label>
            <input
              type="number"
              min="90"
              step="15"
              value={data.hb2_offset_minutes}
              onChange={(e) => handleOffsetChange(shiftType, 'hb2_offset_minutes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors[`${shiftType}_hb2_offset`] && (
              <p className="mt-1 text-sm text-red-600">{errors[`${shiftType}_hb2_offset`]}</p>
            )}
          </div>

          {/* Ladder Increment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ladder Increment (intervals between agents)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={data.ladder_increment}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10)
                if (!isNaN(value)) {
                  setFormData(prev => ({
                    ...prev,
                    [shiftType]: { ...prev[shiftType], ladder_increment: value }
                  }))
                  setHasChanges(true)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Number of 15-minute intervals to skip between each agent (e.g., 1 = 15 min, 11 = 2h 45min)
            </p>
            {errors[`${shiftType}_ladder_increment`] && (
              <p className="mt-1 text-sm text-red-600">{errors[`${shiftType}_ladder_increment`]}</p>
            )}
          </div>
        </div>
      )}
      )}

      {/* Action buttons */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={handleReset}
          disabled={resetToDefaults.isPending}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          {resetToDefaults.isPending ? 'Resetting...' : 'Reset to Defaults'}
        </button>
        
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateSettings.isPending}
          className={BUTTON_STYLES.primary}
        >
          {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
