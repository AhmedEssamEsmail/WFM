import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useLeaveTypes } from '../../hooks/useLeaveTypes';
import { User, LeaveType } from '../../types';
import { leaveBalancesService } from '../../services';
import { downloadCSV, parseCSV, arrayToCSV } from '../../utils';
import { ERROR_MESSAGES } from '../../constants';

interface UserWithBalances extends User {
  balances: Record<LeaveType, number>;
}

interface ParsedBalanceRow {
  email: string;
  userId?: string;
  userName?: string;
  balances: Partial<Record<LeaveType, number>>;
  error?: string;
}

export default function LeaveBalances() {
  const { user } = useAuth();
  const { leaveTypes } = useLeaveTypes();
  const [usersWithBalances, setUsersWithBalances] = useState<UserWithBalances[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ userId: string; leaveType: LeaveType } | null>(
    null
  );
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Import/Export state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedImport, setParsedImport] = useState<ParsedBalanceRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(
    null
  );

  // Filter users based on search query
  const filteredUsers = usersWithBalances.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get leave type order from database
  const leaveTypeOrder = leaveTypes.map((lt) => lt.code);

  // Create label mapping from database
  const leaveTypeLabels: Record<LeaveType, string> = leaveTypes.reduce(
    (acc, lt) => {
      acc[lt.code] = lt.label;
      return acc;
    },
    {} as Record<LeaveType, string>
  );

  const fetchLeaveBalances = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch users based on role
      let usersQuery = supabase.from('users').select('*');

      if (user.role === 'agent') {
        usersQuery = usersQuery.eq('id', user.id);
      } else if (user.role === 'tl') {
        // TL sees only their team members (same department/team)
        // For now, TL sees all users - adjust if team filtering is needed
      }
      // WFM sees all users

      const { data: usersData, error: usersError } = await usersQuery.order('name');
      if (usersError) throw usersError;

      // Fetch leave balances - use Supabase directly since service doesn't have getAllLeaveBalances
      let balancesQuery = supabase.from('leave_balances').select('*');

      if (user.role === 'agent') {
        balancesQuery = balancesQuery.eq('user_id', user.id);
      }
      // TL and WFM see all balances

      const { data: balancesData, error: balancesError } = await balancesQuery;
      if (balancesError) throw balancesError;

      // Combine users with their balances
      const balanceMap = new Map<string, Record<LeaveType, number>>();

      balancesData?.forEach(
        (b: { user_id: string; leave_type: LeaveType; balance: string | number }) => {
          if (!balanceMap.has(b.user_id)) {
            balanceMap.set(b.user_id, {} as Record<LeaveType, number>);
          }
          balanceMap.get(b.user_id)![b.leave_type as LeaveType] = parseFloat(String(b.balance));
        }
      );

      const combined: UserWithBalances[] = (usersData || []).map((u) => ({
        ...u,
        balances: balanceMap.get(u.id) || ({} as Record<LeaveType, number>),
      }));

      setUsersWithBalances(combined);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      setError(ERROR_MESSAGES.SERVER);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaveBalances();
  }, [user, fetchLeaveBalances]);

  function startEditing(userId: string, leaveType: LeaveType, currentValue: number) {
    if (user?.role !== 'wfm') return;
    setEditingCell({ userId, leaveType });
    setEditValue(currentValue?.toString() || '0');
    setError('');
  }

  function cancelEditing() {
    setEditingCell(null);
    setEditValue('');
  }

  async function saveEdit() {
    if (!editingCell || !user) return;

    const newBalance = parseFloat(editValue);
    if (isNaN(newBalance) || newBalance < 0) {
      setError('Please enter a valid positive number');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Get current balance for history
      const userBalances = usersWithBalances.find((u) => u.id === editingCell.userId)?.balances;
      const currentBalance = userBalances?.[editingCell.leaveType] || 0;

      // Update the balance using service
      await leaveBalancesService.updateLeaveBalance(
        editingCell.userId,
        editingCell.leaveType,
        newBalance
      );

      // Record in history (optional - won't fail if table doesn't exist)
      try {
        await supabase.from('leave_balance_history').insert({
          user_id: editingCell.userId,
          leave_type: editingCell.leaveType,
          previous_balance: currentBalance,
          new_balance: newBalance,
          change_reason: 'manual_adjustment',
          changed_by: user.id,
        });
      } catch (historyError) {
        // Ignore history errors - not critical
        console.warn('Could not record balance history:', historyError);
      }

      // Update local state
      setUsersWithBalances((prev) =>
        prev.map((u) => {
          if (u.id === editingCell.userId) {
            return {
              ...u,
              balances: {
                ...u.balances,
                [editingCell.leaveType]: newBalance,
              },
            };
          }
          return u;
        })
      );

      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating balance:', error);
      setError(ERROR_MESSAGES.SERVER);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }

  // Export functionality
  async function handleExport() {
    try {
      // Create CSV data
      const csvData = usersWithBalances.map((user) => ({
        email: user.email,
        name: user.name,
        ...Object.fromEntries(
          leaveTypeOrder.map((lt) => [leaveTypeLabels[lt], (user.balances[lt] || 0).toFixed(2)])
        ),
      }));

      // Convert to CSV and download
      const csvContent = arrayToCSV(csvData);
      const filename = `leave_balances_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(filename, csvContent);
    } catch (err) {
      console.error('Export error:', err);
      setError(ERROR_MESSAGES.SERVER);
    }
  }

  // Import functionality
  function parseImportCSV(content: string): ParsedBalanceRow[] {
    const rows: ParsedBalanceRow[] = [];

    try {
      // Use CSV helper to parse
      const parsed = parseCSV<Record<string, string>>(content);

      if (parsed.length < 1) return rows;

      // Get headers from first row keys
      const firstRow = parsed[0];
      const headers = Object.keys(firstRow).map((h) => h.trim().toLowerCase());
      const emailIndex = headers.indexOf('email');

      if (emailIndex === -1) {
        setError('CSV must have an "email" column');
        return [];
      }

      // Map headers to leave types
      const leaveTypeMap: Record<string, LeaveType> = {};
      leaveTypeOrder.forEach((lt) => {
        const label = leaveTypeLabels[lt].toLowerCase();
        const headerKey = Object.keys(firstRow).find((k) => k.trim().toLowerCase() === label);
        if (headerKey) {
          leaveTypeMap[headerKey] = lt;
        }
      });

      // Parse data rows
      for (const row of parsed) {
        const email = row[Object.keys(firstRow)[emailIndex]]?.trim();

        if (!email || !email.includes('@')) continue;

        const balances: Partial<Record<LeaveType, number>> = {};

        Object.entries(leaveTypeMap).forEach(([headerKey, leaveType]) => {
          const value = parseFloat(row[headerKey]);
          if (!isNaN(value) && value >= 0) {
            balances[leaveType] = value;
          }
        });

        rows.push({ email, balances });
      }

      return rows;
    } catch (err) {
      console.error('CSV parse error:', err);
      setError('Failed to parse CSV file');
      return [];
    }
  }

  async function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setParsedImport(null);
    setImportResult(null);
    setError('');

    try {
      const content = await selectedFile.text();
      const parsed = parseImportCSV(content);

      if (parsed.length === 0) {
        setError('No valid data found in CSV');
        return;
      }

      // Resolve emails to user IDs
      const emails = parsed.map((r) => r.email);
      const { data: users } = await supabase
        .from('users')
        .select('id, email, name')
        .in('email', emails);

      const userMap = new Map(
        users?.map((u) => [u.email.toLowerCase(), { id: u.id, name: u.name }]) || []
      );

      parsed.forEach((row) => {
        const userData = userMap.get(row.email.toLowerCase());
        if (userData) {
          row.userId = userData.id;
          row.userName = userData.name;
        } else {
          row.error = 'User not found';
        }
      });

      setParsedImport(parsed);
    } catch (err) {
      console.error('Parse error:', err);
      setError(ERROR_MESSAGES.SERVER);
    }
  }

  async function handleImportUpload() {
    if (!parsedImport || !user) return;

    setImporting(true);
    setError('');

    try {
      let successCount = 0;
      let failedCount = 0;

      for (const row of parsedImport) {
        if (!row.userId || row.error) {
          failedCount++;
          continue;
        }

        // Get current balances for history
        const currentUser = usersWithBalances.find((u) => u.id === row.userId);

        for (const [leaveType, newBalance] of Object.entries(row.balances)) {
          if (typeof newBalance !== 'number') continue;

          try {
            const currentBalance = currentUser?.balances[leaveType as LeaveType] || 0;

            // Update balance using service
            await leaveBalancesService.updateLeaveBalance(
              row.userId,
              leaveType as LeaveType,
              newBalance
            );

            // Record in history (optional)
            try {
              await supabase.from('leave_balance_history').insert({
                user_id: row.userId,
                leave_type: leaveType,
                previous_balance: currentBalance,
                new_balance: newBalance,
                change_reason: 'csv_import',
                changed_by: user.id,
              });
            } catch (historyError) {
              // Ignore history errors
              console.warn('Could not record balance history:', historyError);
            }

            successCount++;
          } catch (err) {
            console.error('Balance update error:', err);
            failedCount++;
          }
        }
      }

      setImportResult({ success: successCount, failed: failedCount });
      await fetchLeaveBalances(); // Refresh data
    } catch (err) {
      console.error('Import error:', err);
      setError(ERROR_MESSAGES.SERVER);
    } finally {
      setImporting(false);
    }
  }

  function resetImport() {
    setParsedImport(null);
    setImportResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="sm:flex sm:items-start sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">Leave Balances</h1>
          <p className="mt-1 text-sm text-gray-600">
            {user?.role === 'wfm'
              ? 'View and edit leave balances for all users'
              : user?.role === 'tl'
                ? 'View leave balances for your team'
                : 'View your leave balances'}
          </p>
        </div>

        {/* Import/Export Buttons - WFM only */}
        {user?.role === 'wfm' && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import CSV
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportFileChange}
                className="hidden"
              />
            </label>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Search Filter - Show for TL and WFM */}
      {(user?.role === 'tl' || user?.role === 'wfm') && (
        <div className="rounded-lg bg-white p-4 shadow">
          <label htmlFor="search-agent" className="mb-2 block text-sm font-medium text-gray-700">
            Search by Name or Email
          </label>
          <div className="relative">
            <input
              id="search-agent"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to filter users..."
              className="block w-full rounded-md border-gray-300 pl-10 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-xs text-gray-500">
              Showing {filteredUsers.length} of {usersWithBalances.length} users
            </p>
          )}
        </div>
      )}

      {/* Import Preview/Results */}
      {parsedImport && (
        <div className="space-y-3 rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Import Preview ({parsedImport.length} users)
            </h3>
            <button onClick={resetImport} className="text-xs text-gray-600 hover:text-gray-800">
              Clear
            </button>
          </div>

          <div className="max-h-60 overflow-x-auto overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">User</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Balances
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parsedImport.map((row, i) => (
                  <tr key={i} className={row.error ? 'bg-red-50' : ''}>
                    <td className="px-3 py-2">
                      {row.error ? (
                        <span className="inline-flex rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
                          Error
                        </span>
                      ) : (
                        <span className="inline-flex rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
                          Ready
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">{row.email}</td>
                    <td className="px-3 py-2 text-xs">
                      {row.userName || <span className="text-red-600">{row.error}</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {Object.keys(row.balances).length} type(s)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!importResult && (
            <div className="flex justify-end">
              <button
                onClick={handleImportUpload}
                disabled={importing}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Importing...
                  </>
                ) : (
                  'Import Balances'
                )}
              </button>
            </div>
          )}

          {importResult && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-xs text-green-800">
                Successfully imported <span className="font-bold">{importResult.success}</span>{' '}
                balance(s).
                {importResult.failed > 0 && (
                  <span className="text-red-600"> {importResult.failed} failed.</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info box for WFM */}
      {user?.role === 'wfm' && !parsedImport && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-800">
            <span className="font-medium">WFM Tip:</span> Click on any balance cell to edit it
            directly. Use Import CSV to bulk update balances.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Balances Cards - Mobile Friendly */}
      <div className="space-y-3">
        {filteredUsers.map((u) => {
          const total = leaveTypeOrder.reduce((acc, lt) => acc + (u.balances[lt] || 0), 0);

          return (
            <div key={u.id} className="overflow-hidden rounded-lg bg-white shadow">
              {/* User Header */}
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
                    <p className="truncate text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span
                    className={`ml-2 inline-flex whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${
                      u.role === 'wfm'
                        ? 'bg-purple-100 text-purple-800'
                        : u.role === 'tl'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {u.role === 'wfm' ? 'WFM' : u.role === 'tl' ? 'TL' : 'Agent'}
                  </span>
                </div>
              </div>

              {/* Balances Grid */}
              <div className="p-3">
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {leaveTypeOrder.map((lt) => {
                    const balance = u.balances[lt] || 0;
                    const isEditing = editingCell?.userId === u.id && editingCell?.leaveType === lt;
                    const canEdit = user?.role === 'wfm';

                    return (
                      <div
                        key={lt}
                        className={`rounded-lg bg-gray-50 p-2 ${canEdit && !isEditing ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                        onClick={() => !isEditing && canEdit && startEditing(u.id, lt, balance)}
                      >
                        <p className="mb-1 text-xs text-gray-500">{leaveTypeLabels[lt]}</p>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.25"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="w-full rounded border border-blue-500 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="flex-shrink-0 rounded p-1 text-green-600 hover:bg-green-100"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="flex-shrink-0 rounded p-1 text-red-600 hover:bg-red-100"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <p
                            className={`text-base font-semibold ${balance > 0 ? 'text-gray-900' : 'text-gray-400'}`}
                          >
                            {balance.toFixed(2)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Total Balance</span>
                    <span className="text-base font-bold text-primary-600">{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="rounded-lg bg-white py-12 text-center shadow">
          <p className="text-sm text-gray-500">
            {searchQuery ? 'No users match your search' : 'No users found'}
          </p>
        </div>
      )}

      {/* Accrual Info */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <h3 className="mb-2 text-sm font-medium text-gray-900">Monthly Accrual Information</h3>
        <p className="mb-2 text-xs text-gray-600">
          Leave balances are accrued monthly on the 1st of each month:
        </p>
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• Annual Leave: +1.25 days per month (15 days per year)</li>
          <li>• Casual Leave: +0.5 days per month (6 days per year)</li>
          <li>• Sick, Public Holiday, and Bereavement leave are typically allocated manually</li>
        </ul>
      </div>
    </div>
  );
}
