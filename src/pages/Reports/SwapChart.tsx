import type { ReportMetrics } from '../../services/reportsService';

interface SwapChartProps {
  metrics: ReportMetrics;
}

export default function SwapChart({ metrics }: SwapChartProps) {
  const maxValue = Math.max(...Object.values(metrics.swapsByUser));

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-medium text-gray-900">Swaps by User</h3>
      <div className="space-y-3">
        {Object.entries(metrics.swapsByUser)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([userName, count]) => (
            <div key={userName} className="flex items-center">
              <div className="flex-1">
                <div className="mb-1 flex justify-between">
                  <span className="text-sm font-medium text-gray-700">{userName}</span>
                  <span className="text-sm text-gray-500">{count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-primary-600"
                    style={{ width: `${(count / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        {Object.keys(metrics.swapsByUser).length === 0 && (
          <p className="py-4 text-center text-sm text-gray-500">No swap requests in this period</p>
        )}
      </div>
    </div>
  );
}
