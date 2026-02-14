import { ScheduleView } from '../hooks/useScheduleView'

interface ViewToggleProps {
  value: ScheduleView
  onChange: (view: ScheduleView) => void
}

/**
 * ViewToggle component for switching between weekly and monthly schedule views
 * 
 * Requirements:
 * - 5.1: Display a View_Toggle control with "Weekly" and "Monthly" options
 */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div 
      className="inline-flex rounded-lg border border-gray-300 bg-white p-1"
      role="group"
      aria-label="Schedule view toggle"
    >
      <button
        type="button"
        onClick={() => onChange('weekly')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          value === 'weekly'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
        aria-pressed={value === 'weekly'}
      >
        Weekly
      </button>
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          value === 'monthly'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
        aria-pressed={value === 'monthly'}
      >
        Monthly
      </button>
    </div>
  )
}
