import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { User, LeaveType } from '../types'

interface LeaveBalance {
  id: string
  user_id: string
  leave_type: LeaveType
  balance: number
  updated_at: string
}

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

export default function LeaveBalances() {
  const { user } = useAuth()
  const [usersWithBalances, setUsersWithBalances] = useState<UserWithBalances[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<{ userId: string; leaveType: LeaveType } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

      // Record in history
      await supabase.from('leave_balance_history').insert({
        user_id: editingCell.userId,
        leave_type: editingCell.leaveType,
        change_amount: newBalance - currentBalance,
        reason: 'manual_adjustment',
        balance_before: currentBalance,
        balance_after: newBalance,
        created_by: user.id
      })

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
      </div>

      {/* Info box for WFM */}
      {user?.role === 'wfm' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">WFM Tip:</span> Click on any balance cell to edit it directly. 
            Changes are recorded in the balance history for auditing.
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
