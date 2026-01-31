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
    } catch (error) {
      console.error('Error fetching request details:', error)
      setError('Failed to load request details')
    } finally {
      setLoading(false)
    }
  }

  async function createSystemComment(content: string) {
    if (!id || !user) return

    try {
      await supabase.from('comments').insert({
        request_id: id,
        request_type: 'leave',
        user_id: user.id,
        content,
        is_system: true
      })
    } catch (error) {
      console.error('Error creating system comment:', error)
    }
  }

  async function handleApprove() {
    if (!request || !user) return

    setSubmitting(true)
    setError('')

    try {
      const oldStatus = request.status
      let newStatus: LeaveRequestStatus
      let updateData: Partial<LeaveRequest> = {}

      if (user.role === 'tl' && request.status === 'pending_tl') {
        newStatus = 'pending_wfm'
        updateData = {
          status: newStatus,
          tl_approved_at: new Date().toISOString()
        }
      } else if (user.role === 'wfm' && (request.status === 'pending_wfm' || request.status === 'pending_tl')) {
        newStatus = 'approved'
        updateData = {
          status: newStatus,
          wfm_approved_at: new Date().toISOString()
        }
        if (request.status === 'pending_tl') {
          updateData.tl_approved_at = new Date().toISOString()
        }
      } else {
        throw new Error('Cannot approve this request')
      }

      const { error: updateError } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      // Create system comment
      await createSystemComment(
        `System: ${user.name} approved. Status changed from ${statusLabels[oldStatus]} to ${statusLabels[newStatus]}`
      )

      await fetchRequestDetails()
    } catch (error) {
      console.error('Error approving request:', error)
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
      const oldStatus = request.status
      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (updateError) throw updateError

      // Create system comment
      await createSystemComment(
        `System: ${user.name} rejected. Status changed from ${statusLabels[oldStatus]} to Rejected`
      )

      await fetchRequestDetails()
    } catch (error) {
      console.error('Error rejecting request:', error)
      setError('Failed to reject request')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRevoke() {
    if (!request || !user) return

    setSubmitting(true)
    setError('')

    try {
      const oldStatus = request.status
      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({
          status: 'pending_tl',
          tl_approved_at: null,
          wfm_approved_at: null
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Create system comment
      await createSystemComment(
        `System: ${user.name} revoked decision. Status reset from ${statusLabels[oldStatus]} to Pending TL Approval`
      )

      await fetchRequestDetails()
    } catch (error) {
      console.error('Error revoking decision:', error)
      setError('Failed to revoke decision')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || !user || !id) return

    setSubmitting(true)
    try {
      const { error: commentError } = await supabase.from('comments').insert({
        request_id: id,
        request_type: 'leave',
        user_id: user.id,
        content: newComment.trim(),
        is_system: false
      })

      if (commentError) throw commentError

      setNewComment('')
      await fetchRequestDetails()
    } catch (error) {
      console.error('Error adding comment:', error)
      setError('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  function canApprove(): boolean {
    if (!user || !request) return false
    if (user.role === 'tl' && request.status === 'pending_tl') return true
    if (user.role === 'wfm' && (request.status === 'pending_wfm' || request.status === 'pending_tl')) return true
    return false
  }

  function canReject(): boolean {
    if (!user || !request) return false
    if (user.role === 'tl' && request.status === 'pending_tl') return true
    if (user.role === 'wfm' && (request.status === 'pending_wfm' || request.status === 'pending_tl')) return true
    return false
  }

  function canRevoke(): boolean {
    if (!user || !request) return false
    if (user.role !== 'wfm') return false
    if (request.status === 'approved' || request.status === 'rejected' || request.status === 'pending_wfm') return true
    return false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!request || !requester) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Request not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Leave Request Details</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[request.status]}`}>
          {statusLabels[request.status]}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Request Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Requester</label>
            <p className="font-medium text-gray-900">{requester.name}</p>
            <p className="text-sm text-gray-500">{requester.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Leave Type</label>
            <p className="font-medium text-gray-900">{leaveTypeLabels[request.leave_type]}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Start Date</label>
            <p className="font-medium text-gray-900">{format(new Date(request.start_date), 'MMM d, yyyy')}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">End Date</label>
            <p className="font-medium text-gray-900">{format(new Date(request.end_date), 'MMM d, yyyy')}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Created</label>
            <p className="font-medium text-gray-900">{format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}</p>
          </div>
          {request.notes && (
            <div className="md:col-span-2">
              <label className="text-sm text-gray-500">Notes</label>
              <p className="font-medium text-gray-900">{request.notes}</p>
            </div>
          )}
        </div>
      </div>

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
                Created on {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>

          {/* TL Approval Step */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              request.tl_approved_at ? 'bg-green-100 text-green-600' :
              request.status === 'rejected' ? 'bg-red-100 text-red-600' :
              request.status === 'pending_tl' ? 'bg-yellow-100 text-yellow-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              {request.tl_approved_at ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : request.status === 'rejected' && !request.tl_approved_at ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : request.status === 'pending_tl' ? (
                <span className="text-sm font-bold">...</span>
              ) : (
                <span className="text-sm font-bold">-</span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">Team Lead Approval</p>
              {request.tl_approved_at ? (
                <p className="text-sm text-gray-500">
                  Approved on {format(new Date(request.tl_approved_at), 'MMM d, yyyy h:mm a')}
                </p>
              ) : request.status === 'pending_tl' ? (
                <p className="text-sm text-yellow-600">Awaiting approval</p>
              ) : request.status === 'rejected' && !request.tl_approved_at ? (
                <p className="text-sm text-red-600">Rejected</p>
              ) : (
                <p className="text-sm text-gray-500">Skipped</p>
              )}
            </div>
          </div>

          {/* WFM Approval Step */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              request.wfm_approved_at ? 'bg-green-100 text-green-600' :
              request.status === 'rejected' && request.tl_approved_at ? 'bg-red-100 text-red-600' :
              request.status === 'pending_wfm' ? 'bg-yellow-100 text-yellow-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              {request.wfm_approved_at ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : request.status === 'rejected' && request.tl_approved_at ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : request.status === 'pending_wfm' ? (
                <span className="text-sm font-bold">...</span>
              ) : (
                <span className="text-sm font-bold">-</span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">WFM Approval</p>
              {request.wfm_approved_at ? (
                <p className="text-sm text-gray-500">
                  Approved on {format(new Date(request.wfm_approved_at), 'MMM d, yyyy h:mm a')}
                </p>
              ) : request.status === 'pending_wfm' ? (
                <p className="text-sm text-yellow-600">Awaiting approval</p>
              ) : request.status === 'rejected' && request.tl_approved_at ? (
                <p className="text-sm text-red-600">Rejected</p>
              ) : (
                <p className="text-sm text-gray-500">Pending</p>
              )}
            </div>
          </div>
        </div>
      </div>

      
