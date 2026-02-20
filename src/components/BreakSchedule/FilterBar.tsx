import { useState, useEffect } from 'react';
import { BUTTON_STYLES, INPUT_STYLES } from '../../lib/designSystem';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  departments: string[];
  isWFM?: boolean;
  onAutoDistribute?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onClearAll?: () => void;
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
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex w-full flex-1 flex-col gap-3 sm:w-auto sm:flex-row">
          {/* Search input */}
          <div className="min-w-[200px] flex-1">
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
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
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
          <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
            <button
              onClick={onAutoDistribute}
              className={`${BUTTON_STYLES.primary} flex-shrink-0 whitespace-nowrap text-sm`}
            >
              Auto-Distribute
            </button>
            <button
              onClick={onClearAll}
              className={`${BUTTON_STYLES.danger} flex-shrink-0 whitespace-nowrap text-sm`}
              title="Clear all breaks for this date"
            >
              Clear All
            </button>
            <button
              onClick={onImport}
              className={`${BUTTON_STYLES.secondary} flex-shrink-0 whitespace-nowrap text-sm`}
            >
              Import CSV
            </button>
            <button
              onClick={onExport}
              className={`${BUTTON_STYLES.secondary} flex-shrink-0 whitespace-nowrap text-sm`}
            >
              Export CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
