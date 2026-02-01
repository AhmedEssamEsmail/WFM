import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { User, LeaveType } from '../types'


interface UserWithBalances extends User {
  balances: Record<LeaveType, number>
}

const leaveTypeLabels: Record<LeaveType, string> = {
  annual: 'Annual',
  casual: 'Casual',
  sick: 'Sick',
  public_holiday: 'Public Holiday',
  bereavement: 'Bereavement'
}

const leaveTypeOrder: LeaveType[] = ['annual', 'casual', 'sick', 'public_holiday', 'bereavement']

interface ParsedBalanceRow {
  email: string
  userId?: string
  userName?: string
  balances: Partial<Record<LeaveType, number>>
  error?: string
}

export default function LeaveBalances() {
  const { user } = useAuth()
  const [usersWithBalances, setUsersWithBalances] = useState<UserWithBalances[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<{ userId: string; leaveType: LeaveType } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Import/Export state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsedImport, setParsedImport] = useState<ParsedBalanceRow[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)

  useEffect(() => {
    fetchLeaveBalances()
  }, [user])

  async function fetchLeaveBalances() {
    if (!user) return
    setLoading(true)

    try {
      // Fetch users based on role
      let usersQuery = supabase.from('users').select('*')
      
      if (user.role === 'agent') {
        usersQuery = usersQuery.eq('id', user.id)
      }
      // TL and WFM see all users

      const { data: usersData, error: usersError } = await usersQuery.order('name')
      if (usersError) throw usersError

      // Fetch leave balances
      let balancesQuery = supabase.from('leave_balances').select('*')
      
      if (user.role === 'agent') {
        balancesQuery = balancesQuery.eq('user_id', user.id)
      }

      const { data: balancesData, error: balancesError } = await balancesQuery
      if (balancesError) throw balancesError

      // Combine users with their balances
      const balanceMap = new Map<string, Record<LeaveType, number>>()
      
      balancesData?.forEach(b => {
        if (!balanceMap.has(b.user_id)) {
          balanceMap.set(b.user_id, {} as Record<LeaveType, number>)
        }
        balanceMap.get(b.user_id)![b.leave_type as LeaveType] = parseFloat(b.balance)
      })

      const combined: UserWithBalances[] = (usersData || []).map(u => ({
        ...u,
        balances: balanceMap.get(u.id) || {} as Record<LeaveType, number>
      }))

      setUsersWithBalances(combined)
    } catch (error) {
      console.error('Error fetching leave balances:', error)
      setError('Failed to load leave balances')
    } finally {
      setLoading(false)
    }
  }

  function startEditing(userId: string, leaveType: LeaveType, currentValue: number) {
    if (user?.role !== 'wfm') return
    setEditingCell({ userId, leaveType })
    setEditValue(currentValue?.toString() || '0')
    setError('')
  }

  function cancelEditing() {
    setEditingCell(null)
    setEditValue('')
  }

  async function saveEdit() {
    if (!editingCell || !user) return

    const newBalance = parseFloat(editValue)
    if (isNaN(newBalance) || newBalance < 0) {
      setError('Please enter a valid positive number')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Get current balance for history
      const userBalances = usersWithBalances.find(u => u.id === editingCell.userId)?.balances
      const currentBalance = userBalances?.[editingCell.leaveType] || 0

      // Update the balance
      const { error: updateError } = await supabase
        .from('leave_balances')
        .upsert({
          user_id: editingCell.userId,
          leave_type: editingCell.leaveType,
          balance: newBalance,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,leave_type' })

      if (updateError) throw updateError

      // Record in history (optional - won't fail if table doesn't exist)
      try {
        await supabase.from('leave_balance_history').insert({
          user_id: editingCell.userId,
          leave_type: editingCell.leaveType,
          change_amount: newBalance - currentBalance,
          reason: 'manual_adjustment',
          balance_before: currentBalance,
          balance_after: newBalance,
          created_by: user.id
        })
      } catch (historyError) {
        // Ignore history errors - not critical
        console.warn('Could not record balance history:', historyError)
      }

      // Update local state
      setUsersWithBalances(prev => prev.map(u => {
        if (u.id === editingCell.userId) {
          return {
            ...u,
            balances: {
              ...u.balances,
              [editingCell.leaveType]: newBalance
            }
          }
        }
        return u
      }))

      setEditingCell(null)
      setEditValue('')
    } catch (error) {
      console.error('Error updating balance:', error)
      setError('Failed to update balance')
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  // Export functionality
  async function handleExport() {
    try {
      // Create CSV headers
      const headers = ['email', 'name', ...leaveTypeOrder.map(lt => leaveTypeLabels[lt])]
      
      // Create rows
      const rows = usersWithBalances.map(user => [
        user.email,
        user.name,
        ...leaveTypeOrder.map(lt => (user.balances[lt] || 0).toFixed(2))
      ])
      
      // Convert to CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `leave_balances_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Export error:', err)
      setError('Failed to export leave balances')
    }
  }

  // Import functionality
  function parseImportCSV(content: string): ParsedBalanceRow[] {
    const lines = content.trim().split('\n')
    const rows: ParsedBalanceRow[] = []
    
    if (lines.length < 2) return rows
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const emailIndex = headers.indexOf('email')
    
    if (emailIndex === -1) {
      setError('CSV must have an "email" column')
      return []
    }
    
    // Map headers to leave types
    const leaveTypeIndices: { index: number; type: LeaveType }[] = []
    leaveTypeOrder.forEach(lt => {
      const label = leaveTypeLabels[lt].toLowerCase()
      const index = headers.indexOf(label)
      if (index !== -1) {
        leaveTypeIndices.push({ index, type: lt })
      }
    })
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const cells = line.split(',').map(c => c.trim())
      const email = cells[emailIndex]
      
      if (!email || !email.includes('@')) continue
      
      const balances: Partial<Record<LeaveType, number>> = {}
      
      leaveTypeIndices.forEach(({ index, type }) => {
        const value = parseFloat(cells[index])
        if (!isNaN(value) && value >= 0) {
          balances[type] = value
        }
      })
      
      rows.push({ email, balances })
    }
    
    return rows
  }

  async function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setParsedImport(null)
    setImportResult(null)
    setError('')

    try {
      const content = await selectedFile.text()
      const parsed = parseImportCSV(content)
      
      if (parsed.length === 0) {
        setError('No valid data found in CSV')
        return
      }
      
      // Resolve emails to user IDs
      const emails = parsed.map(r => r.email)
      const { data: users } = await supabase
        .from('users')
        .select('id, email, name')
        .in('email', emails)
      
      const userMap = new Map(users?.map(u => [u.email.toLowerCase(), { id: u.id, name: u.name }]) || [])
      
      parsed.forEach(row => {
        const userData = userMap.get(row.email.toLowerCase())
        if (userData) {
          row.userId = userData.id
          row.userName = userData.name
        } else {
          row.error = 'User not found'
        }
      })
      
      setParsedImport(parsed)
    } catch (err) {
      console.error('Parse error:', err)
      setError('Failed to parse CSV file')
    }
  }

  async function handleImportUpload() {
    if (!parsedImport || !user) return
    
    setImporting(true)
    setError('')
    
    try {
      let successCount = 0
      let failedCount = 0
      
      for (const row of parsedImport) {
        if (!row.userId || row.error) {
          failedCount++
          continue
        }
        
        // Get current balances for history
        const currentUser = usersWithBalances.find(u => u.id === row.userId)
        
        for (const [leaveType, newBalance] of Object.entries(row.balances)) {
          try {
            const currentBalance = currentUser?.balances[leaveType as LeaveType] || 0
            
            // Update balance
            const { error: upsertError } = await supabase
              .from('leave_balances')
              .upsert({
                user_id: row.userId,
                leave_type: leaveType,
                balance: newBalance,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id,leave_type' })
            
            if (upsertError) throw upsertError
            
            // Record in history (optional)
            try {
              await supabase.from('leave_balance_history').insert({
                user_id: row.userId,
                leave_type: leaveType,
                change_amount: newBalance - currentBalance,
                reason: 'csv_import',
                balance_before: currentBalance,
                balance_after: newBalance,
                created_by: user.id
              })
            } catch (historyError) {
              // Ignore history errors
              console.warn('Could not record balance history:', historyError)
            }
            
            successCount++
          } catch (err) {
            console.error('Balance update error:', err)
            failedCount++
          }
        }
      }
      
      setImportResult({ success: successCount, failed: failedCount })
      await fetchLeaveBalances() // Refresh data
    } catch (err) {
      console.error('Import error:', err)
      setError('Failed to import leave balances')
    } finally {
      setImporting(false)
    }
  }

  function resetImport() {
    setParsedImport(null)
    setImportResult(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Balances</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'wfm' 
              ? 'View and edit leave balances for all users' 
              : user?.role === 'tl'
                ? 'View leave balances for your team'
                : 'View your leave balances'}
          </p>
        </div>
        
        {/* Import/Export Buttons - WFM only */}
        {user?.role === 'wfm' && (
          <div className="flex gap-3">
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Import Preview/Results */}
      {parsedImport && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              Import Preview ({parsedImport.length} users)
            </h3>
            <button onClick={resetImport} className="text-sm text-gray-600 hover:text-gray-800">
              Clear
            </button>
          </div>
          
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Balances</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parsedImport.map((row, i) => (
                  <tr key={i} className={row.error ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2">
                      {row.error ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Error
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Ready
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">{row.email}</td>
                    <td className="px-4 py-2 text-sm">
                      {row.userName || <span className="text-red-600">{row.error}</span>}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
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
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importing...
                  </>
                ) : (
                  'Import Balances'
                )}
              </button>
            </div>
          )}
          
          {importResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Successfully imported <span className="font-bold">{importResult.success}</span> balance(s).
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">WFM Tip:</span> Click on any balance cell to edit it directly. 
            Use Import CSV to bulk update balances (CSV format: email, name, Annual, Casual, Sick, Public Holiday, Bereavement).
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Balances Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                {leaveTypeOrder.map(lt => (
                  <th 
                    key={lt}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {leaveTypeLabels[lt]}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usersWithBalances.map(u => {
                const total = leaveTypeOrder.reduce((acc, lt) => acc + (u.balances[lt] || 0), 0)
                
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{u.name}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        u.role === 'wfm' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'tl' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role === 'wfm' ? 'WFM' : u.role === 'tl' ? 'Team Lead' : 'Agent'}
                      </span>
                    </td>
                    {leaveTypeOrder.map(lt => {
                      const balance = u.balances[lt] || 0
                      const isEditing = editingCell?.userId === u.id && editingCell?.leaveType === lt
                      const canEdit = user?.role === 'wfm'

                      return (
                        <td 
                          key={lt}
                          className={`px-4 py-4 text-center ${canEdit ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                          onClick={() => !isEditing && canEdit && startEditing(u.id, lt, balance)}
                        >
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.25"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-16 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <span className={`text-sm font-medium ${balance > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                              {balance.toFixed(2)}
                            </span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-bold text-primary-600">
                        {total.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {usersWithBalances.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">No users found</p>
        </div>
      )}

      {/* Accrual Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Monthly Accrual Information</h3>
        <p className="text-sm text-gray-600">
          Leave balances are accrued monthly on the 1st of each month:
        </p>
        <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
          <li>Annual Leave: +1.25 days per month (15 days per year)</li>
          <li>Casual Leave: +0.5 days per month (6 days per year)</li>
          <li>Sick, Public Holiday, and Bereavement leave are typically allocated manually or per policy</li>
        </ul>
      </div>
    </div>
  )
}
