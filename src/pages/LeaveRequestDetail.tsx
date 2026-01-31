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
  rejected: 'Rejected'
}

const statusColors: Record<LeaveRequestStatus, string> = {
  pending_tl: 'bg-yellow-100 text-yellow-800',
  pending_wfm: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
}

const roleColors: Record<string, string> = {
  agent: 'bg-gray-100 text-gray-800',
  tl: 'bg-purple-100 text-purple-800',
  wfm: 'bg-indigo-100 text-indigo-800'
}

export default function LeaveRequestDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [request, setRequest] = useState<LeaveRequest | null>(null)
  const [requester, setRequester] = useState<User | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchRequestDetails()
    }
  }, [id])

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

      // Fetch requester info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', requestData.user_id)
        .single()

      if (userError) throw userError
      setRequester(userData)

      // Fetch comments with user info
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(*)
        `)
        .eq('request_id', id)
        .eq('request_type', 'leave')
        .order('created_at', { ascending: true })

      if (commentsError) throw commentsError
      setComments(commentsData || [])
    } catch (err) {
      console.error('Error fetching request details:', err)
      setError('Failed to load request details')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (!request || !user) return
    setSubmitting(true)

    try {
      const now = new Date().toISOString()
      let updateData: Partial<LeaveRequest> = {}

      if (user.role === 'tl' && request.status === 'pending_tl') {
        // Check WFM auto-approve setting
        const { data: settingData } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'wfm_auto_approve')
          .single()

        const autoApprove = settingData?.value === 'true'

        if (autoApprove) {
          updateData = {
            status: 'approved',
            tl_approved_at: now,
            wfm_approved_at: now
          }
        } else {
          updateData = {
            status: 'pending_wfm',
            tl_approved_at: now
          }
        }
      } else if (user.role === 'wfm' && request.status === 'pending_wfm') {
        updateData = {
          status: 'approved',
          wfm_approved_at: now
        }
      }

      const { error: updateError } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', request.id)

      if (updateError) throw updateError
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

    try {
      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id)

      if (updateError) throw updateError
      await fetchRequestDetails()
    } catch (err) {
      console.error('Error rejecting request:', err)
      setError('Failed to reject request')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || !user || !request) return
    setSubmitting(true)

    try {
      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          request_id: request.id,
          request_type: 'leave',
          user_id: user.id,
          content: newComment.trim()
        })

      if (commentError) throw commentError
      setNewComment('')
      await fetchRequestDetails()
    } catch (err) {
      console.error('Error adding comment:', err)
      setError('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  function canComment(): boolean {
    if (!user || !request) return false
    // Requester, TL, or WFM can comment
    return user.id === request.user_id || user.role === 'tl' || user.role === 'wfm'
  }

  function canApprove(): boolean {
    if (!user || !request) return false
    if (user.role === 'tl' && request.status === 'pending_tl') return true
    if (user.role === 'wfm' && request.status === 'pending_wfm') return true
    return false
  }

  function getTimelineSteps() {
    const steps = [
      { label: 'Created', completed: true, date: request?.created_at },
      { label: 'TL Approval', completed: !!request?.tl_approved_at || request?.status === 'rejected', date: request?.tl_approved_at },
      { label: 'WFM Approval', completed: !!request?.wfm_approved_at || request?.status === 'rejected', date: request?.wfm_approved_at },
      { label: request?.status === 'rejected' ? 'Rejected' : 'Approved', completed: request?.status === 'approved' || request?.status === 'rejected', date: request?.wfm_approved_at }
    ]
    return steps
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !request || !requester) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Request not found'}</p>
        <button
          onClick={() => navigate('/leave-requests')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to Leave Requests
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/leave-requests')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            ← Back to Leave Requests
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Leave Request Details</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[request.status]}`}>
          {statusLabels[request.status]}
        </span>
      </div>

      {/* Request Info Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Request Information</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Requested By</dt>
            <dd className="mt-1 text-sm text-gray-900">{requester.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Leave Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{leaveTypeLabels[request.leave_type]}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Start Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{format(new Date(request.start_date), 'MMM d, yyyy')}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">End Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{format(new Date(request.end_date), 'MMM d, yyyy')}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">{format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900">{statusLabels[request.status]}</dd>
          </div>
          {request.notes && (
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900">{request.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Status Timeline */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Approval Progress</h2>
        <div className="flex items-center justify-between">
          {getTimelineSteps().map((step, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.completed
                  ? request.status === 'rejected' && index === 3
                    ? 'bg-red-500 text-white'
                    : 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step.completed ? (
                  request.status === 'rejected' && index === 3 ? '✕' : '✓'
                ) : (
                  index + 1
                )}
              </div>
              <span className="mt-2 text-xs text-gray-600 text-center">{step.label}</span>
              {step.date && (
                <span className="text-xs text-gray-400">{format(new Date(step.date), 'MMM d')}</span>
              )}
              {index < 3 && (
                <div className={`absolute h-1 w-full top-4 left-1/2 ${
                  getTimelineSteps()[index + 1]?.completed ? 'bg-green-500' : 'bg-gray-200'
                }`} style={{ display: 'none' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Approval Buttons */}
      {canApprove() && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="flex space-x-4">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={handleReject}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Comments</h2>
        
        {/* Comments List */}
        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm text-gray-900">
                    {comment.user?.name || 'Unknown User'}
                  </span>
                  {comment.user?.role && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[comment.user.role]}`}>
                      {comment.user.role.toUpperCase()}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        {canComment() && (
          <form onSubmit={handleAddComment} className="mt-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Add Comment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
