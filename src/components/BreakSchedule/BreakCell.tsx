import { BreakType, ValidationViolation } from '../../types'
import { cn } from '../../lib/designSystem'

interface BreakCellProps {
  breakType: BreakType | null
  onClick?: () => void
  isSelected?: boolean
  violations?: ValidationViolation[]
  isEditable?: boolean
}

const BREAK_COLORS: Record<BreakType, string> = {
  HB1: 'bg-blue-100 text-blue-900 border-blue-300',
  B: 'bg-green-100 text-green-900 border-green-300',
  HB2: 'bg-purple-100 text-purple-900 border-purple-300',
  IN: 'bg-gray-50 text-gray-700 border-gray-200',
}

const BREAK_LABELS: Record<BreakType, string> = {
  HB1: 'HB1',
  B: 'B',
  HB2: 'HB2',
  IN: 'IN',
}

export default function BreakCell({
  breakType,
  onClick,
  isSelected = false,
  violations = [],
  isEditable = false,
}: BreakCellProps) {
  const hasErrors = violations.some(v => v.severity === 'error')
  const hasWarnings = violations.some(v => v.severity === 'warning')

  return (
    <div
      className={cn(
        'relative px-2 py-1 text-center text-xs font-medium border rounded transition-colors',
        breakType ? BREAK_COLORS[breakType] : 'bg-white text-gray-400 border-gray-200',
        isEditable && 'cursor-pointer hover:opacity-80',
        isSelected && 'ring-2 ring-primary-500 ring-offset-1',
        hasErrors && 'border-red-500 border-2',
        hasWarnings && !hasErrors && 'border-yellow-500 border-2'
      )}
      onClick={isEditable ? onClick : undefined}
      role={isEditable ? 'button' : undefined}
      tabIndex={isEditable ? 0 : -1}
      onKeyDown={(e) => {
        if (isEditable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick?.()
        }
      }}
      aria-label={
        breakType
          ? `Break type ${BREAK_LABELS[breakType]}${isSelected ? ', selected' : ''}${
              hasErrors ? ', has errors' : hasWarnings ? ', has warnings' : ''
            }`
          : 'No break scheduled'
      }
      title={violations.length > 0 ? violations.map(v => v.message).join(', ') : undefined}
    >
      {breakType ? BREAK_LABELS[breakType] : '-'}
      {hasErrors && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" aria-hidden="true" />
      )}
      {hasWarnings && !hasErrors && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full" aria-hidden="true" />
      )}
    </div>
  )
}
