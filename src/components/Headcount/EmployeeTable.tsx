import { Link } from 'react-router-dom'
import type { HeadcountUser } from '../../types'
import { ROUTES } from '../../constants'

interface EmployeeTableProps {
  employees: HeadcountUser[]
  loading?: boolean
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200',
  on_leave: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-red-100 text-red-800',
  suspended: 'bg-orange-100 text-orange-800',
}

const ROLE_COLORS: Record<string, string> = {
  agent: 'bg-blue-100 text-blue-800',
  tl: 'bg-purple-100 text-purple-800',
  wfm: 'bg-indigo-100 text-indigo-800',
}

export default function EmployeeTable({ employees, loading }: EmployeeTableProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded mb-2"></div>
        ))}
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        No employees found matching your criteria.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-950">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Manager</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          {employees.map((employee) => (
            <tr key={employee.id} className="hover:bg-slate-50 dark:bg-slate-950">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link to={ROUTES.HEADCOUNT_EMPLOYEE_DETAIL(employee.id)} className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{employee.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{employee.email}</div>
                  </div>
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                {employee.employee_id || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                {employee.department || 'Unassigned'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ROLE_COLORS[employee.role]}`}>
                  {employee.role.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[employee.status]}`}>
                  {employee.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                {employee.manager_name || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}



