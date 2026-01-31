import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { SwapRequest, User, Shift, Comment, SwapRequestStatus, ShiftType } from '../types'
import { format } from 'date-fns'

const statusLabels: Record<SwapRequestStatus, string> = {
  pending_acceptance: 'Pending Acceptance',
  pending_tl: 'Pending TL Approval',
  pending_wfm: 'Pending WFM Approval',
  approved: 'Approved',
  rejected: 'Rejected'
}

const statusColors: Record<SwapRequestStatus, string> = {
  pending_acceptance: 'bg-orange-100 text-orange-800',
  pending_tl: 'bg-yellow-100 text-yellow-800',
  pending_wfm: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
}

const shiftLabels: Record<ShiftType, string> = {
  AM: 'Morning (AM)',
  PM: 'Afternoon (PM)',
  BET: 'Between (BET)',
  OFF: 'Day Off'
}

const roleColors: Record<string, string> = {
  agent: 'bg-gray-100 text-gray-800',
  tl: 'bg-purple-100 text-purple-800',
  wfm: 'bg-indigo-100 text-indigo-800'
}

interface ShiftWithUser extends Shift {
  user?: User
}

export default function SwapRequestDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [request, setRequest] = useState<SwapRequest | null>(null)
  const [requester, setRequester] = useState<User | null>(null)
  const [targetUser, setTargetUser] = useState<User | null>(null)
  const [requesterShift, setRequesterShift] = useState<ShiftWithUser | null>(null)
  const [targetShift, setTargetShift] = useState<ShiftWithUser | null>(null)
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
      // Fetch swap request
      const { data: requestData, error: requestError } = await supabase
        .from('swap_requests')
        .select('*')
        .eq('id', id)
        .single()

      if (requestError) throw requestError
      setRequest(requestData)

      // Fetch requester info
      const { data: requesterData, error: requesterError } = await supabase
        .from('users')
        .select('*')
        .eq('id', requestData.requester_id)
        .single()

      if (requesterError) throw requesterError
      setRequester(requesterData)

      // Fetch target user info
      const { data: targetData, error: targetError } = await supabase
        .from('users')
        .select('*')
        .eq('id', requestData.target_user_id)
        .single()

      if (targetError) throw targetError
      setTargetUser(targetData)

      // Fetch requester's shift
      const { data: requesterShiftData, error: reqShiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', requestData.requester_shift_id)
        .single()

      if (reqShiftError) throw reqShiftError
      setRequesterShift(requesterShiftData)

      // Fetch target's shift
      const { data: targetShiftData, error: targetShiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', requestData.target_shift_id)
        .single()

      if (targetShiftError) throw targetShiftError
      setTargetShift(targetShiftData)

      // Fetch comments with user info
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(*)
        `)
        .eq('request_id', id)
        .eq('request_type', 'swap')
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

  async function handleAccept() {
    if (!request || !user) return
    setSubmitting(true)

    try {
      const { error: updateError } = await supabase
        .from('swap_requests')
        .update({ status: 'pending_tl' })
        .eq('id', request.id)

      if (updateError) throw updateError
      await fetchRequestDetails()
    } catch (err) {
      console.error('Error accepting request:', err)
      setError('Failed to accept request')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDecline() {
    if (!request || !user) return
    setSubmitting(true)

    try {
      const { error: updateError } = await supabase
        .from('swap_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id)

      if (updateError) throw updateError
      await fetchRequestDetails()
    } catch (err) {
      console.error('Error declining request:', err)
      setError('Failed to decline request')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApprove() {
    if (!request || !user) return
    setSubmitting(true)

    try {
      const now = new Date().toISOString()
      let updateData: Partial<SwapRequest> = {}

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
        .from('swap_requests')
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
        .from('swap_requests')
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

  async function handleRevoke() {
    if (!request || !user || user.role !== 'wfm') return
    setSubmitting(true)

    try {
      // Determine what status to reset to
      // If it was rejected before acceptance, reset to pending_acceptance
      // Otherwise reset to pending_tl
      const wasRejectedBeforeAcceptance = request.status === 'rejected' && !request.tl_approved_at && !request.wfm_approved_at
      const newStatus = wasRejectedBeforeAcceptance ? 'pending_acceptance' : 'pending_tl'
      
      const { error: updateError } = await supabase
        .from('swap_requests')
        .update({ 
          status: newStatus,
          tl_approved_at: null,
          wfm_approved_at: null
        })
        .eq('id', request.id)

      if (updateError) throw updateError
      await fetchRequestDetails()
    } catch (err) {
      console.error('Error revoking request:', err)
      setError('Failed to revoke request')
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
          request_type: 'swap',
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
    // Requester, target user, TL, or WFM can comment
    return user.id === request.requester_id || 
           user.id === request.target_user_id || 
           user.role === 'tl' || 
           user.role === 'wfm'
  }

  function canAcceptDecline(): boolean {
    if (!user || !request) return false
    return user.id === request.target_user_id && request.status === 'pending_acceptance'
  }

  function canApprove(): boolean {
    if (!user || !request) return false
    if (user.role === 'tl' && request.status === 'pending_tl') return true
    if (user.role === 'wfm' && request.status === 'pending_wfm') return true
    return false
  }

  function getTimelineSteps() {
    const status = request?.status
    const accepted = status !== 'pending_acceptance'
    const tlApproved = !!request?.tl_approved_at
    const wfmApproved = !!request?.wfm_approved_at
    
    // Determine rejection stage
    const rejectedAtAcceptance = status === 'rejected' && !accepted
    const tlRejected = status === 'rejected' && accepted && !tlApproved
    const wfmRejected = status === 'rejected' && accepted && tlApproved && !wfmApproved
    
    const steps = [
      { 
        label: 'Created', 
        completed: true, 
        status: 'completed' as const,
        date: request?.created_at 
      },
      { 
        label: rejectedAtAcceptance ? 'Declined' : accepted ? 'Accepted' : 'Pending Acceptance', 
        completed: accepted || rejectedAtAcceptance,
        status: rejectedAtAcceptance ? 'rejected' as const : accepted ? 'completed' as const : 'pending' as const,
        date: accepted ? request?.created_at : null 
      },
      { 
        label: rejectedAtAcceptance ? 'Skipped' : tlRejected ? 'Rejected by TL' : tlApproved ? 'Approved by TL' : 'TL Approval', 
        completed: tlApproved || tlRejected,
        status: rejectedAtAcceptance ? 'skipped' as const : tlRejected ? 'rejected' as const : tlApproved ? 'completed' as const : status === 'pending_tl' ? 'pending' as const : 'waiting' as const,
        date: request?.tl_approved_at 
      },
      { 
        label: (rejectedAtAcceptance || tlRejected) ? 'Skipped' : wfmRejected ? 'Rejected by WFM' : wfmApproved ? 'Approved by WFM' : 'WFM Approval', 
        completed: wfmApproved || wfmRejected,
        status: (rejectedAtAcceptance || tlRejected) ? 'skipped' as const : wfmRejected ? 'rejected' as const : wfmApproved ? 'completed' as const : status === 'pending_wfm' ? 'pending' as const : 'waiting' as const,
        date: request?.wfm_approved_at 
      },
      { 
        label: status === 'rejected' ? 'Rejected' : status === 'approved' ? 'Approved' : 'Final Status', 
        completed: status === 'approved' || status === 'rejected',
        status: status === 'rejected' ? 'rejected' as const : status === 'approved' ? 'completed' as const : 'waiting' as const,
        date: status === 'approved' ? request?.wfm_approved_at : status === 'rejected' ? (wfmRejected ? request?.wfm_approved_at : tlRejected ? request?.tl_approved_at : null) : null
      }
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

  if (error || !request || !requester || !targetUser) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Request not found'}</p>
        <button
          onClick={() => navigate('/swap-requests')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to Swap Requests
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
            onClick={() => navigate('/swap-requests')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            â Back to Swap Requests
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Swap Request Details</h1>
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
            <dt className="text-sm font-medium text-gray-500">Requester</dt>
            <dd className="mt-1 text-sm text-gray-900">{requester.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Target User</dt>
            <dd className="mt-1 text-sm text-gray-900">{targetUser.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Requester's Shift</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {requesterShift && (
                <>
                  {format(new Date(requesterShift.date), 'MMM d, yyyy')} - {shiftLabels[requesterShift.shift_type]}
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Target's Shift</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {targetShift && (
                <>
                  {format(new Date(targetShift.date), 'MMM d, yyyy')} - {shiftLabels[targetShift.shift_type]}
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">{format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900">{statusLabels[request.status]}</dd>
          </div>
        </dl>
      </div>

      {/* Status Timeline */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Approval Progress</h2>
        <div className="flex items-center justify-between">
          {getTimelineSteps().map((step, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.status === 'completed' ? 'bg-green-500 text-white' :
                step.status === 'rejected' ? 'bg-red-500 text-white' :
                step.status === 'pending' ? 'bg-yellow-400 text-white' :
                step.status === 'skipped' ? 'bg-gray-300 text-gray-500' :
                'bg-gray-200 text-gray-500'
              }`}>
                {step.status === 'completed' ? 'â' :
                 step.status === 'rejected' ? 'â' :
                 step.status === 'skipped' ? 'â' :
                 step.status === 'pending' ? '...' :
                 index + 1}
              </div>
              <span className={`mt-2 text-xs text-center ${
                step.status === 'skipped' ? 'text-gray-400' : 'text-gray-600'
              }`}>{step.label}</span>
              {step.date && step.status !== 'skipped' && (
                <span className="text-xs text-gray-400">{format(new Date(step.date), 'MMM d')}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Accept/Decline Buttons for Target User */}
      {canAcceptDecline() && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Respond to Request</h2>
          <p className="text-sm text-gray-600 mb-4">
            {requester.name} wants to swap shifts with you. Do you accept this swap?
          </p>
          <div className="flex space-x-4">
            <button
              onClick={handleAccept}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={handleDecline}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Approval Buttons for TL/WFM */}
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
