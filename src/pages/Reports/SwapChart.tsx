import type { ReportMetrics } from '../../services/reportsService'

interface SwapChartProps {
  metrics: ReportMetrics
}

export default function SwapChart({ metrics }: SwapChartProps) {
  const maxValue = Math.max(...Object.values(metrics.swapsByUser))

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Swaps by User</h3>
      <div className="space-y-3">
        {Object.entries(metrics.swapsByUser)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([userName, count]) => (
            <div key={userName} className="flex items-center">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{userName}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{count}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${(count / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        {Object.keys(metrics.swapsByUser).length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No swap requests in this period</p>
        )}
      </div>
    </div>
  )
}



