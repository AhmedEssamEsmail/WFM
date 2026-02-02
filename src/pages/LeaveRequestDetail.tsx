import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { LeaveRequest, User, Comment, LeaveType, LeaveRequestStatus } from '../types'
import { format } from 'date-fns'

const leaveTypeLabels: Record<LeaveType, string> = {
  sick: 'Sick Leave',
  annual: 'Annual Leave',
  casual: 'Casual Leave',
  public_holiday: 'Public Holiday',
  bereavement: 'Bereavement Leave'
}

const statusLabels: Record<LeaveRequestStatus, string> = {
  pending_tl: 'Pending TL Approval',
  pending_wfm: 'Pending WFM Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  denied: 'Denied (Insufficient Balance)'
}

const statusColors: Record<LeaveRequestStatus, string> = {
  pending_tl: 'bg-yellow-100 text-yellow-800',
  pending_wfm: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  denied: 'bg-orange-100 text-orange-800'
}

interface CommentWithSystem extends Comment {
  is_system?: boolean
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

  useEffect(() => {
    if (id) {
      fetchRequestDetails()
      fetchExceptionSetting()
    }
  }, [id])

  async function fetchExceptionSetting() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'allow_leave_exceptions')
        .maybeSingle()

      if (error) {
        console.error('Error fetching exception setting:', error)
        return
      }

      // Default to true if setting doesn't exist
      setAllowExceptions(data?.value !== 'false')
    } catch (err) {
      console.error('Error fetching exception setting:', err)
    }
  }

  async function fetchRequestDetails() {
    try {
      // Fetch leave request
      const { data: requestData, error: requestError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('id', id)
        .single()

      if (requestError) throw requestError
      setRequest(requestData)

      // Fetch requester details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', requestData.user_id)
        .single()

      if (userError) throw userError
      setRequester(userData)

      // Fetch comments
      await fetchComments()
    } catch (err) {
      console.error('Error fetching request details:', err)
      setError('Failed to load request details')
    } finally {
      setLoading(false)
    }
  }

  async function fetchComments() {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('request_id', id)
        .eq('request_type', 'leave')
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
    }
  }

  async function handleApprove() {
    if (!request || !user) return
    setSubmitting(true)
    setError('')

    try {
      let newStatus: LeaveRequestStatus = request.status
      const updates: Partial<LeaveRequest> = {}

      if (user.role === 'tl' && request.status === 'pending_tl') {
        newStatus = 'pending_wfm'
        updates.tl_approved_at = new Date().toISOString()
      } else if (user.role === 'wfm' && (request.status === 'pending_wfm' || request.status === 'pending_tl')) {
        newStatus = 'approved'
        updates.wfm_approved_at = new Date().toISOString()
        if (request.status === 'pending_tl') {
          updates.tl_approved_at = new Date().toISOString()
        }
      }

      updates.status = newStatus

      const { error: updateError } = await supabase
        .from('leave_requests')
        .update(updates)
        .eq('id', id)

      if (updateError) throw updateError

      // Add system comment
      await addSystemComment(`Request approved by ${user.name} (${user.role.toUpperCase()})`)

      // Refresh the request
      await fetchRequestDetails()
    } catch (err) {
      console.error('Error approving request:', err)
      setError('Failed to approve request')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject() {
    if (!request || !user) return
    setSubmitting(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (updateError) throw updateError

      // Add system comment
      await addSystemComment(`Request rejected by ${user.name} (${user.role.toUpperCase()})`)

      // Refresh the request
      await fetchRequestDetails()
    } catch (err) {
      console.error('Error rejecting request:', err)
      setError('Failed to reject request')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAskForException() {
    if (!request || !user) return
    setRequestingException(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({ status: 'pending_tl' })
        .eq('id', id)

      if (updateError) throw updateError

      // Add system comment
      await addSystemComment('Exception requested - sent for TL approval')

      // Refresh the request
      await fetchRequestDetails()
    } catch (err) {
      console.error('Error requesting exception:', err)
      setError('Failed to request exception')
    } finally {
      setRequestingException(false)
    }
  }

  async function addSystemComment(content: string) {
    if (!user) return

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          request_id: id,
          request_type: 'leave',
          user_id: user.id,
          content,
          is_system: true
        })

      if (error) throw error
    } catch (err) {
      console.error('Error adding system comment:', err)
    }
  }

  async function handleAddComment() {
    if (!newComment.trim() || !user) return
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          request_id: id,
          request_type: 'leave',
          user_id: user.id,
          content: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      await fetchComments()
    } catch (err) {
      console.error('Error adding comment:', err)
      setError('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!request || !requester) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error || 'Request not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/leave')}
        className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
      >
        < Back
      </button>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Request Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Leave Request Details</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[request.status]}`}>
            {statusLabels[request.status]}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Requester</h3>
            <p className="text-lg text-gray-900">{requester.name}</p>
            <p className="text-sm text-gray-500">{requester.email}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Leave Type</h3>
            <p className="text-lg text-gray-900">{leaveTypeLabels[request.leave_type]}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Dates</h3>
            <p className="text-lg text-gray-900">
              {format(new Date(request.start_date), 'MMM d, yyyy')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-500">
              {calculateDays(request.start_date, request.end_date)} day(s)
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Submitted</h3>
            <p className="text-lg text-gray-900">
              {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>

          {request.notes && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Notes</h3>
              <p className="text-gray-900">{request.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          {canApprove() && (
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Approve'}
            </button>
          )}
          {canReject() && (
            <button
              onClick={handleReject}
              disabled={submitting}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Reject'}
            </button>
          )}
          {canAskForException() && (
            <button
              onClick={handleAskForException}
              disabled={requestingException}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {requestingException ? 'Requesting...' : 'Ask for Exception'}
            </button>
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

      {/* Approval Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
                Created on {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
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
                    Approved on {format(new Date(request.tl_approved_at), 'MMM d, yyyy h:mm a')}
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
                    Approved on {format(new Date(request.wfm_approved_at), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>

        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-gray-500">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-3 rounded-lg ${comment.is_system ? 'bg-gray-100 border-l-4 border-indigo-500' : 'bg-gray-50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-900">
                    {comment.is_system ? 'System' : 'User'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 border rounded-md px-3 py-2"
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <button
            onClick={handleAddComment}
            disabled={submitting || !newComment.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
