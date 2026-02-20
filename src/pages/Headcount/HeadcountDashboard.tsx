import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useHeadcount } from '../../hooks/useHeadcount';
import { useAuth } from '../../hooks/useAuth';
import type { HeadcountMetrics } from '../../types';
import { ROUTES } from '../../constants';

interface DepartmentSummary {
  department: string;
  total_employees: number;
  active_employees: number;
  [key: string]: string | number;
}

export default function HeadcountDashboard() {
  const { canEditHeadcount } = useAuth();
  const { getMetrics, getDepartmentSummary, loading } = useHeadcount();
  const [metrics, setMetrics] = useState<HeadcountMetrics | null>(null);
  const [deptSummary, setDeptSummary] = useState<DepartmentSummary[]>([]);

  const loadData = useCallback(async () => {
    const [metricsData, summaryData] = await Promise.all([getMetrics(), getDepartmentSummary()]);
    setMetrics(metricsData);
    setDeptSummary(summaryData as unknown as DepartmentSummary[]);
  }, [getMetrics, getDepartmentSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Header - Stack on mobile */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Headcount Management</h1>
          <p className="text-sm text-gray-600">Workforce overview and analytics</p>
        </div>
        <Link
          to={ROUTES.HEADCOUNT_EMPLOYEES}
          className="w-full rounded-lg bg-primary-600 px-4 py-2 text-center text-sm text-white transition-colors hover:bg-primary-700 sm:w-auto"
        >
          View All Employees
        </Link>
      </div>

      {/* Stats Cards - 2 columns on mobile, 3 on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
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
        <StatCard title="Departments" value={deptSummary.length} color="purple" loading={loading} />
      </div>

      {/* Department Breakdown - Card layout on mobile, table on desktop */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900">Department Breakdown</h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Headcount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  On Leave
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {deptSummary.map((dept) => (
                <tr key={dept.department} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {dept.department}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {dept.total_headcount}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {dept.active_count}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {dept.on_leave_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-gray-200 md:hidden">
          {deptSummary.map((dept) => (
            <div key={dept.department} className="p-4 hover:bg-gray-50">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-medium text-gray-900">{dept.department}</h3>
                <span className="text-sm text-gray-500">{dept.total_headcount} employees</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="block text-xs text-gray-500">Active</span>
                  <span className="font-medium text-green-600">{dept.active_count}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">On Leave</span>
                  <span className="font-medium text-yellow-600">{dept.on_leave_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!canEditHeadcount() && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          <strong>View Only Mode:</strong> As a Team Lead, you can view all headcount data but
          cannot make changes. Contact WFM for modifications.
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  color: string;
  loading?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
  };

  return (
    <div className={`${colors[color]} rounded-lg border p-3 sm:p-6`}>
      <div className="text-xs font-medium opacity-75 sm:text-sm">{title}</div>
      <div className="mt-1 text-xl font-bold sm:text-3xl">
        {loading ? (
          <div className="h-6 w-12 animate-pulse rounded bg-white/50 sm:h-8 sm:w-16"></div>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
