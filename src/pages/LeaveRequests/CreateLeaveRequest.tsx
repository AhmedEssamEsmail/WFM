import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLeaveTypes } from '../../hooks/useLeaveTypes';
import type { LeaveType, User } from '../../types';
import { usersService, leaveRequestsService, leaveBalancesService } from '../../services';
import { getDaysBetween, isValidDateRange } from '../../utils';
import { leaveRequestCreateSchema } from '../../validation';
import { ROUTES, ERROR_MESSAGES } from '../../constants';
import { InsufficientLeaveBalanceError } from '../../types/errors';

export default function CreateLeaveRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { leaveTypes, isLoading: loadingLeaveTypes } = useLeaveTypes();
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New state for "submit on behalf of" feature
  const [agents, setAgents] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingAgents, setLoadingAgents] = useState(false);

  // State for leave balance
  const [leaveBalance, setLeaveBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Check if current user can submit on behalf of others (WFM or TL roles)
  const canSubmitOnBehalf = user?.role === 'wfm' || user?.role === 'tl';

  // Set default leave type when leave types are loaded
  useEffect(() => {
    if (leaveTypes.length > 0 && !leaveType) {
      setLeaveType(leaveTypes[0].code);
    }
  }, [leaveTypes, leaveType]);

  // Fetch agents if user has WFM or TL role
  useEffect(() => {
    if (canSubmitOnBehalf) {
      fetchAgents();
    }
    // Set default selected user to current user
    if (user) {
      setSelectedUserId(user.id);
    }
  }, [user, canSubmitOnBehalf]);

  // Fetch leave balance when selected user or leave type changes
  useEffect(() => {
    const targetUserId = canSubmitOnBehalf && selectedUserId ? selectedUserId : user?.id;
    if (targetUserId && leaveType) {
      fetchLeaveBalance(targetUserId, leaveType);
    }
  }, [selectedUserId, leaveType, user, canSubmitOnBehalf]);

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const users = await usersService.getUsers();
      setAgents(users || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
    } finally {
      setLoadingAgents(false);
    }
  };

  const fetchLeaveBalance = async (userId: string, type: LeaveType) => {
    setLoadingBalance(true);
    try {
      const balance = await leaveBalancesService.getLeaveBalance(userId, type);
      setLeaveBalance(balance?.balance ?? 0);
    } catch (err) {
      console.error('Error fetching leave balance:', err);
      setLeaveBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Calculate number of days between dates
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    return getDaysBetween(start, end);
  };

  const requestedDays = calculateDays(startDate, endDate);
  const exceedsBalance = leaveBalance !== null && requestedDays > leaveBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Use selected user ID (for WFM/TL submitting on behalf) or current user ID
    const targetUserId = canSubmitOnBehalf ? selectedUserId : user!.id;

    // Validate with Zod
    const result = leaveRequestCreateSchema.safeParse({
      user_id: targetUserId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      notes: notes || null,
    });

    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    // Additional validation for date range
    if (!isValidDateRange(startDate, endDate)) {
      setError('End date cannot be before start date');
      return;
    }

    setLoading(true);
    try {
      // Determine status based on balance check
      // If requested days exceed available balance, auto-deny the request
      const status = exceedsBalance ? 'denied' : 'pending_tl';

      // Use service method to create leave request with custom status
      await leaveRequestsService.createLeaveRequest(
        {
          user_id: targetUserId,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          notes: notes || null,
        },
        status
      );

      navigate(ROUTES.LEAVE_REQUESTS);
    } catch (err) {
      if (err instanceof InsufficientLeaveBalanceError) {
        setError(
          `Insufficient leave balance. You have ${err.available} days available, but requested ${err.requested} days.`
        );
      } else {
        console.error('Error creating leave request:', err);
        setError(ERROR_MESSAGES.SERVER);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">New Leave Request</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {/* Submit on behalf of dropdown (only for WFM/TL) */}
          {canSubmitOnBehalf && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Submit on behalf of
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={loadingAgents}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              >
                {loadingAgents ? (
                  <option>Loading...</option>
                ) : (
                  agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} {agent.id === user?.id ? '(Me)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Leave Type</label>
            {loadingLeaveTypes ? (
              <div className="text-sm text-gray-500">Loading leave types...</div>
            ) : (
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              >
                {leaveTypes
                  .filter((lt) => lt.is_active)
                  .map((type) => (
                    <option key={type.id} value={type.code}>
                      {type.label}
                    </option>
                  ))}
              </select>
            )}
            {!loadingBalance && leaveBalance !== null && (
              <p className="mt-1 text-sm text-gray-500">Available balance: {leaveBalance} days</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {requestedDays > 0 && (
            <div
              className={`rounded-md p-3 ${exceedsBalance ? 'border border-orange-200 bg-orange-50' : 'bg-gray-50'}`}
            >
              <p className="text-sm text-gray-700">
                Requested days: <span className="font-medium">{requestedDays}</span>
              </p>
              {exceedsBalance && (
                <p className="mt-1 text-sm text-orange-600">
                  Warning: This exceeds your available balance ({leaveBalance} days). The request
                  will be automatically denied.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.LEAVE_REQUESTS)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading
                ? 'Submitting...'
                : exceedsBalance
                  ? 'Submit (Will be Denied)'
                  : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
