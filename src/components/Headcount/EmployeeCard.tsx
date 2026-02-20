import type { HeadcountUser, UserRole } from '../../types';
import SkillsBadges from '../Skills/SkillsBadges';

interface EmployeeCardProps {
  employee: HeadcountUser;
  onEdit?: (employee: HeadcountUser) => void;
  canEdit?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  on_leave: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-red-100 text-red-800',
  suspended: 'bg-orange-100 text-orange-800',
};

const ROLE_LABELS: Record<UserRole, string> = {
  agent: 'Agent',
  tl: 'Team Lead',
  wfm: 'WFM',
};

export default function EmployeeCard({ employee, onEdit, canEdit }: EmployeeCardProps) {
  const initials = employee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      {/* Status Badge - Fixed Position */}
      <div className="absolute right-4 top-4">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[employee.status]}`}
        >
          {employee.status.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-start gap-3 pr-20">
        {/* Avatar */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-600">
          {initials}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900">{employee.name}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{ROLE_LABELS[employee.role]}</p>

          {/* Department & Email */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex-shrink-0 text-gray-500">Department</span>
              <span className="truncate font-medium text-gray-900">
                {employee.department || 'Unassigned'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex-shrink-0 text-gray-500">Email</span>
              <span className="truncate text-gray-900">{employee.email}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-2">
            {employee.job_title && (
              <span className="max-w-[150px] truncate rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                {employee.job_title}
              </span>
            )}
            {employee.location && (
              <span className="max-w-[150px] truncate rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                {employee.location}
              </span>
            )}
          </div>

          {/* Skills */}
          {employee.assigned_skills && employee.assigned_skills.length > 0 && (
            <div className="mt-3">
              <SkillsBadges skills={employee.assigned_skills} />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Fixed Position */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        {canEdit && onEdit && (
          <button
            onClick={() => onEdit(employee)}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="Edit employee"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        )}

        <button
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Delete employee"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
