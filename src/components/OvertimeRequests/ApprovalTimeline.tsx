/**
 * ApprovalTimeline Component
 * 
 * Displays the approval workflow timeline for an overtime request.
 * Shows submission, TL approval, and WFM approval stages with visual indicators.
 * 
 * Validates Requirements: 6.2, 6.4, 6.5
 */

import { OvertimeRequest } from '../../types/overtime'
import { formatDateTime } from '../../utils/dateHelpers'

interface ApprovalTimelineProps {
  request: OvertimeRequest
}

export default function ApprovalTimeline({ request }: ApprovalTimelineProps) {
  // Determine if WFM stage was skipped (auto-approved)
  const isAutoApproved = request.status === 'approved' && 
    request.tl_reviewed_by === request.wfm_reviewed_by &&
    request.tl_reviewed_at === request.wfm_reviewed_at

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval Timeline</h2>
      <div className="space-y-4">
        
        {/* Submission Stage - Always shown */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">Submitted</p>
            <p className="text-sm text-gray-500">
              Submitted on {formatDateTime(request.created_at)}
            </p>
          </div>
        </div>

        {/* TL Approval Stage */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            request.status === 'rejected' && request.tl_reviewed_at ? 'bg-red-100 text-red-600' :
            request.tl_reviewed_at ? 'bg-green-100 text-green-600' :
            request.status === 'pending_tl' ? 'bg-yellow-100 text-yellow-600' :
            'bg-gray-100 text-gray-400'
          }`}>
            {request.status === 'rejected' && request.tl_reviewed_at ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : request.tl_reviewed_at ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : request.status === 'pending_tl' ? (
              <span className="text-sm font-bold">...</span>
            ) : (
              <span className="text-sm font-bold">-</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">Team Lead Review</p>
            {request.status === 'rejected' && request.tl_reviewed_at ? (
              <>
                <p className="text-sm text-red-600">
                  Rejected on {formatDateTime(request.tl_reviewed_at)}
                </p>
                {request.tl_notes && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Note:</span> {request.tl_notes}
                  </p>
                )}
              </>
            ) : request.tl_reviewed_at ? (
              <>
                <p className="text-sm text-green-600">
                  Approved on {formatDateTime(request.tl_reviewed_at)}
                </p>
                {request.tl_notes && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Note:</span> {request.tl_notes}
                  </p>
                )}
              </>
            ) : request.status === 'pending_tl' ? (
              <p className="text-sm text-yellow-600">Awaiting approval</p>
            ) : (
              <p className="text-sm text-gray-500">Pending</p>
            )}
          </div>
        </div>

        {/* WFM Approval Stage */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isAutoApproved ? 'bg-blue-100 text-blue-600' :
            request.status === 'rejected' && request.wfm_reviewed_at ? 'bg-red-100 text-red-600' :
            request.wfm_reviewed_at ? 'bg-green-100 text-green-600' :
            request.status === 'pending_wfm' ? 'bg-yellow-100 text-yellow-600' :
            'bg-gray-100 text-gray-400'
          }`}>
            {isAutoApproved ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ) : request.status === 'rejected' && request.wfm_reviewed_at ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : request.wfm_reviewed_at ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : request.status === 'pending_wfm' ? (
              <span className="text-sm font-bold">...</span>
            ) : (
              <span className="text-sm font-bold">-</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">WFM Review</p>
            {isAutoApproved ? (
              <>
                <p className="text-sm text-blue-600">
                  Auto-approved (skipped)
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Auto-approved after Team Lead approval
                </p>
              </>
            ) : request.status === 'rejected' && request.wfm_reviewed_at ? (
              <>
                <p className="text-sm text-red-600">
                  Rejected on {formatDateTime(request.wfm_reviewed_at)}
                </p>
                {request.wfm_notes && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Note:</span> {request.wfm_notes}
                  </p>
                )}
              </>
            ) : request.wfm_reviewed_at ? (
              <>
                <p className="text-sm text-green-600">
                  Approved on {formatDateTime(request.wfm_reviewed_at)}
                </p>
                {request.wfm_notes && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Note:</span> {request.wfm_notes}
                  </p>
                )}
              </>
            ) : request.status === 'pending_wfm' ? (
              <p className="text-sm text-yellow-600">Awaiting approval</p>
            ) : (
              <p className="text-sm text-gray-500">Pending</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
