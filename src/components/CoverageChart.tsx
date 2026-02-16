interface CoverageData {
  day: string // 'Mon', 'Tue', etc.
  count: number
  level: 'adequate' | 'low' | 'critical'
}

interface CoverageChartProps {
  data: CoverageData[]
}

/**
 * CoverageChart component visualizes daily staffing coverage for the week
 * 
 * Requirements:
 * - 4.2: Display bar chart showing staffing levels for each day of the current week (Monday through Sunday)
 * - 4.4: Use different colors to indicate coverage levels (adequate, low, critical)
 * - 15.3: Enable horizontal scrolling on mobile (viewport width < 768px)
 */
export function CoverageChart({ data }: CoverageChartProps) {
  // Find the maximum count to scale bars proportionally
  const maxCount = Math.max(...data.map(d => d.count), 1)
  
  // Color mapping for coverage levels
  const getBarColor = (level: 'adequate' | 'low' | 'critical'): string => {
    switch (level) {
      case 'adequate':
        return 'bg-green-500'
      case 'low':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
    }
  }

  const getBarTextColor = (level: 'adequate' | 'low' | 'critical'): string => {
    switch (level) {
      case 'adequate':
        return 'text-green-700'
      case 'low':
        return 'text-yellow-700'
      case 'critical':
        return 'text-red-700'
    }
  }

  return (
    <div 
      className="bg-white rounded-lg shadow p-6"
      role="region"
      aria-label="Weekly staffing coverage overview"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Overview</h3>
      
      {/* Chart container with horizontal scrolling on mobile */}
      <div className="overflow-x-auto">
        <div className="min-w-[400px] flex items-end justify-between gap-4 h-48">
          {data.map((item, index) => {
            const barHeight = maxCount > 0 ? (item.count / maxCount) * 100 : 0
            const barColor = getBarColor(item.level)
            const textColor = getBarTextColor(item.level)
            
            return (
              <div 
                key={index}
                className="flex-1 flex flex-col items-center gap-2"
              >
                {/* Bar */}
                <div className="w-full flex flex-col items-center justify-end h-40">
                  <div 
                    className={`w-full ${barColor} rounded-t transition-all duration-300 flex items-end justify-center pb-2`}
                    style={{ height: `${barHeight}%`, minHeight: barHeight > 0 ? '24px' : '0' }}
                    role="img"
                    aria-label={`${item.day}: ${item.count} staff, ${item.level} coverage`}
                  >
                    <span className="text-white font-semibold text-sm">
                      {item.count}
                    </span>
                  </div>
                </div>
                
                {/* Day label */}
                <div className="text-center">
                  <span className={`text-sm font-medium ${textColor}`}>
                    {item.day}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" aria-hidden="true"></div>
          <span className="text-gray-700">Adequate (&gt;12)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded" aria-hidden="true"></div>
          <span className="text-gray-700">Low (8-12)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" aria-hidden="true"></div>
          <span className="text-gray-700">Critical (&lt;8)</span>
        </div>
      </div>
    </div>
  )
}
