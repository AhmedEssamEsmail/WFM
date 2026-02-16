import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useShiftConfigurations } from '../../hooks/useShiftConfigurations'
import { SwapRequest, User, Shift, Comment, SwapRequestStatus, ShiftType } from '../../types'
import { getStatusColor, getStatusLabel } from '../../lib/designSystem'
import { swapRequestsService, commentsService, settingsService, authService, shiftsService } from '../../services'
import { formatDate, formatDateTime } from '../../utils'
import { ERROR_MESSAGES } from '../../constants'
import { handleDatabaseError } from '../../lib/errorHandler'
import { ConcurrencyError, SwapExecutionError } from '../../types/errors'

interface ShiftWithUser extends Shift {
  user?: User
  original_user_id?: string
  swapped_with_user_id?: string
}

interface CommentWithSystem extends Comment {
  is_system?: boolean
  user?: User
  users?: User
}

export default function SwapRequestDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getShiftDisplay } = useShiftConfigurations()
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
  const [showRefreshButton, setShowRefreshButton] = useState(false)

  useEffect(() => {
    if (id) {
      fetchRequestDetails()
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchRequestDetails() {
    try {
      // Fetch swap request with all details
      const requestData = await swapRequestsService.getSwapRequestById(id!)
      setRequest(requestData)

      // Fetch requester info
      const requesterData = await authService.getUserProfile(requestData.requester_id)
      setRequester(requesterData)

      // Fetch target user info
      const targetData = await authService.getUserProfile(requestData.target_user_id)
      setTargetUser(targetData)

      // Fetch requester's shift
      const requesterShiftData = await shiftsService.getShiftById(requestData.requester_shift_id)
      setRequesterShift({ ...requesterShiftData, user: requesterData })

      // Fetch target's shift
      const targetShiftData = await shiftsService.getShiftById(requestData.target_shift_id)
      setTargetShift({ ...targetShiftData, user: targetData })

      // Fetch comments
      const commentsData = await commentsService.getComments(id!, 'swap')
      setComments(commentsData as CommentWithSystem[])
    } catch (error) {
      handleDatabaseError(error, 'fetch request details')
      setError(ERROR_MESSAGES.NOT_FOUND)
    } finally {
      setLoading(false)
    }
  }

  async function createSystemComment(content: string) {
    if (!id || !user) return

    try {
      await commentsService.createSystemComment(id, 'swap', content, user.id)
    } catch (error) {
      handleDatabaseError(error, 'create system comment')
    }
  }

  async function handleAccept() {
    if (!request || !user) return

    setSubmitting(true)
    setError('')
    setShowRefreshButton(false)

    try {
      const oldStatus = request.status
      await swapRequestsService.updateSwapRequestStatus(id!, 'pending_tl', undefined, oldStatus)

      // Create system comment
      await createSystemComment(
        `${user.name} accepted the swap request. Status changed from ${getStatusLabel(oldStatus)} to Pending TL Approval`
      )

      await fetchRequestDetails()
    } catch (error) {
      if (error instanceof ConcurrencyError) {
        setError('This request was modified by someone else. Please refresh to see the latest version.')
        setShowRefreshButton(true)
      } else {
        handleDatabaseError(error, 'accept request')
        setError(ERROR_MESSAGES.SERVER)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDecline() {
    if (!request || !user) return

    setSubmitting(true)
    setError('')
    setShowRefreshButton(false)

    try {
      const oldStatus = request.status
      await swapRequestsService.updateSwapRequestStatus(id!, 'rejected', undefined, oldStatus)

      // Create system comment
      await createSystemComment(
        `${user.name} declined the swap request. Status changed from ${getStatusLabel(oldStatus)} to Rejected`
      )

      await fetchRequestDetails()
    } catch (error) {
      if (error instanceof ConcurrencyError) {
        setError('This request was modified by someone else. Please refresh to see the latest version.')
        setShowRefreshButton(true)
      } else {
        handleDatabaseError(error, 'decline request')
        setError(ERROR_MESSAGES.SERVER)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApprove() {
    if (!request || !user) return

    setSubmitting(true)
    setError('')
    setShowRefreshButton(false)

    try {
      const oldStatus = request.status
      let newStatus: SwapRequestStatus
      let approvalField: 'tl_approved_at' | 'wfm_approved_at' | undefined

      if (user.role === 'tl' && request.status === 'pending_tl') {
        // Check if auto-approve is enabled
        const autoApproveEnabled = await settingsService.getAutoApproveSetting()

        if (autoApproveEnabled) {
          // Auto-approve: skip WFM and go straight to approved
          newStatus = 'approved'
          approvalField = 'wfm_approved_at' // Mark as auto-approved
        } else {
          // Normal flow: send to WFM for approval
          newStatus = 'pending_wfm'
          approvalField = 'tl_approved_at'
        }
      } else if (user.role === 'wfm' && (request.status === 'pending_wfm' || request.status === 'pending_tl')) {
        newStatus = 'approved'
        approvalField = 'wfm_approved_at'
      } else {
        throw new Error('Cannot approve this request')
      }

      const updatedRequest = await swapRequestsService.updateSwapRequestStatus(id!, newStatus, approvalField, oldStatus)

      // Create system comment with appropriate message
      if (user.role === 'tl' && newStatus === 'approved') {
        await createSystemComment(
          `${user.name} approved (auto-approved by system). Status changed from ${getStatusLabel(oldStatus)} to ${getStatusLabel(newStatus)}`
        )
      } else if (user.role === 'wfm' && newStatus === 'approved') {
        await createSystemComment(
          `${user.name} approved. Status changed from ${getStatusLabel(oldStatus)} to ${getStatusLabel(newStatus)}`
        )
      } else if (user.role === 'tl' && newStatus === 'pending_wfm') {
        await createSystemComment(
          `${user.name} approved. Status changed from ${getStatusLabel(oldStatus)} to ${getStatusLabel(newStatus)}`
        )
      }

      // If fully approved, execute the swap using the stored procedure
      if (newStatus === 'approved' && requesterShift && targetShift) {
        try {
          await swapRequestsService.executeSwap(updatedRequest)
        } catch (swapError) {
          if (swapError instanceof SwapExecutionError) {
            setError(`Failed to execute swap: ${swapError.message}`)
          } else {
            throw swapError
          }
        }
      }

      await fetchRequestDetails()
    } catch (error) {
      if (error instanceof ConcurrencyError) {
        setError('This request was modified by someone else. Please refresh to see the latest version.')
        setShowRefreshButton(true)
      } else {
        handleDatabaseError(error, 'approve request')
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
      const oldStatus = request.status
      await swapRequestsService.updateSwapRequestStatus(id!, 'rejected', undefined, oldStatus)

      // Create system comment
      await createSystemComment(
        `${user.name} rejected. Status changed from ${getStatusLabel(oldStatus)} to Rejected`
      )

      await fetchRequestDetails()
    } catch (error) {
      if (error instanceof ConcurrencyError) {
        setError('This request was modified by someone else. Please refresh to see the latest version.')
        setShowRefreshButton(true)
      } else {
        handleDatabaseError(error, 'reject request')
        setError(ERROR_MESSAGES.SERVER)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRevoke() {
    if (!request || !user) return

    setSubmitting(true)
    setError('')
    setShowRefreshButton(false)

    try {
      const oldStatus = request.status

      // If was approved, need to reverse the shift swap using stored original values
      if (oldStatus === 'approved' && request.requester_original_date && request.target_original_date) {
        const requesterDate = request.requester_original_date
        const targetDate = request.target_original_date
        const requesterId = request.requester_id
        const targetUserId = request.target_user_id

        // Find all 4 shift records
        const reqOnReqDateShifts = await shiftsService.getShifts(requesterDate, requesterDate)
        const reqOnReqDate = reqOnReqDateShifts.find(s => s.user_id === requesterId)

        const reqOnTgtDateShifts = await shiftsService.getShifts(targetDate, targetDate)
        const reqOnTgtDate = reqOnTgtDateShifts.find(s => s.user_id === requesterId)

        const tgtOnReqDateShifts = await shiftsService.getShifts(requesterDate, requesterDate)
        const tgtOnReqDate = tgtOnReqDateShifts.find(s => s.user_id === targetUserId)

        const tgtOnTgtDateShifts = await shiftsService.getShifts(targetDate, targetDate)
        const tgtOnTgtDate = tgtOnTgtDateShifts.find(s => s.user_id === targetUserId)

        // Restore all 4 shifts to their original shift_types
        if (reqOnReqDate && request.requester_original_shift_type) {
          await shiftsService.updateShift(reqOnReqDate.id, { shift_type: request.requester_original_shift_type })
        }

        if (reqOnTgtDate && request.requester_original_shift_type_on_target_date) {
          await shiftsService.updateShift(reqOnTgtDate.id, { shift_type: request.requester_original_shift_type_on_target_date })
        }

        if (tgtOnReqDate && request.target_original_shift_type_on_requester_date) {
          await shiftsService.updateShift(tgtOnReqDate.id, { shift_type: request.target_original_shift_type_on_requester_date })
        }

        if (tgtOnTgtDate && request.target_original_shift_type) {
          await shiftsService.updateShift(tgtOnTgtDate.id, { shift_type: request.target_original_shift_type })
        }
      }

      // Reset status based on current status
      let newStatus: SwapRequestStatus = 'pending_tl'
      if (oldStatus === 'pending_wfm') {
        newStatus = 'pending_tl'
      } else if (oldStatus === 'approved') {
        newStatus = 'pending_tl'
      } else if (oldStatus === 'rejected') {
        newStatus = 'pending_tl'
      }

      // Clear approval timestamps when revoking
      await swapRequestsService.clearApprovalTimestamps(id!)
      await swapRequestsService.updateSwapRequestStatus(id!, newStatus, undefined, oldStatus)

      // Create system comment
      await createSystemComment(
        `${user.name} revoked decision. Status reset from ${getStatusLabel(oldStatus)} to ${getStatusLabel(newStatus)}. All 4 shifts restored to original values.`
      )

      await fetchRequestDetails()
    } catch (error) {
      if (error instanceof ConcurrencyError) {
        setError('This request was modified by someone else. Please refresh to see the latest version.')
        setShowRefreshButton(true)
      } else {
        handleDatabaseError(error, 'revoke decision')
        setError(ERROR_MESSAGES.SERVER)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel() {
    if (!request || !user) return

    setSubmitting(true)
    setError('')
    setShowRefreshButton(false)

    try {
      const oldStatus = request.status
      await swapRequestsService.updateSwapRequestStatus(id!, 'rejected', undefined, oldStatus)

      // Create system comment
      await createSystemComment(
        `${user.name} cancelled the swap request. Status changed from ${getStatusLabel(oldStatus)} to Rejected`
      )

      await fetchRequestDetails()
    } catch (error) {
      if (error instanceof ConcurrencyError) {
        setError('This request was modified by someone else. Please refresh to see the latest version.')
        setShowRefreshButton(true)
      } else {
        handleDatabaseError(error, 'cancel request')
        setError(ERROR_MESSAGES.SERVER)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || !user || !id) return

    setSubmitting(true)
    try {
      await commentsService.createComment({
        request_id: id,
        request_type: 'swap',
        user_id: user.id,
        content: newComment.trim()
      })

      setNewComment('')
      await fetchRequestDetails()
    } catch (error) {
      handleDatabaseError(error, 'add comment')
      setError(ERROR_MESSAGES.SERVER)
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

  function canCancel(): boolean {
    if (!user || !request) return false
    // Requester can cancel if not yet approved/rejected
    if (user.id === request.requester_id && (request.status === 'pending_acceptance' || request.status === 'pending_tl' || request.status === 'pending_wfm')) return true
    // Target user can cancel if they accepted but not yet approved
    if (user.id === request.target_user_id && (request.status === 'pending_tl' || request.status === 'pending_wfm')) return true
    return false
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

        {/* Swap Details Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-4 w-40 bg-gray-200 rounded mb-3 animate-pulse"></div>
              <div className="h-5 w-28 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 rounded mb-3 animate-pulse"></div>
              <div className="h-5 w-28 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-4 w-40 bg-gray-200 rounded mb-3 animate-pulse"></div>
              <div className="h-5 w-28 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 rounded mb-3 animate-pulse"></div>
              <div className="h-5 w-28 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Timeline Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
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
                <p className="font-medium">{formatDate(request.requester_original_date)}</p>
                <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {request.requester_original_shift_type ? getShiftDisplay(request.requester_original_shift_type as ShiftType).name : 'Unknown'}
                </span>
              </div>
            )}
            
            {/* Date 2: target_original_date - only show if different from requester_original_date */}
            {request.target_original_date && request.target_original_date !== request.requester_original_date && (
              <div>
                <p className="font-medium">{formatDate(request.target_original_date)}</p>
                <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {request.requester_original_shift_type_on_target_date ? getShiftDisplay(request.requester_original_shift_type_on_target_date as ShiftType).name : 'Unknown'}
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
                <p className="font-medium">{formatDate(request.requester_original_date)}</p>
                <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                  {request.target_original_shift_type_on_requester_date ? getShiftDisplay(request.target_original_shift_type_on_requester_date as ShiftType).name : 'Unknown'}
                </span>
              </div>
            )}
            
            {/* Date 2: target_original_date - only show if different from requester_original_date */}
            {request.target_original_date && request.target_original_date !== request.requester_original_date && (
              <div>
                <p className="font-medium">{formatDate(request.target_original_date)}</p>
                <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                  {request.target_original_shift_type ? getShiftDisplay(request.target_original_shift_type as ShiftType).name : 'Unknown'}
                </span>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Created on {formatDateTime(request.created_at)}
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
                Created on {formatDateTime(request.created_at)}
              </p>
            </div>
          </div>

          {/* Target Acceptance */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              request.status === 'rejected' && !request.tl_approved_at && !request.wfm_approved_at ? 'bg-red-100 text-red-600' :
              request.status !== 'pending_acceptance' ? 'bg-green-100 text-green-600' :
              'bg-yellow-100 text-yellow-600'
            }`}>
              {request.status === 'rejected' && !request.tl_approved_at && !request.wfm_approved_at ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : request.status !== 'pending_acceptance' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-bold">...</span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">Target Acceptance ({targetUser.name})</p>
              {request.status === 'pending_acceptance' ? (
                <p className="text-sm text-yellow-600">Awaiting acceptance</p>
              ) : request.status === 'rejected' && !request.tl_approved_at && !request.wfm_approved_at ? (
                <p className="text-sm text-red-600">Declined</p>
              ) : (
                <p className="text-sm text-green-600">Accepted</p>
              )}
            </div>
          </div>

          {/* TL Approval */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              request.status === 'rejected' && request.tl_approved_at && !request.wfm_approved_at ? 'bg-red-100 text-red-600' :
              request.status === 'rejected' && !request.tl_approved_at ? 'bg-red-100 text-red-600' :
              request.tl_approved_at ? 'bg-green-100 text-green-600' :
              request.status === 'pending_tl' ? 'bg-yellow-100 text-yellow-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              {request.status === 'rejected' && (request.tl_approved_at || !request.wfm_approved_at) ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : request.tl_approved_at ? (
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
              <p className="font-medium text-gray-900">Team Lead Approval</p>
              {request.status === 'rejected' && (request.tl_approved_at || !request.wfm_approved_at) ? (
                <p className="text-sm text-red-600">Rejected</p>
              ) : request.tl_approved_at ? (
                <p className="text-sm text-gray-500">
                  Approved on {formatDateTime(request.tl_approved_at)}
                </p>
              ) : request.status === 'pending_tl' ? (
                <p className="text-sm text-yellow-600">Awaiting approval</p>
              ) : (
                <p className="text-sm text-gray-500">Pending</p>
              )}
            </div>
          </div>

          {/* WFM Approval */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              request.status === 'rejected' && request.wfm_approved_at ? 'bg-red-100 text-red-600' :
              request.wfm_approved_at ? 'bg-green-100 text-green-600' :
              request.status === 'pending_wfm' ? 'bg-yellow-100 text-yellow-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              {request.status === 'rejected' && request.wfm_approved_at ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : request.wfm_approved_at ? (
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
              <p className="font-medium text-gray-900">WFM Approval</p>
              {request.status === 'rejected' && request.wfm_approved_at ? (
                <p className="text-sm text-red-600">Rejected</p>
              ) : request.wfm_approved_at ? (
                <p className="text-sm text-gray-500">
                  Approved on {formatDateTime(request.wfm_approved_at)}
                </p>
              ) : request.status === 'pending_wfm' ? (
                <p className="text-sm text-yellow-600">Awaiting approval</p>
              ) : (
                <p className="text-sm text-gray-500">Pending</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(canAcceptOrDecline() || canApprove() || canReject() || canRevoke() || canCancel()) && (
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
            {canCancel() && (
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Cancel Request'}
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
                  <span className={`text-sm font-medium ${comment.is_system ? 'text-gray-700' : 'text-blue-800'}`}>
                    {comment.is_system ? 'System' : (comment as CommentWithSystem).users?.name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(comment.created_at)}
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
