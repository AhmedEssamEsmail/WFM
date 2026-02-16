import { useEffect, useState, useCallback, useRef } from 'react'
import { useHeadcount } from '../../hooks/useHeadcount'
import { useAuth } from '../../hooks/useAuth'
import type { HeadcountUser, Department, UserRole } from '../../types'
import { downloadCSV, arrayToCSV } from '../../utils'
import EmployeeCard from '../../components/Headcount/EmployeeCard'
import EditEmployeeModal from '../../components/Headcount/EditEmployeeModal'

export default function EmployeeDirectory() {
  const { canEditHeadcount } = useAuth()
  const { getEmployees, getDepartments, bulkImportEmployees, updateEmployee, loading } = useHeadcount()
  const [employees, setEmployees] = useState<HeadcountUser[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [editingEmployee, setEditingEmployee] = useState<HeadcountUser | null>(null)
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    role: '',
    search: '',
  })
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{
    success: number
    failed: number
    errors: { row: number; email: string; error: string }[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDepartments = useCallback(async () => {
    const depts = await getDepartments()
    setDepartments(depts)
  }, [getDepartments])

  const loadEmployees = useCallback(async () => {
    const data = await getEmployees(filters)
    setEmployees(data)
  }, [getEmployees, filters])

  useEffect(() => {
    loadDepartments()
    loadEmployees()
  }, [loadDepartments, loadEmployees])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadEmployees()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [filters, loadEmployees])

  const clearFilters = useCallback(() => {
    setFilters({ department: '', status: '', role: '', search: '' })
  }, [])

  // Export to CSV
  const handleExport = useCallback(() => {
    const csvData = employees.map(emp => ({
      'Employee ID': emp.employee_id || '',
      'Name': emp.name || '',
      'Email': emp.email || '',
      'Department': emp.department || '',
      'Role': emp.role || '',
      'Status': emp.status || '',
      'Job Title': emp.job_title || '',
      'Job Level': emp.job_level || '',
      'Employment Type': emp.employment_type || '',
      'Location': emp.location || '',
      'Manager': emp.manager_name || '',
      'Hire Date': emp.hire_date || '',
    }))

    const csvContent = arrayToCSV(csvData)
    const filename = `employees_export_${new Date().toISOString().split('T')[0]}.csv`
    downloadCSV(filename, csvContent)
  }, [employees])

  // Download CSV template
  const handleDownloadTemplate = useCallback(() => {
    const headers = [
      'Employee ID',
      'Name',
      'Email',
      'Department',
      'Role',
      'Status',
      'Job Title',
      'Job Level',
      'Employment Type',
      'Location',
      'Hire Date',
    ]

    const sampleRow = [
      'EMP001',
      'John Doe',
      'john.doe@dabdoob.com',
      'Customer Support',
      'agent',
      'active',
      'Customer Support Agent',
      'junior',
      'full_time',
      'Dubai Office',
      '2024-01-15',
    ]

    const csvContent = [
      headers.join(','),
      sampleRow.map(cell => `"${cell}"`).join(',')
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'employee_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  // Import from CSV
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResults(null)
    
    try {
      const text = await file.text()
      const rows = text.split('\n').map(row => {
        const matches = row.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)
        return matches?.map(field => field.replace(/^"|"$/g, '').trim()) || []
      })

      const headers = rows[0]
      const dataRows = rows.slice(1).filter(row => row.length > 1 && row.some(cell => cell))

      // Map CSV columns to HeadcountUser fields
      const employeesToImport: Partial<HeadcountUser>[] = dataRows.map(row => {
        const employee: Partial<HeadcountUser> = {}
        
        headers.forEach((header, index) => {
          const value = row[index]?.trim()
          if (!value) return

          switch (header.toLowerCase()) {
            case 'employee id':
              employee.employee_id = value
              break
            case 'name':
              employee.name = value
              break
            case 'email':
              employee.email = value
              break
            case 'department':
              employee.department = value
              break
            case 'role':
              employee.role = value as UserRole
              break
            case 'status':
              employee.status = value as HeadcountUser['status']
              break
            case 'job title':
              employee.job_title = value
              break
            case 'job level':
              employee.job_level = value as HeadcountUser['job_level']
              break
            case 'employment type':
              employee.employment_type = value as HeadcountUser['employment_type']
              break
            case 'location':
              employee.location = value
              break
            case 'hire date':
              employee.hire_date = value
              break
          }
        })

        return employee
      })

      const results = await bulkImportEmployees(employeesToImport)
      setImportResults(results)
      
      if (results.success > 0) {
        loadEmployees()
      }

    } catch (error) {
      console.error('Import error:', error)
      setImportResults({
        success: 0,
        failed: 1,
        errors: [{ row: 0, email: 'all', error: error instanceof Error ? error.message : 'Failed to parse CSV file' }]
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [bulkImportEmployees, loadEmployees])

  const handleSaveEmployee = async (updates: Partial<HeadcountUser>) => {
    if (!editingEmployee) return
    await updateEmployee(editingEmployee.id, updates)
    await loadEmployees()
    setEditingEmployee(null)
  }

  const hasActiveFilters = filters.department || filters.status || filters.role || filters.search

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Employee Directory</h1>
          <p className="text-sm text-gray-600">View and manage workforce</p>
        </div>
        
        {canEditHeadcount() && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Template
            </button>
            <button
              onClick={handleExport}
              disabled={employees.length === 0}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            <button
              onClick={handleImportClick}
              disabled={importing}
              className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {importing ? 'Importing...' : 'Import'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Import Results */}
      {importResults && (
        <div className={`p-4 rounded-lg ${importResults.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {importResults.failed === 0 ? (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${importResults.failed === 0 ? 'text-green-800' : 'text-yellow-800'}`}>
                Import Complete
              </h3>
              <p className={`text-sm mt-1 ${importResults.failed === 0 ? 'text-green-700' : 'text-yellow-700'}`}>
                Successfully imported {importResults.success} employee{importResults.success !== 1 ? 's' : ''}.
                {importResults.failed > 0 && ` ${importResults.failed} failed.`}
              </p>
              {importResults.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Errors:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {importResults.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-yellow-700">
                        Row {err.row} ({err.email}): {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setImportResults(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
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

        {/* Employee Cards Grid */}
        <div className="p-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No employees found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={canEditHeadcount() ? setEditingEmployee : undefined}
                  canEdit={canEditHeadcount()}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditEmployeeModal
        employee={editingEmployee}
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSave={handleSaveEmployee}
      />
    </div>
  )
}
