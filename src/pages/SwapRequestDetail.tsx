import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { SwapRequest, User, Shift, Comment, SwapRequestStatus, ShiftType } from '../types'
import { format } from 'date-fns'
import { getStatusColor, getStatusLabel, SHIFT_DESCRIPTIONS } from '../lib/designSystem'

interface ShiftWithUser extends Shift {
  user?: User
  original_user_id?: string
  swapped_with_user_id?: string
}

interface CommentWithSystem extends Comment {
  is_system?: boolean
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
      // Fetch swap request
      const { data: requestData, error: requestError } = await supabase
        .from('swap_requests')
        .select('*, requester_original_date, requester_original_shift_type, target_original_date, target_original_shift_type, requester_original_shift_type_on_target_date, target_original_shift_type_on_requester_date')
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
      const { data: requesterShiftData, error: requesterShiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', requestData.requester_shift_id)
        .single()

      if (requesterShiftError) throw requesterShiftError
      setRequesterShift({ ...requesterShiftData, user: requesterData })

      // Fetch target's shift
      const { data: targetShiftData, error: targetShiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', requestData.target_shift_id)
        .single()

      if (targetShiftError) throw targetShiftError
      setTargetShift({ ...targetShiftData, user: targetData })

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
        request_type: 'swap',
        user_id: user.id,
        content,
        is_system: true
      })
    } catch (error) {
      console.error('Error creating system comment:', error)
    }
  }

  async function handleAccept() {
    if (!request || !user) return

    setSubmitting(true)
    setError('')

    try {
      const oldStatus = request.status
      const { error: updateError } = await supabase
        .from('swap_requests')
        .update({ status: 'pending_tl' })
        .eq('id', id)

      if (updateError) throw updateError

      // Create system comment
      await createSystemComment(
        `${user.name} accepted the swap request. Status changed from ${getStatusLabel(oldStatus)} to Pending TL Approval`
      )

      await fetchRequestDetails()
    } catch (error) {
      console.error('Error accepting request:', error)
      setError('Failed to accept request')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDecline() {
    if (!request || !user) return

    setSubmitting(true)
    setError('')

    try {
      const oldStatus = request.status
      const { error: updateError } = await supabase
        .from('swap_requests')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (updateError) throw updateError

      // Create system comment
      await createSystemComment(
        `${user.name} declined the swap request. Status changed from ${getStatusLabel(oldStatus)} to Rejected`
      )

      await fetchRequestDetails()
    } catch (error) {
      console.error('Error declining request:', error)
      setError('Failed to decline request')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApprove() {
    if (!request || !user) return

    setSubmitting(true)
    setError('')

    try {
      const oldStatus = request.status
      let newStatus: SwapRequestStatus
      let updateData: Partial<SwapRequest> = {}

      if (user.role === 'tl' && request.status === 'pending_tl') {
        // Check if auto-approve is enabled
        const { data: autoApproveSetting } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'wfm_auto_approve')
          .maybeSingle()

        const autoApproveEnabled = autoApproveSetting?.value === 'true'

        if (autoApproveEnabled) {
          // Auto-approve: skip WFM and go straight to approved
          newStatus = 'approved'
          updateData = {
            status: newStatus,
            tl_approved_at: new Date().toISOString(),
            wfm_approved_at: new Date().toISOString() // Mark as auto-approved
          }
        } else {
          // Normal flow: send to WFM for approval
          newStatus = 'pending_wfm'
          updateData = {
            status: newStatus,
            tl_approved_at: new Date().toISOString()
          }
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
        .from('swap_requests')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      // If fully approved, execute the swap across ALL 4 shift records
      if (newStatus === 'approved' && requesterShift && targetShift && request) {
        // A swap means both users exchange their shift types on BOTH dates
        //
        // Example:
        // Before: Agent X: 2-Feb (AM), 7-Feb (OFF) | Agent Y: 2-Feb (PM), 7-Feb (PM)
        // Swapping "Agent X's 2-Feb" with "Agent Y's 7-Feb"
        // After:  Agent X: 2-Feb (PM), 7-Feb (PM) | Agent Y: 2-Feb (AM), 7-Feb (OFF)
        //
        // We need to:
        // 1. Get all 4 shifts (both users on both dates)
        // 2. Swap shift_types for both users on both dates

        const requesterDate = requesterShift.date
        const targetDate = targetShift.date
        const requesterId = request.requester_id
        const targetUserId = request.target_user_id

        // Get Agent Y's shift on requester's date (2-Feb)
        const { data: targetOnRequesterDate } = await supabase
          .from('shifts')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('date', requesterDate)
          .single()

        // Get Agent X's shift on target's date (7-Feb)
        const { data: requesterOnTargetDate } = await supabase
          .from('shifts')
          .select('*')
          .eq('user_id', requesterId)
          .eq('date', targetDate)
          .single()

        // Store original shift types
        const requesterShiftTypeOnReqDate = requesterShift.shift_type // Agent X on 2-Feb
        const targetShiftTypeOnTgtDate = targetShift.shift_type // Agent Y on 7-Feb
        const targetShiftTypeOnReqDate = targetOnRequesterDate?.shift_type // Agent Y on 2-Feb
        const requesterShiftTypeOnTgtDate = requesterOnTargetDate?.shift_type // Agent X on 7-Feb

        // Update 1: Agent X on requester date (2-Feb) gets Agent Y's shift type from that date
        if (targetShiftTypeOnReqDate) {
          const { error } = await supabase
            .from('shifts')
            .update({ shift_type: targetShiftTypeOnReqDate })
            .eq('id', requesterShift.id)
          if (error) throw error
        }

        // Update 2: Agent Y on requester date (2-Feb) gets Agent X's shift type from that date
        if (targetOnRequesterDate) {
          const { error } = await supabase
            .from('shifts')
            .update({ shift_type: requesterShiftTypeOnReqDate })
            .eq('id', targetOnRequesterDate.id)
          if (error) throw error
        }

        // Update 3: Agent X on target date (7-Feb) gets Agent Y's shift type from that date
        if (requesterOnTargetDate && targetShiftTypeOnTgtDate) {
          const { error } = await supabase
            .from('shifts')
            .update({ shift_type: targetShiftTypeOnTgtDate })
            .eq('id', requesterOnTargetDate.id)
          if (error) throw error
        }

        // Update 4: Agent Y on target date (7-Feb) gets Agent X's shift type from that date
        if (requesterShiftTypeOnTgtDate) {
          const { error } = await supabase
            .from('shifts')
            .update({ shift_type: requesterShiftTypeOnTgtDate })
            .eq('id', targetShift.id)
          if (error) throw error
        }
      }

      // Create system comment with appropriate message
      if (user.role === 'tl' && newStatus === 'approved') {
        await createSystemComment(
          `${user.name} approved (auto-approved by system). Status changed from ${getStatusLabel(oldStatus)} to ${getStatusLabel(newStatus)}`
        )
      } else {
        await createSystemComment(
          `${user.name} approved. Status changed from ${getStatusLabel(oldStatus)} to ${getStatusLabel(newStatus)}`
        )
      }

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
        .from('swap_requests')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (updateError) throw updateError

      // Create system comment
      await createSystemComment(
        `${user.name} rejected. Status changed from ${getStatusLabel(oldStatus)} to Rejected`
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

      // If was approved, need to reverse the shift swap using stored original values
      if (oldStatus === 'approved' && request.requester_original_date && request.target_original_date) {
        const requesterDate = request.requester_original_date
        const targetDate = request.target_original_date
        const requesterId = request.requester_id
        const targetUserId = request.target_user_id

        // Find all 4 shift records
        const { data: reqOnReqDate } = await supabase
          .from('shifts')
          .select('*')
          .eq('user_id', requesterId)
          .eq('date', requesterDate)
          .single()

        const { data: reqOnTgtDate } = await supabase
          .from('shifts')
          .select('*')
          .eq('user_id', requesterId)
          .eq('date', targetDate)
          .single()

        const { data: tgtOnReqDate } = await supabase
          .from('shifts')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('date', requesterDate)
          .single()

        const { data: tgtOnTgtDate } = await supabase
          .from('shifts')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('date', targetDate)
          .single()

        // Restore all 4 shifts to their original shift_types
        // 1. Requester on requester_date -> requester_original_shift_type
        if (reqOnReqDate && request.requester_original_shift_type) {
          const { error } = await supabase
            .from('shifts')
            .update({ shift_type: request.requester_original_shift_type })
            .eq('id', reqOnReqDate.id)
          if (error) throw error
        }

        // 2. Requester on target_date -> requester_original_shift_type_on_target_date
        if (reqOnTgtDate && request.requester_original_shift_type_on_target_date) {
          const { error } = await supabase
            .from('shifts')
            .update({ shift_type: request.requester_original_shift_type_on_target_date })
            .eq('id', reqOnTgtDate.id)
          if (error) throw error
        }

        // 3. Target on requester_date -> target_original_shift_type_on_requester_date
        if (tgtOnReqDate && request.target_original_shift_type_on_requester_date) {
          const { error } = await supabase
            .from('shifts')
            .update({ shift_type: request.target_original_shift_type_on_requester_date })
            .eq('id', tgtOnReqDate.id)
          if (error) throw error
        }

        // 4. Target on target_date -> target_original_shift_type
        if (tgtOnTgtDate && request.target_original_shift_type) {
          const { error } = await supabase
            .from('shifts')
            .update({ shift_type: request.target_original_shift_type })
            .eq('id', tgtOnTgtDate.id)
          if (error) throw error
        }
      }

      const { error: updateError } = await supabase
        .from('swap_requests')
        .update({
          status: 'pending_tl',
          tl_approved_at: null,
          wfm_approved_at: null
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Create system comment
      await createSystemComment(
        `${user.name} revoked decision. Status reset from ${getStatusLabel(oldStatus)} to Pending TL Approval. All 4 shifts restored to original values.`
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
        request_type: 'swap',
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

  function canAcceptOrDecline(): boolean {
    if (!user || !request) return false
    return user.id === request.target_user_id && request.status === 'pending_acceptance'
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

  if (!request || !requester || !targetUser) {
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
          <h1 className="text-2xl font-bold text-gray-900">Swap Request Details</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
          {getStatusLabel(request.status)}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Swap Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Swap Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Requester's Shifts */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Requester's Shifts</h3>
            <p className="text-sm text-gray-500 mb-3">{requester.name}</p>
            
            {/* Date 1: requester_original_date */}
            {request.requester_original_date && (
              <div className="mb-3">
                <p className="font-medium">{format(new Date(request.requester_original_date), 'MMM d, yyyy')}</p>
                <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {request.requester_original_shift_type ? SHIFT_DESCRIPTIONS[request.requester_original_shift_type as ShiftType] : 'Unknown'}
                </span>
              </div>
            )}
            
            {/* Date 2: target_original_date */}
            {request.target_original_date && (
              <div>
                <p className="font-medium">{format(new Date(request.target_original_date), 'MMM d, yyyy')}</p>
                <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {request.requester_original_shift_type_on_target_date ? SHIFT_DESCRIPTIONS[request.requester_original_shift_type_on_target_date as ShiftType] : 'Unknown'}
                </span>
              </div>
            )}
          </div>

          {/* Target's Shifts */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Target's Shifts</h3>
            <p className="text-sm text-gray-500 mb-3">{targetUser.name}</p>
            
            {/* Date 1: requester_original_date */}
            {request.requester_original_date && (
              <div className="mb-3">
                <p className="font-medium">{format(new Date(request.requester_original_date), 'MMM d, yyyy')}</p>
                <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                  {request.target_original_shift_type_on_requester_date ? SHIFT_DESCRIPTIONS[request.target_original_shift_type_on_requester_date as ShiftType] : 'Unknown'}
                </span>
              </div>
            )}
            
            {/* Date 2: target_original_date */}
            {request.target_original_date && (
              <div>
                <p className="font-medium">{format(new Date(request.target_original_date), 'MMM d, yyyy')}</p>
                <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                  {request.target_original_shift_type ? SHIFT_DESCRIPTIONS[request.target_original_shift_type as ShiftType] : 'Unknown'}
                </span>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Created on {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
        </p>
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

          {/* Target Acceptance */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              request.status !== 'pending_acceptance' && request.status !== 'rejected' ? 'bg-green-100 text-green-600' :
              request.status === 'rejected' ? 'bg-red-100 text-red-600' :
              'bg-yellow-100 text-yellow-600'
            }`}>
              {request.status !== 'pending_acceptance' && request.status !== 'rejected' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : request.status === 'rejected' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <span className="text-sm font-bold">...</span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">Target Acceptance ({targetUser.name})</p>
              {request.status === 'pending_acceptance' ? (
                <p className="text-sm text-yellow-600">Awaiting acceptance</p>
              ) : request.status === 'rejected' && !request.tl_approved_at ? (
                <p className="text-sm text-red-600">Declined</p>
              ) : (
                <p className="text-sm text-green-600">Accepted</p>
              )}
            </div>
          </div>

          {/* TL Approval */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              request.tl_approved_at ? 'bg-green-100 text-green-600' :
              request.status === 'rejected' && !request.tl_approved_at ? 'bg-red-100 text-red-600' :
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
              ) : request.status === 'rejected' && !request.tl_approved_at  ? (
                <p className="text-sm text-red-600">Rejected</p>
              ) : (
                <p className="text-sm text-gray-500">Pending</p>
              )}
            </div>
          </div>

          {/* WFM Approval */}
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

      {/* Action Buttons */}
      {(canAcceptOrDecline() || canApprove() || canReject() || canRevoke()) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {canAcceptOrDecline() && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing...' : 'Accept Swap'}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing...' : 'Decline Swap'}
                </button>
              </>
            )}
            {canApprove() && (
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Approve'}
              </button>
            )}
            {canReject() && (
              <button
                onClick={handleReject}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Reject'}
              </button>
            )}
            {canRevoke() && (
              <button
                onClick={handleRevoke}
                disabled={submitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Revoke'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>
        
        {/* Comment List */}
        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={`p-3 rounded-lg ${comment.is_system ? 'bg-gray-100' : 'bg-blue-50'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-blue-800">
                    {comment.is_system ? 'System' : comment.user?.name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-gray-800">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleAddComment(e); }} className="flex gap-2">
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
