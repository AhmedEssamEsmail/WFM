import type { HeadcountUser, UserRole } from '../../types'

interface EmployeeCardProps {
  employee: HeadcountUser
  onEdit?: (employee: HeadcountUser) => void
  canEdit?: boolean
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  on_leave: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-red-100 text-red-800',
  suspended: 'bg-orange-100 text-orange-800',
}

const ROLE_LABELS: Record<UserRole, string> = {
  agent: 'Agent',
  tl: 'Team Lead',
  wfm: 'WFM',
}

export default function EmployeeCard({ employee, onEdit, canEdit }: EmployeeCardProps) {
  const initials = employee.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Avatar */}
          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold flex-shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">{employee.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{ROLE_LABELS[employee.role]}</p>

            {/* Department & Email */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Department</span>
                <span className="text-gray-900 font-medium">{employee.department || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-900">{employee.email}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-2">
              {employee.job_title && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                  {employee.job_title}
                </span>
              )}
              {employee.location && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                  {employee.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 ml-3">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[employee.status]}`}>
            {employee.status.replace('_', ' ')}
          </span>
          
          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(employee)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Edit employee"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          <button
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Delete employee"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
