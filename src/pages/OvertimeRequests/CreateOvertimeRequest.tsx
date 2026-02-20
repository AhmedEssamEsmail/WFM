import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCreateOvertimeRequest, useOvertimeRequests } from '../../hooks/useOvertimeRequests';
import { useOvertimeSettings } from '../../hooks/useOvertimeSettings';
import { shiftsService } from '../../services';
import {
  calculateHours,
  validateOvertimeRequest,
  checkShiftVerification,
} from '../../utils/overtimeValidation';
import type { OvertimeType, Shift } from '../../types';
import { ROUTES } from '../../constants';

const SHIFT_TYPE_LABELS: Record<string, string> = {
  AM: 'AM Shift',
  PM: 'PM Shift',
  BET: 'BET Shift',
  OFF: 'Day Off',
};

export default function CreateOvertimeRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: settings, isLoading: loadingSettings } = useOvertimeSettings();
  const { overtimeRequests: existingRequests } = useOvertimeRequests();
  const createMutation = useCreateOvertimeRequest();

  const [requestDate, setRequestDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [overtimeType, setOvertimeType] = useState<OvertimeType>('regular');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Shift information
  const [shift, setShift] = useState<Shift | null>(null);
  const [loadingShift, setLoadingShift] = useState(false);

  // Calculate total hours
  const totalHours = startTime && endTime ? calculateHours(startTime, endTime) : 0;

  // Fetch shift information when date changes
  useEffect(() => {
    if (requestDate && user && settings?.require_shift_verification.enabled) {
      fetchShiftInfo();
    } else {
      setShift(null);
    }
  }, [requestDate, user, settings]);

  const fetchShiftInfo = async () => {
    if (!user || !requestDate) return;

    setLoadingShift(true);
    try {
      const shifts = await shiftsService.getUserShifts(user.id, requestDate, requestDate);
      setShift(shifts.length > 0 ? shifts[0] : null);
    } catch (err) {
      console.error('Error fetching shift info:', err);
      setShift(null);
    } finally {
      setLoadingShift(false);
    }
  };

  // Validate form on input changes
  useEffect(() => {
    if (!requestDate || !startTime || !endTime || !reason || !settings) {
      setErrors([]);
      setWarnings([]);
      return;
    }

    const input = {
      request_date: requestDate,
      start_time: startTime,
      end_time: endTime,
      overtime_type: overtimeType,
      reason,
    };

    const validation = validateOvertimeRequest(input, settings, existingRequests);

    // Add shift verification warnings
    if (settings.require_shift_verification.enabled && shift) {
      const shiftCheck = checkShiftVerification(
        input,
        {
          shift_type: shift.shift_type,
          start_time: '00:00:00', // Placeholder - we'd need to join with shift_configurations
          end_time: '23:59:59', // Placeholder - we'd need to join with shift_configurations
          date: shift.date,
        },
        settings
      );

      if (shiftCheck.warning) {
        validation.warnings.push(shiftCheck.warning);
      }
    } else if (settings.require_shift_verification.enabled && !shift && !loadingShift) {
      validation.warnings.push('No scheduled shift found for this date');
    }

    setErrors(validation.errors);
    setWarnings(validation.warnings);
  }, [requestDate, startTime, endTime, overtimeType, reason, settings, existingRequests, shift]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (errors.length > 0) {
      return;
    }

    try {
      await createMutation.mutateAsync({
        request_date: requestDate,
        start_time: startTime,
        end_time: endTime,
        overtime_type: overtimeType,
        reason,
      });

      navigate(ROUTES.OVERTIME_REQUESTS);
    } catch (err) {
      console.error('Error creating overtime request:', err);
    }
  };

  const isSubmitDisabled =
    !requestDate ||
    !startTime ||
    !endTime ||
    !reason ||
    errors.length > 0 ||
    createMutation.isPending ||
    loadingSettings;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">New Overtime Request</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Error messages */}
          {errors.length > 0 && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <ul className="list-inside list-disc space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warning messages */}
          {warnings.length > 0 && (
            <div className="rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700">
              <ul className="list-inside list-disc space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Mutation error */}
          {createMutation.isError && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              Failed to create overtime request. Please try again.
            </div>
          )}

          {/* Work Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Work Date</label>
            <input
              type="date"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              required
            />
          </div>

          {/* Shift Information */}
          {settings?.require_shift_verification.enabled && requestDate && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-700">Scheduled Shift</h3>
              {loadingShift ? (
                <p className="text-sm text-gray-500">Loading shift information...</p>
              ) : shift ? (
                <div className="text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Shift Type:</span>{' '}
                    {SHIFT_TYPE_LABELS[shift.shift_type] || shift.shift_type}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-yellow-600">⚠️ No scheduled shift found for this date</p>
              )}
            </div>
          )}

          {/* Overtime Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Overtime Type</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="regular"
                  checked={overtimeType === 'regular'}
                  onChange={(e) => setOvertimeType(e.target.value as OvertimeType)}
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Regular Overtime (1.5x pay)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="double"
                  checked={overtimeType === 'double'}
                  onChange={(e) => setOvertimeType(e.target.value as OvertimeType)}
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Double Time (2.0x pay)</span>
              </label>
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Calculated Total Hours */}
          {totalHours > 0 && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm text-gray-700">
                Total Hours: <span className="text-lg font-medium">{totalHours.toFixed(2)}</span>
              </p>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="Explain why you worked overtime (10-250 characters)..."
              required
              minLength={10}
              maxLength={250}
            />
            <p className="mt-1 text-sm text-gray-500">{reason.length}/250 characters</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.OVERTIME_REQUESTS)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
