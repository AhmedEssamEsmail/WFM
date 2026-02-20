import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLeaveTypes } from '../../hooks/useLeaveTypes';
import { useSchedule } from '../../hooks/useSchedule';
import { User, Shift, ShiftType, LeaveType, LeaveRequest, HeadcountUser, Skill } from '../../types';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { SHIFT_COLORS, SHIFT_LABELS } from '../../lib/designSystem';
import { formatDateISO } from '../../utils';
import SkillsFilter from '../../components/Schedule/SkillsFilter';

interface ShiftWithSwap extends Shift {
  swapped_with_user_id?: string | null;
  original_user_id?: string | null;
  swapped_user?: User | null;
}

export default function Schedule() {
  const { user } = useAuth();
  const { leaveTypes, isLoading: loadingLeaveTypes } = useLeaveTypes();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Use the custom hook for data fetching
  const {
    users,
    shifts,
    approvedLeaves,
    swappedUserNames,
    isLoading: loading,
    createShift,
    updateShift,
    deleteShift: deleteShiftMutation,
    createLeave,
    updateLeave,
    deleteLeave,
  } = useSchedule({
    currentDate,
    userRole: user?.role || 'agent',
  });

  // Shift editing state
  const [editingShift, setEditingShift] = useState<{
    userId: string;
    date: string;
    shiftId?: string;
    existingLeave?: LeaveRequest | null;
  } | null>(null);
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType | null>('AM');
  const [selectedLeaveTypeCode, setSelectedLeaveTypeCode] = useState<LeaveType | null>(null);
  const [savingShift, setSavingShift] = useState(false);

  // Filter state
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  const canEdit = user?.role === 'tl' || user?.role === 'wfm';
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Filter users based on selection
  let filteredUsers =
    selectedUserId === 'all' ? users : users.filter((u) => u.id === selectedUserId);

  // Apply skills filter (OR logic - show users with at least one selected skill)
  if (selectedSkillIds.length > 0) {
    filteredUsers = filteredUsers.filter((user) => {
      // Check if user has any of the selected skills
      const userSkillIds = (user as HeadcountUser).assigned_skills?.map((s: Skill) => s.id) || [];
      return selectedSkillIds.some((skillId) => userSkillIds.includes(skillId));
    });
  }

  // Helper function to get leave type label from code
  function getLeaveTypeLabel(leaveTypeCode: LeaveType): string {
    const leaveType = leaveTypes.find((lt) => lt.code === leaveTypeCode);
    return leaveType?.label || leaveTypeCode;
  }

  function getShiftForUserAndDate(userId: string, date: Date): ShiftWithSwap | undefined {
    const dateStr = formatDateISO(date);
    return shifts.find((s) => s.user_id === userId && s.date === dateStr);
  }

  function getLeaveForUserAndDate(userId: string, date: Date): LeaveRequest | undefined {
    return approvedLeaves.find((leave) => {
      if (leave.user_id !== userId) return false;
      const leaveStart = parseISO(leave.start_date);
      const leaveEnd = parseISO(leave.end_date);
      return isWithinInterval(date, { start: leaveStart, end: leaveEnd });
    });
  }

  function handleShiftClick(userId: string, date: Date) {
    if (!canEdit) return;

    const dateStr = formatDateISO(date);
    const existingShift = getShiftForUserAndDate(userId, date);
    const existingLeave = getLeaveForUserAndDate(userId, date);

    setEditingShift({ userId, date: dateStr, shiftId: existingShift?.id, existingLeave });
    setSelectedShiftType(existingShift?.shift_type || 'AM');
    // If there's an existing leave, pre-select that leave type code
    if (existingLeave) {
      setSelectedLeaveTypeCode(existingLeave.leave_type as LeaveType);
    } else {
      setSelectedLeaveTypeCode(null);
    }
  }

  async function saveShift() {
    if (!editingShift) return;
    setSavingShift(true);

    try {
      // CASE 1: Delete only - no shift or leave selected
      if (!selectedLeaveTypeCode && !selectedShiftType) {
        // Delete existing leave if any
        if (editingShift.existingLeave) {
          await deleteLeave.mutateAsync(editingShift.existingLeave.id);
        }

        // Delete existing shift if any
        if (editingShift.shiftId) {
          await deleteShiftMutation.mutateAsync(editingShift.shiftId);
        }

        setEditingShift(null);
        setSavingShift(false);
        return;
      }

      // CASE 2: Assign/update leave
      if (selectedLeaveTypeCode) {
        // If there's an existing leave with the same type, just close
        if (
          editingShift.existingLeave &&
          editingShift.existingLeave.leave_type === selectedLeaveTypeCode
        ) {
          setEditingShift(null);
          setSavingShift(false);
          return;
        }

        // If there's an existing leave with different type, UPDATE it instead of delete+insert
        if (editingShift.existingLeave) {
          await updateLeave.mutateAsync({
            leaveId: editingShift.existingLeave.id,
            updates: { leave_type: selectedLeaveTypeCode },
          });
        } else {
          // No existing leave - create new one
          await createLeave.mutateAsync({
            user_id: editingShift.userId,
            leave_type: selectedLeaveTypeCode,
            start_date: editingShift.date,
            end_date: editingShift.date,
            notes: 'Assigned by TL/WFM from schedule',
            status: 'approved',
            tl_approved_at: null,
            wfm_approved_at: null,
          });
        }

        // Remove any existing shift for this day (leave takes precedence)
        if (editingShift.shiftId) {
          await deleteShiftMutation.mutateAsync(editingShift.shiftId);
        }
      }
      // CASE 3: Assign/update shift (no leave selected)
      else if (selectedShiftType) {
        // First, remove any existing leave for this day
        if (editingShift.existingLeave) {
          await deleteLeave.mutateAsync(editingShift.existingLeave.id);
        }

        if (editingShift.shiftId) {
          // Update existing shift
          await updateShift.mutateAsync({
            shiftId: editingShift.shiftId,
            updates: { shift_type: selectedShiftType },
          });
        } else {
          // Create new shift
          await createShift.mutateAsync({
            user_id: editingShift.userId,
            date: editingShift.date,
            shift_type: selectedShiftType,
          });
        }
      }

      setEditingShift(null);
    } catch (error) {
      console.error('Failed to save shift/leave:', error);
    } finally {
      setSavingShift(false);
    }
  }

  async function deleteShift() {
    if (!editingShift) return;
    setSavingShift(true);

    try {
      // Delete existing leave if any
      if (editingShift.existingLeave) {
        await deleteLeave.mutateAsync(editingShift.existingLeave.id);
      }

      // Delete existing shift if any
      if (editingShift.shiftId) {
        await deleteShiftMutation.mutateAsync(editingShift.shiftId);
      }

      setEditingShift(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setSavingShift(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 md:w-[95%]">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="mt-1 text-sm text-gray-500">
            {canEdit ? 'View and manage team schedules' : 'View your schedule'}
          </p>
        </div>

        {/* Filters - Only show for TL/WFM */}
        {canEdit && (
          <div className="mt-4 flex items-end gap-4 sm:mt-0">
            {/* Skills Filter */}
            <div className="w-56">
              <SkillsFilter selectedSkillIds={selectedSkillIds} onChange={setSelectedSkillIds} />
            </div>

            {/* Agent Filter */}
            <div className="w-56">
              <label
                htmlFor="agent-filter"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Filter by Agent
              </label>
              <select
                id="agent-filter"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Agents</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow">
        <button
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900">{format(currentDate, 'MMMM yyyy')}</h2>
        <button
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Schedule grid */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 z-20 bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-30 min-w-[120px] bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] sm:min-w-[150px]"
                  >
                    Name
                  </th>
                  {daysInMonth.map((day) => (
                    <th
                      key={day.toISOString()}
                      scope="col"
                      className="min-w-[50px] bg-gray-50 px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 sm:min-w-[60px]"
                    >
                      <div className="sr-only">{format(day, 'EEEE')}</div>
                      <div aria-hidden="true">{format(day, 'EEE')}</div>
                      <div className="text-gray-900">{format(day, 'd')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                    >
                      {u.name}
                    </th>
                    {daysInMonth.map((day) => {
                      const shift = getShiftForUserAndDate(u.id, day);
                      const leave = getLeaveForUserAndDate(u.id, day);
                      const isOnLeave = !!leave;
                      const dateStr = format(day, 'MMMM d, yyyy');

                      return (
                        <td
                          key={day.toISOString()}
                          className={`px-2 py-3 text-center ${canEdit ? 'cursor-pointer hover:bg-gray-50' : ''} ${isOnLeave ? 'bg-opacity-50' : ''}`}
                          onClick={() => canEdit && handleShiftClick(u.id, day)}
                          onKeyDown={(e) => {
                            if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              handleShiftClick(u.id, day);
                            }
                          }}
                          tabIndex={canEdit ? 0 : -1}
                          role={canEdit ? 'button' : undefined}
                          aria-label={
                            isOnLeave
                              ? `${u.name} on ${leave.leave_type} leave on ${dateStr}${canEdit ? ', press Enter to edit' : ''}`
                              : shift
                                ? `${u.name} has ${shift.shift_type} shift on ${dateStr}${canEdit ? ', press Enter to edit' : ''}`
                                : canEdit
                                  ? `No shift for ${u.name} on ${dateStr}, press Enter to add`
                                  : `No shift for ${u.name} on ${dateStr}`
                          }
                          title={
                            isOnLeave
                              ? `On ${leave.leave_type} leave${canEdit ? ' (click to edit)' : ''}`
                              : undefined
                          }
                        >
                          {isOnLeave ? (
                            <div className="relative">
                              <span
                                className="inline-flex items-center rounded border px-2 py-1 text-xs font-medium"
                                style={{
                                  backgroundColor:
                                    leaveTypes.find((lt) => lt.code === leave.leave_type)?.color ||
                                    '#E5E7EB',
                                  color: '#1F2937',
                                  borderColor:
                                    leaveTypes.find((lt) => lt.code === leave.leave_type)?.color ||
                                    '#D1D5DB',
                                }}
                              >
                                {getLeaveTypeLabel(leave.leave_type as LeaveType)}
                              </span>
                            </div>
                          ) : shift ? (
                            <div className="relative">
                              <span
                                className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${SHIFT_COLORS[shift.shift_type]}`}
                              >
                                {SHIFT_LABELS[shift.shift_type]}
                              </span>
                              {shift.swapped_with_user_id && (
                                <div
                                  className="mt-1 truncate text-xs text-gray-500"
                                  title={`Swapped with ${swappedUserNames[shift.swapped_with_user_id] || 'Unknown'}`}
                                >
                                  â{' '}
                                  {swappedUserNames[shift.swapped_with_user_id]?.split(' ')[0] ||
                                    '?'}
                                </div>
                              )}
                            </div>
                          ) : canEdit ? (
                            <span className="text-xs text-gray-300">+</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="mb-3 text-sm font-medium text-gray-700">Legend</h3>
        <div className="space-y-3">
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase text-gray-500">Shifts</h4>
            <div className="flex flex-wrap gap-4">
              {Object.entries(SHIFT_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${color}`}
                  >
                    {SHIFT_LABELS[type as ShiftType]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase text-gray-500">Leave Types</h4>
            <div className="flex flex-wrap gap-4">
              {loadingLeaveTypes ? (
                <div className="text-sm text-gray-500">Loading leave types...</div>
              ) : leaveTypes.length === 0 ? (
                <div className="text-sm text-gray-500">No leave types configured</div>
              ) : (
                leaveTypes
                  .filter((lt) => lt.is_active)
                  .map((leaveType) => (
                    <div key={leaveType.id} className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center rounded border px-2 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: leaveType.color,
                          color: '#1F2937',
                          borderColor: leaveType.color,
                        }}
                      >
                        {leaveType.label}
                      </span>
                      {leaveType.description && (
                        <span className="text-sm text-gray-600">{leaveType.description}</span>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shift edit modal */}
      {editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              {editingShift.existingLeave
                ? 'Edit Leave/Shift'
                : editingShift.shiftId
                  ? 'Edit Shift'
                  : 'Add Shift/Leave'}
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Date: {format(new Date(editingShift.date), 'EEEE, MMMM d, yyyy')}
            </p>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Shift Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(SHIFT_COLORS) as ShiftType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedShiftType(type);
                      setSelectedLeaveTypeCode(null);
                    }}
                    className={`rounded-lg border-2 p-3 transition-colors ${
                      selectedShiftType === type && !selectedLeaveTypeCode
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${SHIFT_COLORS[type]}`}
                    >
                      {SHIFT_LABELS[type]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Leave Type Assignment */}
            <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700">Or Assign Leave</label>
              <div className="grid grid-cols-2 gap-3">
                {loadingLeaveTypes ? (
                  <div className="col-span-2 text-center text-sm text-gray-500">
                    Loading leave types...
                  </div>
                ) : leaveTypes.filter((lt) => lt.is_active).length === 0 ? (
                  <div className="col-span-2 text-center text-sm text-gray-500">
                    No leave types available
                  </div>
                ) : (
                  leaveTypes
                    .filter((lt) => lt.is_active)
                    .map((leaveType) => (
                      <button
                        key={leaveType.id}
                        onClick={() => {
                          setSelectedLeaveTypeCode(leaveType.code);
                          setSelectedShiftType(null);
                        }}
                        className={`rounded-lg border-2 p-3 transition-colors ${
                          selectedLeaveTypeCode === leaveType.code
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span
                          className="inline-flex items-center rounded border px-2 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: leaveType.color,
                            color: '#1F2937',
                            borderColor: leaveType.color,
                          }}
                        >
                          {leaveType.label}
                        </span>
                      </button>
                    ))
                )}
              </div>
              {selectedLeaveTypeCode && (
                <button
                  onClick={() => {
                    setSelectedLeaveTypeCode(null);
                    setSelectedShiftType('AM');
                  }}
                  className="text-sm text-gray-500 underline hover:text-gray-700"
                >
                  Clear leave selection
                </button>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <div>
                {(editingShift.shiftId || editingShift.existingLeave) && (
                  <button
                    onClick={deleteShift}
                    disabled={savingShift}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingShift(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={saveShift}
                  disabled={savingShift}
                  className="rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
                >
                  {savingShift ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
