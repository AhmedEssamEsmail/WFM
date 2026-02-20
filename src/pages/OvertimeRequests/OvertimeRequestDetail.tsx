import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { OvertimeRequest, Comment, OvertimeStatus } from '../../types';
import { User } from '../../types';
import { formatDate, formatDateTime } from '../../utils';
import { ROUTES, ERROR_MESSAGES } from '../../constants';
import { handleDatabaseError } from '../../lib/errorHandler';
import { ConcurrencyError } from '../../types/errors';
import { commentsService } from '../../services';
import { overtimeRequestsService } from '../../services/overtimeRequestsService';
import ApprovalTimeline from '../../components/OvertimeRequests/ApprovalTimeline';

interface CommentWithSystem extends Comment {
  is_system?: boolean;
  user?: User;
  users?: User;
}

const OVERTIME_TYPE_LABELS = {
  regular: 'Regular Overtime (1.5x)',
  double: 'Double Time (2.0x)',
};

const OVERTIME_STATUS_COLORS: Record<OvertimeStatus, string> = {
  pending_tl: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_wfm: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

const OVERTIME_STATUS_LABELS: Record<OvertimeStatus, string> = {
  pending_tl: 'Pending TL',
  pending_wfm: 'Pending WFM',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export default function OvertimeRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<OvertimeRequest | null>(null);
  const [comments, setComments] = useState<CommentWithSystem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showRefreshButton, setShowRefreshButton] = useState(false);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      const data = await commentsService.getComments(id!, 'overtime_request');
      setComments(data as CommentWithSystem[]);
    } catch (err) {
      handleDatabaseError(err, 'fetch comments');
    }
  }, [id]);

  const fetchRequestDetails = useCallback(async () => {
    try {
      const requestData = await overtimeRequestsService.getOvertimeRequestById(id!);
      setRequest(requestData);
      await fetchComments();
    } catch (err) {
      handleDatabaseError(err, 'fetch request details');
      setError(ERROR_MESSAGES.NOT_FOUND);
    } finally {
      setLoading(false);
    }
  }, [id, fetchComments]);

  useEffect(() => {
    if (id) {
      fetchRequestDetails();
    }
  }, [id, fetchRequestDetails]);

  async function addSystemComment(content: string) {
    if (!user) return;

    try {
      await commentsService.createSystemComment(id!, 'overtime_request', content, user.id);
    } catch (err) {
      handleDatabaseError(err, 'add system comment');
    }
  }

  async function handleApprove() {
    if (!request || !user || !approvalNotes.trim()) return;
    setSubmitting(true);
    setError('');
    setShowRefreshButton(false);

    try {
      await overtimeRequestsService.approveOvertimeRequest(id!, approvalNotes.trim());

      // Add system comment
      await addSystemComment(`Request approved by ${user.name} (${user.role.toUpperCase()})`);

      // Refresh the request
      await fetchRequestDetails();
      setShowApproveModal(false);
      setApprovalNotes('');
    } catch (err) {
      if (err instanceof ConcurrencyError) {
        setError(
          'This request was modified by someone else. Please refresh to see the latest version.'
        );
        setShowRefreshButton(true);
      } else {
        handleDatabaseError(err, 'approve request');
        setError(ERROR_MESSAGES.SERVER);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!request || !user || !rejectionNotes.trim()) return;
    setSubmitting(true);
    setError('');
    setShowRefreshButton(false);

    try {
      await overtimeRequestsService.rejectOvertimeRequest(id!, rejectionNotes.trim());

      // Add system comment
      await addSystemComment(`Request rejected by ${user.name} (${user.role.toUpperCase()})`);

      // Refresh the request
      await fetchRequestDetails();
      setShowRejectModal(false);
      setRejectionNotes('');
    } catch (err) {
      if (err instanceof ConcurrencyError) {
        setError(
          'This request was modified by someone else. Please refresh to see the latest version.'
        );
        setShowRefreshButton(true);
      } else {
        handleDatabaseError(err, 'reject request');
        setError(ERROR_MESSAGES.SERVER);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!request || !user) return;
    setSubmitting(true);
    setError('');
    setShowRefreshButton(false);

    try {
      await overtimeRequestsService.cancelOvertimeRequest(id!);

      // Add system comment
      await addSystemComment(`Request cancelled by ${user.name}`);

      // Refresh the request
      await fetchRequestDetails();
      setShowCancelModal(false);
    } catch (err) {
      if (err instanceof ConcurrencyError) {
        setError(
          'This request was modified by someone else. Please refresh to see the latest version.'
        );
        setShowRefreshButton(true);
      } else {
        handleDatabaseError(err, 'cancel request');
        setError(ERROR_MESSAGES.SERVER);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);

    try {
      await commentsService.createComment({
        request_id: id!,
        request_type: 'overtime_request',
        user_id: user.id,
        content: newComment.trim(),
      });

      setNewComment('');
      await fetchComments();
    } catch (err) {
      handleDatabaseError(err, 'add comment');
      setError(ERROR_MESSAGES.SERVER);
    } finally {
      setSubmitting(false);
    }
  }

  const canApprove = () => {
    if (!request || !user) return false;
    if (
      request.status === 'approved' ||
      request.status === 'rejected' ||
      request.status === 'cancelled'
    )
      return false;
    if (user.role === 'tl' && request.status === 'pending_tl') return true;
    if (
      user.role === 'wfm' &&
      (request.status === 'pending_wfm' || request.status === 'pending_tl')
    )
      return true;
    return false;
  };

  const canReject = () => {
    if (!request || !user) return false;
    if (
      request.status === 'approved' ||
      request.status === 'rejected' ||
      request.status === 'cancelled'
    )
      return false;
    if (user.role === 'tl' || user.role === 'wfm') return true;
    return false;
  };

  const canCancel = () => {
    if (!request || !user) return false;
    return (
      user.id === request.requester_id &&
      (request.status === 'pending_tl' || request.status === 'pending_wfm')
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="mb-2 h-6 w-16 animate-pulse rounded bg-gray-200"></div>
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200"></div>
          </div>
          <div className="h-8 w-32 animate-pulse rounded-full bg-gray-200"></div>
        </div>

        {/* Request Details Skeleton */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="mb-2 h-4 w-20 animate-pulse rounded bg-gray-200"></div>
                <div className="h-6 w-40 animate-pulse rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Skeleton */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="mb-1 h-5 w-32 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comments Skeleton */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200"></div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-lg bg-gray-100 p-3">
                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">{error || 'Request not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(ROUTES.OVERTIME_REQUESTS)}
            className="mb-2 flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Overtime Request Details</h1>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${OVERTIME_STATUS_COLORS[request.status]}`}
        >
          {OVERTIME_STATUS_LABELS[request.status]}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error}</p>
          {showRefreshButton && (
            <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Refresh Page
            </button>
          )}
        </div>
      )}

      {/* Request Details */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Request Details</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Requester</h3>
            <p className="text-lg text-gray-900">{request.requester?.name}</p>
            <p className="text-sm text-gray-500">{request.requester?.department}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Overtime Type</h3>
            <p className="text-lg text-gray-900">{OVERTIME_TYPE_LABELS[request.overtime_type]}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Work Date</h3>
            <p className="text-lg text-gray-900">{formatDate(request.request_date)}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Time Range</h3>
            <p className="text-lg text-gray-900">
              {request.start_time.substring(0, 5)} - {request.end_time.substring(0, 5)}
            </p>
            <p className="text-sm text-gray-500">{request.total_hours} hour(s)</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Submitted</h3>
            <p className="text-lg text-gray-900">{formatDateTime(request.created_at)}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
            <p className="text-lg text-gray-900">{formatDateTime(request.updated_at)}</p>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500">Reason</h3>
            <p className="text-gray-900">{request.reason}</p>
          </div>
        </div>
      </div>

      {/* Approval Timeline */}
      <ApprovalTimeline request={request} />

      {/* Action Buttons */}
      {(canApprove() || canReject() || canCancel()) && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {canApprove() && (
              <button
                onClick={() => setShowApproveModal(true)}
                disabled={submitting}
                className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Approve
              </button>
            )}
            {canReject() && (
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={submitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reject
              </button>
            )}
            {canCancel() && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={submitting}
                className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel Request
              </button>
            )}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Comments</h2>

        <div className="mb-6 space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-lg p-3 ${comment.is_system ? 'bg-gray-100' : 'bg-blue-50'}`}
              >
                <div className="mb-1 flex items-start justify-between">
                  <span
                    className={`text-sm font-medium ${comment.is_system ? 'text-gray-700' : 'text-blue-800'}`}
                  >
                    {comment.is_system
                      ? 'System'
                      : (comment as CommentWithSystem).users?.name || 'Unknown User'}
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddComment();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Approve Overtime Request</h3>
            <p className="mb-4 text-sm text-gray-600">
              Please provide notes for this approval. This will be recorded in the request history.
            </p>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Enter approval notes..."
              rows={4}
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApprovalNotes('');
                }}
                disabled={submitting}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting || !approvalNotes.trim()}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Reject Overtime Request</h3>
            <p className="mb-4 text-sm text-gray-600">
              Please provide a reason for rejecting this request. This will be visible to the
              requester.
            </p>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionNotes('');
                }}
                disabled={submitting}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={submitting || !rejectionNotes.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Cancel Overtime Request</h3>
            <p className="mb-4 text-sm text-gray-600">
              Are you sure you want to cancel this overtime request? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={submitting}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                No, Keep It
              </button>
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Cancelling...' : 'Yes, Cancel Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
