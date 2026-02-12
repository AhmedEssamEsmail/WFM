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
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => onDateRangeChange('current')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateRange === 'current'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Current Month
          </button>
          <button
            onClick={() => onDateRangeChange('last')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateRange === 'last'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => onDateRangeChange('custom')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateRange === 'custom'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            />
          </div>
        )}
      </div>
    </div>
  )
}
