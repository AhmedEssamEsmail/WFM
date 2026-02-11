import { BreakScheduleWarning, ShiftType } from '../../types'
import { BUTTON_STYLES, SHIFT_LABELS } from '../../lib/designSystem'
import { format, parseISO } from 'date-fns'

interface WarningPopupProps {
  warning: BreakScheduleWarning
  onDismiss: () => void
  onClose: () => void
}

export default function WarningPopup({ warning, onDismiss, onClose }: WarningPopupProps) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-yellow-600"
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
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Shift Change Detected</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Date:</span>{' '}
                {format(parseISO(warning.schedule_date), 'EEEE, MMMM d, yyyy')}
              </p>
              <p>
                <span className="font-medium">Previous Shift:</span>{' '}
                {SHIFT_LABELS[warning.old_shift_type as ShiftType]}
              </p>
              <p>
                <span className="font-medium">New Shift:</span>{' '}
                {SHIFT_LABELS[warning.new_shift_type as ShiftType]}
              </p>
              <p className="mt-3 text-gray-700">
                The break schedule for this day has been cleared due to the shift change. Please
                reschedule breaks for the new shift.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className={`${BUTTON_STYLES.secondary} text-sm`}>
            Close
          </button>
          <button onClick={onDismiss} className={`${BUTTON_STYLES.primary} text-sm`}>
            Dismiss Warning
          </button>
        </div>
      </div>
    </div>
  )
}
