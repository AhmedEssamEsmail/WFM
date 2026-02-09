import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LeaveRequest, User, Comment, LeaveRequestStatus } from '../types'
import { LEAVE_DESCRIPTIONS, getStatusColor, getStatusLabel } from '../lib/designSystem'
import { leaveRequestsService, commentsService, settingsService, authService } from '../services'
import { formatDate, formatDateTime, getDaysBetween } from '../utils'
import { ROUTES, ERROR_MESSAGES } from '../constants'
import { handleDatabaseError } from '../lib/errorHandler'
import { ConcurrencyError } from '../types/errors'

interface CommentWithSystem extends Comment {
  is_system?: boolean
  user?: User
}

export default function LeaveRequestDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [request, setRequest] = useState<LeaveRequest | null>(null)
  const [requester, setRequester] = useState<User | null>(null)
  const [comments, setComments] = useState<CommentWithSystem[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [allowExceptions, setAllowExceptions] = useState(false)
  const [requestingException, setRequestingException] = useState(false)
  const [showRefreshButton, setShowRefreshButton] = useState(false)

  useEffect(() => {
    if (id) {
      fetchRequestDetails()
      fetchExceptionSetting()
    }
  }, [id])

  async function fetchExceptionSetting() {
    try {
      const value = await settingsService.getAllowLeaveExceptionsSetting()
      setAllowExceptions(value)
    } catch (err) {
      handleDatabaseError(err, 'fetch exception setting')
    }
  }

  async function fetchRequestDetails() {
    try {
      // Fetch leave request with user details
      const requestData = await leaveRequestsService.getLeaveRequestById(id!)
      setRequest(requestData)

      // Fetch requester details
      const userData = await authService.getUserProfile(requestData.user_id)
      setRequester(userData)

      // Fetch comments
      await fetchComments()
    } catch (err) {
      handleDatabaseError(err, 'fetch request details')
      setError(ERROR_MESSAGES.NOT_FOUND)
    } finally {
      setLoading(false)
    }
  }

  async function fetchComments() {
    try {
      const data = await commentsService.getComments(id!, 'leave')
      setComments(data as CommentWithSystem[])
    } catch (err) {
      handleDatabaseError(err, 'fetch comments')
    }
  }

  async function handleApprove() {
    if (!request || !user) return
    setSubmitting(true)
    setError('')
    setShowRefreshButton(false)

    try {
      let newStatus: LeaveRequestStatus = request.status
      let approvalField: 'tl_approved_at' | 'wfm_approved_at' | undefined

      if (user.role === 'tl' && request.status === 'pending_tl') {
        newStatus = 'pending_wfm'
        approvalField = 'tl_approved_at'
      } else if (user.role === 'wfm' && (request.status === 'pending_wfm' || request.status === 'pending_tl')) {
        newStatus = 'approved'
        approvalField = 'wfm_approved_at'
      }

      await leaveRequestsService.updateLeaveRequestStatus(id!, newStatus, approvalField, request.status)

      // Add system comment
      await addSystemComment(`Request approved by ${user.name} (${user.role.toUpperCase()})`)

      // Refresh the request
      await fetchRequestDetails()
    } catch (err) {
      if (err instanceof ConcurrencyError) {
        setError('This request was modified by someone else. Please refresh to see the latest version.')
        setShowRefreshButton(true)
      } else {
        handleDatabaseError(err, 'approve request')
        setError(ERROR_MESSAGES.SERVER)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject() {
    if (!request || !user) return
    setSubmitting(true)
    setError('')
    setShowRefreshButton(false)

    try {
      await leaveRequestsService.updateLeaveRequestStatus(id!, 'rejected', undefined, request.status)

      // Add system comment
      await addSystemComment(`Request rejected by ${user.name} (${user.role.toUpperCase()})`)

      // Refresh the request
      await fetchRequestDetails()
    } catch (err) {
      if (err instanceof ConcurrencyError) {
        setError('This request was modified by someone else. Please refresh to see the latest version.')
        setShowRefreshButton(true)
      } else {
        handleDatabaseError(err, 'reject request')
        setError(ERROR_MESSAGES.SERVER)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAskForException() {
    if (!request || !user) return
    setRequestingException(true)
    setError('')
    setShowRefreshButton(false)

    try {
      await leaveRequestsService.updateLeaveRequestStatus(id!, 'pending_tl', undefined, request.status)

      // Add system comment
      await addSystemComment('Exception requested - sent for TL approval')

      // Refresh the request
      await fetchRequestDetails()
    } catch (err) {
      if (err instanceof ConcurrencyError) {
        setError('This request was modified by someone else. Please refresh to see the latest version.')
        setShowRefreshButton(true)
      } else {
        handleDatabaseError(err, 'request exception')
        setError(ERROR_MESSAGES.SERVER)
      }
    } finally {
      setRequestingException(false)
    }
  }

  async function handleCancel() {
    if (!request || !user) return
    setSubmitting(true)
    setError('')
    setShowRefreshButton(false)

    try {
      await leaveRequestsService.updateLeaveRequestStatus(id!, 'rejected', undefined, request.status)

      // Add system comment
      await addSystemComment(`Request cancelled by ${user.name}`)

      // Refresh the request
      await fetchRequestDetails()
    } catch (err) {
      if (err instanceof ConcurrencyError) {
        setError('This request was modified by someone else. Please refresh to see the latest version.')
        setShowRefreshButton(true)
      } else {
        handleDatabaseError(err, 'cancel request')
        setError(ERROR_MESSAGES.SERVER)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function addSystemComment(content: string) {
    if (!user) return

    try {
      await commentsService.createSystemComment(id!, 'leave', content, user.id)
    } catch (err) {
      handleDatabaseError(err, 'add system comment')
    }
  }

  async function handleAddComment() {
    if (!newComment.trim() || !user) return
    setSubmitting(true)

    try {
      await commentsService.createComment({
        request_id: id!,
        request_type: 'leave',
        user_id: user.id,
        content: newComment.trim()
      })

      setNewComment('')
      await fetchComments()
    } catch (err) {
      handleDatabaseError(err, 'add comment')
      setError(ERROR_MESSAGES.SERVER)
    } finally {
      setSubmitting(false)
    }
  }

  const calculateDays = (start: string, end: string) => {
    return getDaysBetween(start, end)
  }

  const canApprove = () => {
    if (!request || !user) return false
    if (request.status === 'approved' || request.status === 'rejected' || request.status === 'denied') return false
    if (user.role === 'tl' && request.status === 'pending_tl') return true
    if (user.role === 'wfm' && (request.status === 'pending_wfm' || request.status === 'pending_tl')) return true
    return false
  }

  const canReject = () => {
    if (!request || !user) return false
    if (request.status === 'approved' || request.status === 'rejected' || request.status === 'denied') return false
    if (user.role === 'tl' || user.role === 'wfm') return true
    return false
  }

  const canAskForException = () => {
    if (!request || !user || !allowExceptions) return false
    return request.status === 'denied'
  }

  const canCancel = () => {
    if (!request || !user) return false
    // Requester can cancel if they own the request and it's not yet approved/rejected/denied
    return user.id === request.user_id && (request.status === 'pending_tl' || request.status === 'pending_wfm')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-6 w-16 bg-gray-200 rounded mb-2 animate-pulse"></div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        {/* Request Details Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-6 w-40 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-6 w-56 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-6 w-44 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Timeline Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 rounded mb-1 animate-pulse"></div>
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comments Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 bg-gray-100 rounded-lg">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!request || !requester) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error || 'Request not found'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(ROUTES.LEAVE_REQUESTS)}
            className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Leave Request Details</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
          {getStatusLabel(request.status)}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          {showRefreshButton && (
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Refresh Page
            </button>
          )}
        </div>
      )}

      {/* Request Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Requester</h3>
            <p className="text-lg text-gray-900">{requester.name}</p>
            <p className="text-sm text-gray-500">{requester.email}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Leave Type</h3>
            <p className="text-lg text-gray-900">{LEAVE_DESCRIPTIONS[request.leave_type]}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Dates</h3>
            <p className="text-lg text-gray-900">
              {formatDate(request.start_date)} - {formatDate(request.end_date)}
            </p>
            <p className="text-sm text-gray-500">
              {calculateDays(request.start_date, request.end_date)} day(s)
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Submitted</h3>
            <p className="text-lg text-gray-900">
              {formatDateTime(request.created_at)}
            </p>
          </div>

          {request.notes && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Notes</h3>
              <p className="text-gray-900">{request.notes}</p>
            </div>
          )}
        </div>

        {/* Denied status explanation */}
        {request.status === 'denied' && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-orange-800 text-sm">
              This request was automatically denied because the requested leave days exceeded your available balance.
              {allowExceptions && ' You can request an exception by clicking the "Ask for Exception" button above.'}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(canApprove() || canReject() || canAskForException() || canCancel()) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {canApprove() && (
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Approve'}
              </button>
            )}
            {canReject() && (
              <button
                onClick={handleReject}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Reject'}
              </button>
            )}
            {canAskForException() && (
              <button
                onClick={handleAskForException}
                disabled={requestingException}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestingException ? 'Requesting...' : 'Ask for Exception'}
              </button>
            )}
            {canCancel() && (
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Cancel Request'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Approval Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval Timeline</h2>
        <div className="space-y-4">
          {/* Created Step */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Created</p>
              <p className="text-sm text-gray-500">
                Created on {formatDateTime(request.created_at)}
              </p>
            </div>
          </div>

          {/* Auto-Denied Step (only if status is denied) */}
          {request.status === 'denied' && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-100 text-orange-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-orange-800">Auto-Denied</p>
                <p className="text-sm text-gray-500">
                  Insufficient leave balance
                </p>
              </div>
            </div>
          )}

          {/* TL Approval Step */}
          {request.status !== 'denied' && (
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                request.status === 'rejected' ? 'bg-red-100 text-red-600' :
                request.tl_approved_at ? 'bg-green-100 text-green-600' :
                request.status === 'pending_tl' ? 'bg-yellow-100 text-yellow-600' :
                'bg-gray-100 text-gray-400'
              }`}>
                {request.status === 'rejected' && !request.tl_approved_at ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : request.tl_approved_at ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : request.status === 'pending_tl' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <span className="text-sm">2</span>
                )}
              </div>
              <div>
                <p className={`font-medium ${
                  request.status === 'rejected' && !request.tl_approved_at ? 'text-red-800' :
                  request.tl_approved_at ? 'text-gray-900' :
                  request.status === 'pending_tl' ? 'text-yellow-800' :
                  'text-gray-400'
                }`}>
                  {request.status === 'rejected' && !request.tl_approved_at ? 'Rejected by TL' :
                   request.tl_approved_at ? 'TL Approved' :
                   request.status === 'pending_tl' ? 'Awaiting TL Approval' :
                   'TL Approval'}
                </p>
                {request.tl_approved_at && (
                  <p className="text-sm text-gray-500">
                    Approved on {formatDateTime(request.tl_approved_at)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* WFM Approval Step */}
          {request.status !== 'denied' && (
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                request.status === 'rejected' && request.tl_approved_at ? 'bg-red-100 text-red-600' :
                request.status === 'approved' ? 'bg-green-100 text-green-600' :
                request.status === 'pending_wfm' ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-400'
              }`}>
                {request.status === 'rejected' && request.tl_approved_at ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : request.status === 'approved' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : request.status === 'pending_wfm' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <span className="text-sm">3</span>
                )}
              </div>
              <div>
                <p className={`font-medium ${
                  request.status === 'rejected' && request.tl_approved_at ? 'text-red-800' :
                  request.status === 'approved' ? 'text-gray-900' :
                  request.status === 'pending_wfm' ? 'text-blue-800' :
                  'text-gray-400'
                }`}>
                  {request.status === 'rejected' && request.tl_approved_at ? 'Rejected by WFM' :
                   request.status === 'approved' ? 'WFM Approved' :
                   request.status === 'pending_wfm' ? 'Awaiting WFM Approval' :
                   'WFM Approval'}
                </p>
                {request.wfm_approved_at && (
                  <p className="text-sm text-gray-500">
                    Approved on {formatDateTime(request.wfm_approved_at)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>

        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-3 rounded-lg ${comment.is_system ? 'bg-gray-100' : 'bg-blue-50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${comment.is_system ? 'text-gray-700' : 'text-blue-800'}`}>
                    {comment.is_system ? 'System' : (comment as any).users?.name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
