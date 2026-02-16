import { CalendarIcon, ClockIcon } from '../icons'
import type { OvertimeRequest, OvertimeType, OvertimeStatus } from '../../types/overtime'

interface OvertimeRequestCardProps {
  request: OvertimeRequest
  onClick: () => void
}

/**
 * OvertimeRequestCard component displays a single overtime request in card format
 * 
 * Requirements:
 * - 4.4: Display work date, overtime type, total hours, status, and reason
 * - 4.5: Display approval information for approved or rejected requests
 * - 4.6: Handle click to navigate to detail page
 */
export function OvertimeRequestCard({ request, onClick }: OvertimeRequestCardProps) {
  const getOvertimeTypeColor = (type: OvertimeType): string => {
    switch (type) {
      case 'regular':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'double':
        return 'bg-purple-100 text-purple-800 border-purple-200'
    }
  }

  const getOvertimeTypeLabel = (type: OvertimeType): string => {
    switch (type) {
      case 'regular':
        return 'Regular (1.5x)'
      case 'double':
        return 'Double (2.0x)'
    }
  }

  const getStatusColor = (status: OvertimeStatus): string => {
    switch (status) {
      case 'pending_tl':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending_wfm':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: OvertimeStatus): string => {
    switch (status) {
      case 'pending_tl':
        return 'Pending TL'
      case 'pending_wfm':
        return 'Pending WFM'
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      case 'cancelled':
        return 'Cancelled'
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatTime = (timeString: string): string => {
    // timeString is in HH:mm:ss format
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const truncateReason = (reason: string, maxLength: number = 100): string => {
    if (reason.length <= maxLength) return reason
    return reason.substring(0, maxLength) + '...'
  }

  const getApprovalInfo = (): string | null => {
    if (request.status === 'approved' && request.wfm_reviewed_by) {
      return `Approved by ${request.requester?.name || 'WFM'}`
    }
    if (request.status === 'rejected') {
      if (request.wfm_reviewed_by) {
        return `Rejected by WFM`
      }
      if (request.tl_reviewed_by) {
        return `Rejected by TL`
      }
    }
    return null
  }

  const approvalInfo = getApprovalInfo()

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`View overtime request for ${formatDate(request.request_date)}`}
    >
      {/* Header: Date and Type */}
      <div className="flex items-start justify-between mb-3">
        {/* Work Date with Calendar Icon */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-900">
            {formatDate(request.request_date)}
          </span>
        </div>
        
        {/* Overtime Type Badge */}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getOvertimeTypeColor(request.overtime_type)}`}
          aria-label={`Overtime type: ${getOvertimeTypeLabel(request.overtime_type)}`}
        >
          {getOvertimeTypeLabel(request.overtime_type)}
        </span>
      </div>

      {/* Time Range and Hours */}
      <div className="flex items-center gap-4 mb-3">
        {/* Time Range */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <ClockIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>
            {formatTime(request.start_time)} - {formatTime(request.end_time)}
          </span>
        </div>
        
        {/* Total Hours */}
        <div className="text-sm font-semibold text-gray-900">
          {request.total_hours.toFixed(2)} hrs
        </div>
      </div>

      {/* Reason (Truncated) */}
      <div className="mb-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {truncateReason(request.reason)}
        </p>
      </div>

      {/* Footer: Status and Approval Info */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        {/* Status Badge */}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}
          aria-label={`Request status: ${getStatusLabel(request.status)}`}
        >
          {getStatusLabel(request.status)}
        </span>

        {/* Approval Info */}
        {approvalInfo && (
          <span className="text-xs text-gray-500">
            {approvalInfo}
          </span>
        )}
      </div>
    </div>
  )
}
