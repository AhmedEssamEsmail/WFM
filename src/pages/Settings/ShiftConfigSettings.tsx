import { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { shiftConfigurationsService } from '../../services'
import type { ShiftConfiguration } from '../../types'
import { handleDatabaseError } from '../../lib/errorHandler'
import ShiftConfigurations from '../../components/ShiftConfigurations'

export default function ShiftConfigSettings() {
  const { success, error: showError } = useToast()
  const [shiftConfigurations, setShiftConfigurations] = useState<ShiftConfiguration[]>([])
  const [loadingShiftConfigurations, setLoadingShiftConfigurations] = useState(false)

  useEffect(() => {
    fetchShiftConfigurations()
  }, [])

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

  return (
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
  )
}
