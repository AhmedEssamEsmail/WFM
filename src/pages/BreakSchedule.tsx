import { useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useBreakSchedules } from '../hooks/useBreakSchedules'
import { formatDateISO } from '../utils'
import { useToast } from '../contexts/ToastContext'
import { QUERY_KEYS } from '../constants/cache'
import DateNavigation from '../components/BreakSchedule/DateNavigation'
import FilterBar from '../components/BreakSchedule/FilterBar'
import BreakScheduleTable from '../components/BreakSchedule/BreakScheduleTable'
import WarningPopup from '../components/BreakSchedule/WarningPopup'
import AutoDistributeModal from '../components/BreakSchedule/AutoDistributeModal'
import { exportToCSV, importFromCSV } from '../lib/breakScheduleCSV'
import type { BreakScheduleUpdateRequest, AutoDistributeRequest, AgentBreakSchedule } from '../types'

export default function BreakSchedule() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [showAutoDistribute, setShowAutoDistribute] = useState(false)
  const [selectedWarning, setSelectedWarning] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [failedAgentsMap, setFailedAgentsMap] = useState<Record<string, string>>({}) // Store failure reasons by user_id

  const dateStr = formatDateISO(currentDate)
  const {
    schedules,
    intervals,
    warnings,
    isLoading,
    updateBreakSchedules,
    dismissWarning,
    autoDistribute,
    clearAllBreaks,
    queryClient,
  } = useBreakSchedules(dateStr)

  const isWFM = user?.role === 'wfm'
  const isEditable = isWFM

  // Filter schedules based on search and department
  const filteredSchedules = schedules.filter((schedule: AgentBreakSchedule) => {
    const matchesSearch = schedule.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesDepartment =
      !selectedDepartment || schedule.department === selectedDepartment
    return matchesSearch && matchesDepartment
  })
  
  // Sort schedules by shift type (AM, BET, PM, OFF, null) then by name
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    // Define shift order priority
    const shiftOrder: Record<string, number> = {
      'AM': 1,
      'BET': 2,
      'PM': 3,
      'OFF': 4,
    }
    
    // Get shift priorities (null/undefined shifts go last)
    const aShiftPriority = a.shift_type ? (shiftOrder[a.shift_type] || 5) : 5
    const bShiftPriority = b.shift_type ? (shiftOrder[b.shift_type] || 5) : 5
    
    // First sort by shift type
    if (aShiftPriority !== bShiftPriority) {
      return aShiftPriority - bShiftPriority
    }
    
    // Then sort by name alphabetically
    return a.name.localeCompare(b.name)
  })
  
  // Merge failure reasons into schedules
  const schedulesWithFailures = sortedSchedules.map((schedule: AgentBreakSchedule) => ({
    ...schedule,
    auto_distribution_failure: failedAgentsMap[schedule.user_id] || undefined,
  }))

  // Get unique departments
  const departments = Array.from(new Set(schedules.map((s: AgentBreakSchedule) => s.department).filter(Boolean))) as string[]

  // Handle break schedule updates
  const handleUpdate = async (updates: BreakScheduleUpdateRequest[]) => {
    await updateBreakSchedules.mutateAsync(updates)
  }

  // Handle auto-distribute
  const handleAutoDistribute = async (request: Omit<AutoDistributeRequest, 'schedule_date'>, failedAgents: Array<{ user_id: string; name: string; reason: string; blockedBy?: string[] }>) => {
    const fullRequest = { ...request, schedule_date: dateStr }
    await autoDistribute.mutateAsync(fullRequest)
    
    // Store failed agents information
    const failuresMap: Record<string, string> = {}
    for (const agent of failedAgents) {
      failuresMap[agent.user_id] = agent.reason
    }
    setFailedAgentsMap(failuresMap)
  }

  // Handle auto-distribute preview
  const handleAutoDistributePreview = async (request: Omit<AutoDistributeRequest, 'schedule_date'>) => {
    const { generateDistributionPreview } = await import('../lib/autoDistribution')
    const fullRequest = { ...request, schedule_date: dateStr }
    return await generateDistributionPreview(fullRequest)
  }

  // Handle CSV import
  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const result = await importFromCSV(file)
      
      if (result.success) {
        success(`Successfully imported ${result.imported} break schedules!`)
        // Refresh the schedule data using React Query invalidation
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BREAK_SCHEDULES] })
      } else {
        const errorMsg = result.errors.length > 0
          ? `Import completed with ${result.errors.length} errors. Check console for details.`
          : 'Import failed'
        showError(errorMsg)
        console.error('Import errors:', result.errors)
      }
    } catch (error) {
      showError('Failed to import CSV file')
      console.error('Import error:', error)
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle CSV export
  const handleExport = async () => {
    try {
      const blob = await exportToCSV(schedules, dateStr)
      
      // Create download link
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `break-schedules-${dateStr}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      success('Break schedules exported successfully!')
    } catch (error) {
      showError('Failed to export break schedules')
      console.error('Export error:', error)
    }
  }

  // Handle warning dismissal
  const handleDismissWarning = async () => {
    if (selectedWarning) {
      await dismissWarning.mutateAsync(selectedWarning)
      setSelectedWarning(null)
    }
  }

  // Handle clear all breaks
  const handleClearAll = async () => {
    if (window.confirm(`Are you sure you want to clear all breaks for ${dateStr}? This action cannot be undone.`)) {
      await clearAllBreaks.mutateAsync(dateStr)
      // Clear failed agents map
      setFailedAgentsMap({})
    }
  }

  const activeWarning = warnings.find((w) => w.id === selectedWarning)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-[95%]">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Break Schedule</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isWFM
              ? 'Manage team break schedules'
              : user?.role === 'tl'
              ? 'View team break schedules'
              : 'View your break schedule'}
          </p>
        </div>
      </div>

      {/* Warnings banner */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                {warnings.length} unresolved warning{warnings.length > 1 ? 's' : ''}
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Shift changes detected. Click to review and dismiss warnings.
              </p>
              <button
                onClick={() => setSelectedWarning(warnings[0].id)}
                className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
              >
                Review warnings
              </button>
            </div>
          </div>
        </div>
      )}

      <DateNavigation currentDate={currentDate} onDateChange={setCurrentDate} />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        departments={departments}
        isWFM={isWFM}
        onAutoDistribute={() => setShowAutoDistribute(true)}
        onImport={handleImport}
        onExport={handleExport}
        onClearAll={handleClearAll}
      />

      <BreakScheduleTable
        schedules={schedulesWithFailures}
        intervals={intervals}
        onUpdate={handleUpdate}
        isEditable={isEditable}
        scheduleDate={dateStr}
      />

      {/* Auto-distribute modal */}
      {showAutoDistribute && (
        <AutoDistributeModal
          onClose={() => setShowAutoDistribute(false)}
          onApply={handleAutoDistribute}
          onPreview={handleAutoDistributePreview}
          departments={departments}
        />
      )}

      {/* Warning popup */}
      {activeWarning && (
        <WarningPopup
          warning={activeWarning}
          onDismiss={handleDismissWarning}
          onClose={() => setSelectedWarning(null)}
        />
      )}

      {/* Hidden file input for CSV import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        disabled={isImporting}
      />
    </div>
  )
}
