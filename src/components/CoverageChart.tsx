interface CoverageData {
  day: string; // 'Mon', 'Tue', etc.
  count: number;
  level: 'adequate' | 'low' | 'critical';
}

interface CoverageChartProps {
  data: CoverageData[];
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
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Color mapping for coverage levels
  const getBarColor = (level: 'adequate' | 'low' | 'critical'): string => {
    switch (level) {
      case 'adequate':
        return 'bg-green-500';
      case 'low':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
    }
  };

  return (
    <div
      className="rounded-lg bg-white p-6 shadow"
      role="region"
      aria-label="Weekly staffing coverage overview"
    >
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Coverage Overview</h3>

      {/* Chart container with horizontal scrolling on mobile */}
      <div className="overflow-x-auto">
        <div className="flex h-48 min-w-[400px] items-end justify-between gap-4">
          {data.map((item, index) => {
            const barHeight = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            const barColor = getBarColor(item.level);

            return (
              <div key={index} className="flex flex-1 flex-col items-center">
                {/* Bar container with number on top */}
                <div className="flex h-40 w-[37.5%] flex-col items-center justify-end">
                  {/* Count label above bar */}
                  <div className="mb-1 text-center">
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full ${barColor} rounded-t transition-all duration-300`}
                    style={{ height: `${barHeight}%`, minHeight: barHeight > 0 ? '24px' : '0' }}
                    role="img"
                    aria-label={`${item.day}: ${item.count} staff, ${item.level} coverage`}
                  ></div>
                </div>

                {/* Day label */}
                <div className="mt-2 text-center">
                  <span className="text-sm font-medium text-gray-900">{item.day}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-green-500" aria-hidden="true"></div>
          <span className="text-gray-700">Adequate (&gt;12)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-yellow-500" aria-hidden="true"></div>
          <span className="text-gray-700">Low (8-12)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-500" aria-hidden="true"></div>
          <span className="text-gray-700">Critical (&lt;8)</span>
        </div>
      </div>
    </div>
  );
}
