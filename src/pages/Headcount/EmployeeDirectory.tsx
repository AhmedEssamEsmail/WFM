import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useHeadcount } from '../../hooks/useHeadcount'
import { useAuth } from '../../hooks/useAuth'
import type { HeadcountUser, Department } from '../../types'

export default function EmployeeDirectory() {
  const { canEditHeadcount } = useAuth()
  const { getEmployees, getDepartments, loading } = useHeadcount()
  const [employees, setEmployees] = useState<HeadcountUser[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    role: '',
    search: '',
  })

  useEffect(() => {
    loadDepartments()
    loadEmployees()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadEmployees()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [filters])

  async function loadDepartments() {
    const depts = await getDepartments()
    setDepartments(depts)
  }

  async function loadEmployees() {
    const data = await getEmployees(filters)
    setEmployees(data)
  }

  const clearFilters = useCallback(() => {
    setFilters({ department: '', status: '', role: '', search: '' })
  }, [])

  const hasActiveFilters = filters.department || filters.status || filters.role || filters.search

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Employee Directory</h1>
        <p className="text-sm text-gray-600">View and manage workforce</p>
      </div>

      {/* Filters - Stack on mobile */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Name, email, or ID..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="agent">Agent</option>
              <option value="tl">Team Lead</option>
              <option value="wfm">WFM</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs sm:text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Employees ({employees.length})
          </h2>
          {!canEditHeadcount() && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              View Only
            </span>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FTE</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/headcount/employees/${employee.id}`} className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.employee_id || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.department || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.role === 'agent' ? 'bg-blue-100 text-blue-800' :
                        employee.role === 'tl' ? 'bg-purple-100 text-purple-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {employee.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.status === 'active' ? 'bg-green-100 text-green-800' :
                        employee.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.manager_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.fte_percentage * 100}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))
          ) : (
            employees.map((employee) => (
              <Link 
                key={employee.id} 
                to={`/headcount/employees/${employee.id}`}
                className="block p-4 hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="flex items-start space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold flex-shrink-0">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 truncate">{employee.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${
                        employee.status === 'active' ? 'bg-green-100 text-green-800' :
                        employee.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.status === 'on_leave' ? 'Leave' : employee.status}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="text-gray-500">
                        {employee.department || 'No dept'}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className={`font-medium ${
                        employee.role === 'agent' ? 'text-blue-600' :
                        employee.role === 'tl' ? 'text-purple-600' :
                        'text-indigo-600'
                      }`}>
                        {employee.role.toUpperCase()}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">
                        FTE: {employee.fte_percentage * 100}%
                      </span>
                    </div>
                    
                    {employee.manager_name && (
                      <p className="mt-1 text-xs text-gray-400">
                        Manager: {employee.manager_name}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
      }
