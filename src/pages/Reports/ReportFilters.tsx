interface ReportFiltersProps {
  dateRange: 'current' | 'last' | 'custom'
  startDate: string
  endDate: string
  onDateRangeChange: (range: 'current' | 'last' | 'custom') => void
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
}

export default function ReportFilters({
  dateRange,
  startDate,
  endDate,
  onDateRangeChange,
  onStartDateChange,
  onEndDateChange,
}: ReportFiltersProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => onDateRangeChange('current')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateRange === 'current'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-700'
            }`}
          >
            Current Month
          </button>
          <button
            onClick={() => onDateRangeChange('last')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateRange === 'last'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-700'
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => onDateRangeChange('custom')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateRange === 'custom'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-700'
            }`}
          >
            Custom
          </button>
        </div>

        {dateRange === 'custom' && (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            />
            <span className="text-slate-500 dark:text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            />
          </div>
        )}
      </div>
    </div>
  )
}



