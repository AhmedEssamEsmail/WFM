import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useHeadcount } from '../../hooks/useHeadcount'
import { useAuth } from '../../hooks/useAuth'
import type { HeadcountMetrics } from '../../types'

export default function HeadcountDashboard() {
  const { canEditHeadcount } = useAuth()
  const { getMetrics, getDepartmentSummary, loading } = useHeadcount()
  const [metrics, setMetrics] = useState<HeadcountMetrics | null>(null)
  const [deptSummary, setDeptSummary] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [metricsData, summaryData] = await Promise.all([
      getMetrics(),
      getDepartmentSummary()
    ])
    setMetrics(metricsData)
    setDeptSummary(summaryData)
  }

  return (
    <div className="space-y-6">
      {/* Header - Stack on mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Headcount Management</h1>
          <p className="text-sm text-gray-600">Workforce overview and analytics</p>
        </div>
        <Link
          to="/headcount/employees"
          className="w-full sm:w-auto bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-center text-sm"
        >
          View All Employees
        </Link>
      </div>

      {/* Stats Cards - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Active"
          value={metrics?.total_active || 0}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="On Leave"
          value={metrics?.total_on_leave || 0}
          color="yellow"
          loading={loading}
        />
        <StatCard
          title="Total FTE"
          value={metrics?.total_fte?.toFixed(1) || '0.0'}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Departments"
          value={deptSummary.length}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Department Breakdown - Card layout on mobile, table on desktop */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Department Breakdown</h2>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Headcount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">FTE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">On Leave</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deptSummary.map((dept) => (
                <tr key={dept.department} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dept.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.total_headcount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.total_fte}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.active_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.on_leave_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {deptSummary.map((dept) => (
            <div key={dept.department} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{dept.department}</h3>
                <span className="text-sm text-gray-500">{dept.total_headcount} employees</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 block text-xs">FTE</span>
                  <span className="font-medium">{dept.total_fte}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Active</span>
                  <span className="font-medium text-green-600">{dept.active_count}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">On Leave</span>
                  <span className="font-medium text-yellow-600">{dept.on_leave_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!canEditHeadcount() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm">
          <strong>View Only Mode:</strong> As a Team Lead, you can view all headcount data but cannot make changes. Contact WFM for modifications.
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, color, loading }: { title: string, value: string | number, color: string, loading?: boolean }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
  }

  return (
    <div className={`${colors[color]} border rounded-lg p-3 sm:p-6`}>
      <div className="text-xs sm:text-sm font-medium opacity-75">{title}</div>
      <div className="text-xl sm:text-3xl font-bold mt-1">
        {loading ? <div className="h-6 sm:h-8 w-12 sm:w-16 bg-white/50 rounded animate-pulse"></div> : value}
      </div>
    </div>
  )
