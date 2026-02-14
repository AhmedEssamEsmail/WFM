import { TypeBadge, type RequestType } from './TypeBadge'
import { StatusBadge, type RequestStatus } from './StatusBadge'

export interface RequestTableRow {
  id: string
  type: RequestType
  requester: {
    id: string
    name: string
  }
  details: string // "→ John Doe" for swaps, "Jan 15 - Jan 20" for leave
  status: RequestStatus
  actions: RequestAction[]
}

export type RequestAction = 'approve' | 'reject' | 'revoke'

interface RequestTableProps {
  requests: RequestTableRow[]
  onRowClick: (id: string, type: RequestType) => void
  onAction: (id: string, action: RequestAction) => Promise<void>
  loading?: boolean
}

/**
 * RequestTable component displays a unified table of swap and leave requests
 * 
 * Requirements:
 * - 8.2: Display both swap and leave requests in a unified table
 * - 8.3: Show requester avatar and name
 * - 8.4: Show TypeBadge for request type
 * - 8.5: Show type-specific details (target user for swaps, date range for leave)
 * - 8.6: Show StatusBadge with color coding
 * - 8.7: Display conditional action buttons based on permissions
 * - 8.8: Handle row click for navigation to detail pages
 * - 15.4: Implement responsive card layout for mobile
 */
export function RequestTable({ requests, onRowClick, onAction, loading = false }: RequestTableProps) {
  const handleAction = async (e: React.MouseEvent, id: string, action: RequestAction) => {
    e.stopPropagation() // Prevent row click when clicking action button
    await onAction(id, action)
  }

  const getActionButtonStyles = (action: RequestAction) => {
    switch (action) {
      case 'approve':
        return 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
      case 'reject':
        return 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
      case 'revoke':
        return 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
    }
  }

  const getActionButtonLabel = (action: RequestAction) => {
    return action.charAt(0).toUpperCase() + action.slice(1)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No requests found</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table view - hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                aria-label="Requester column"
              >
                Requester
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                aria-label="Type column"
              >
                Type
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                aria-label="Details column"
              >
                Details
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                aria-label="Status column"
              >
                Status
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                aria-label="Actions column"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr
                key={request.id}
                onClick={() => onRowClick(request.id, request.type)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onRowClick(request.id, request.type)
                  }
                }}
                aria-label={`View ${request.type} request from ${request.requester.name}`}
              >
                {/* Requester column - Requirement 8.3 */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div 
                      className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm flex-shrink-0"
                      aria-hidden="true"
                    >
                      {getInitials(request.requester.name)}
                    </div>
                    {/* Name */}
                    <span className="text-sm font-medium text-gray-900">
                      {request.requester.name}
                    </span>
                  </div>
                </td>

                {/* Type column - Requirement 8.4 */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <TypeBadge type={request.type} />
                </td>

                {/* Details column - Requirement 8.5 */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{request.details}</span>
                </td>

                {/* Status column - Requirement 8.6 */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={request.status} />
                </td>

                {/* Actions column - Requirement 8.7 */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {request.actions.map((action) => (
                      <button
                        key={action}
                        onClick={(e) => handleAction(e, request.id, action)}
                        className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${getActionButtonStyles(action)}`}
                        aria-label={`${getActionButtonLabel(action)} request from ${request.requester.name}`}
                      >
                        {getActionButtonLabel(action)}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view - Requirement 15.4 */}
      <div className="md:hidden space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            onClick={() => onRowClick(request.id, request.type)}
            className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onRowClick(request.id, request.type)
              }
            }}
            aria-label={`View ${request.type} request from ${request.requester.name}`}
          >
            {/* Header with requester and type */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar */}
                <div 
                  className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm flex-shrink-0"
                  aria-hidden="true"
                >
                  {getInitials(request.requester.name)}
                </div>
                {/* Name */}
                <span className="text-sm font-medium text-gray-900 truncate">
                  {request.requester.name}
                </span>
              </div>
              {/* Type badge */}
              <TypeBadge type={request.type} />
            </div>

            {/* Details */}
            <div className="mb-3">
              <p className="text-sm text-gray-600">{request.details}</p>
            </div>

            {/* Status */}
            <div className="mb-3">
              <StatusBadge status={request.status} />
            </div>

            {/* Actions */}
            {request.actions.length > 0 && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                {request.actions.map((action) => (
                  <button
                    key={action}
                    onClick={(e) => handleAction(e, request.id, action)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${getActionButtonStyles(action)}`}
                    aria-label={`${getActionButtonLabel(action)} request from ${request.requester.name}`}
                  >
                    {getActionButtonLabel(action)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
