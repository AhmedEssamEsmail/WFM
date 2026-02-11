import { cn } from '../../lib/designSystem'

interface CoverageCellProps {
  count: number
  thresholds?: {
    green: number
    yellow: number
    orange: number
  }
}

const DEFAULT_THRESHOLDS = {
  green: 8,
  yellow: 6,
  orange: 4,
}

export default function CoverageCell({ count, thresholds = DEFAULT_THRESHOLDS }: CoverageCellProps) {
  const getColorClass = () => {
    if (count >= thresholds.green) return 'bg-green-100 text-green-900 border-green-300'
    if (count >= thresholds.yellow) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
    if (count >= thresholds.orange) return 'bg-orange-100 text-orange-900 border-orange-300'
    return 'bg-red-100 text-red-900 border-red-300'
  }

  const getStatusLabel = () => {
    if (count >= thresholds.green) return 'Good coverage'
    if (count >= thresholds.yellow) return 'Moderate coverage'
    if (count >= thresholds.orange) return 'Low coverage'
    return 'Critical coverage'
  }

  return (
    <div
      className={cn(
        'px-2 py-1 text-center text-xs font-medium border rounded',
        getColorClass()
      )}
      aria-label={`${count} agents in, ${getStatusLabel()}`}
      title={getStatusLabel()}
    >
      {count}
    </div>
  )
}
