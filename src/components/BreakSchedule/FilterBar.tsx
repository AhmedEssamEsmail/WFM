import { useState, useEffect } from 'react'
import { BUTTON_STYLES, INPUT_STYLES } from '../../lib/designSystem'

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedDepartment: string
  onDepartmentChange: (department: string) => void
  departments: string[]
  isWFM?: boolean
  onAutoDistribute?: () => void
  onImport?: () => void
  onExport?: () => void
  onClearAll?: () => void
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedDepartment,
  onDepartmentChange,
  departments,
  isWFM = false,
  onAutoDistribute,
  onImport,
  onExport,
  onClearAll,
}: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery)

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, onSearchChange])

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          {/* Search input */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="agent-search" className="sr-only">
              Search agents
            </label>
            <input
              id="agent-search"
              type="text"
              placeholder="Search agents..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className={INPUT_STYLES.default}
            />
          </div>

          {/* Department filter */}
          <div className="min-w-[150px]">
            <label htmlFor="department-filter" className="sr-only">
              Filter by department
            </label>
            <select
              id="department-filter"
              value={selectedDepartment}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm text-gray-700"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* WFM action buttons */}
        {isWFM && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onAutoDistribute}
              className={`${BUTTON_STYLES.primary} text-sm whitespace-nowrap flex-shrink-0`}
            >
              Auto-Distribute
            </button>
            <button
              onClick={onClearAll}
              className={`${BUTTON_STYLES.danger} text-sm whitespace-nowrap flex-shrink-0`}
              title="Clear all breaks for this date"
            >
              Clear All
            </button>
            <button
              onClick={onImport}
              className={`${BUTTON_STYLES.secondary} text-sm whitespace-nowrap flex-shrink-0`}
            >
              Import CSV
            </button>
            <button
              onClick={onExport}
              className={`${BUTTON_STYLES.secondary} text-sm whitespace-nowrap flex-shrink-0`}
            >
              Export CSV
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
