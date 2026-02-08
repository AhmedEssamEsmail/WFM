import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useHeadcount } from '../../hooks/useHeadcount'
import { useAuth } from '../../hooks/useAuth'
import ProtectedEdit from '../../components/Headcount/ProtectedEdit'
import type { HeadcountUser, Department } from '../../types'
import { ROUTES } from '../../constants'

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>()
  const { canEditHeadcount } = useAuth()
  const { getEmployee, updateEmployee, getDepartments, loading } = useHeadcount()
  const [employee, setEmployee] = useState<HeadcountUser | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<HeadcountUser>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (id) {
      loadEmployee()
      loadDepartments()
    }
  }, [id])

  async function loadEmployee() {
    if (!id) return
    const data = await getEmployee(id)
    setEmployee(data)
    setFormData(data || {})
  }

  async function loadDepartments() {
    const depts = await getDepartments()
    setDepartments(depts)
  }

  async function handleSave() {
    if (!id || !employee) return
    
    setSaving(true)
    setMessage('')
    
    const success = await updateEmployee(id, formData)
    
    if (success) {
      setMessage('Employee updated successfully!')
      setIsEditing(false)
      loadEmployee()
      setTimeout(() => setMessage(''), 3000)
    } else {
      setMessage('Failed to update employee')
    }
    
    setSaving(false)
  }

  if (loading && !employee) {
    return <div className="flex justify-center py-12">Loading...</div>
  }

  if (!employee) {
    return <div className="text-center py-12 text-gray-500">Employee not found</div>
  }

  const isEditable = canEditHeadcount() && isEditing

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link to={ROUTES.HEADCOUNT_EMPLOYEES} className="text-primary-600 hover:text-primary-800 text-sm mb-2 inline-block">
            ← Back to Directory
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
          <p className="text-gray-600">{employee.email}</p>
        </div>
        
        <ProtectedEdit>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Edit Employee
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false)
                  setFormData(employee)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </ProtectedEdit>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee ID</label>
              {isEditable ? (
                <input
                  type="text"
                  value={formData.employee_id || ''}
                  onChange={(e) => setFormData(f => ({ ...f, employee_id: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{employee.employee_id || 'Not assigned'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              {isEditable ? (
                <select
                  value={formData.role || 'agent'}
                  onChange={(e) => setFormData(f => ({ ...f, role: e.target.value as any }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                >
                  <option value="agent">Agent</option>
                  <option value="tl">Team Lead</option>
                  <option value="wfm">WFM</option>
                </select>
              ) : (
                <p className="mt-1 text-gray-900 uppercase">{employee.role}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              {isEditable ? (
                <select
                  value={formData.department || ''}
                  onChange={(e) => setFormData(f => ({ ...f, department: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              ) : (
                <p className="mt-1 text-gray-900">{employee.department || 'Unassigned'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hire Date</label>
              {isEditable ? (
                <input
                  type="date"
                  value={formData.hire_date || ''}
                  onChange={(e) => setFormData(f => ({ ...f, hire_date: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{employee.hire_date || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Job Details</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Title</label>
              {isEditable ? (
                <input
                  type="text"
                  value={formData.job_title || ''}
                  onChange={(e) => setFormData(f => ({ ...f, job_title: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-gray-900">{employee.job_title || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Job Level</label>
              {isEditable ? (
                <select
                  value={formData.job_level || ''}
                  onChange={(e) => setFormData(f => ({ ...f, job_level: e.target.value as any }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Level</option>
                  <option value="intern">Intern</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="manager">Manager</option>
                  <option value="director">Director</option>
                </select>
              ) : (
                <p className="mt-1 text-gray-900 capitalize">{employee.job_level || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Employment Type</label>
              {isEditable ? (
                <select
                  value={formData.employment_type || 'full_time'}
                  onChange={(e) => setFormData(f => ({ ...f, employment_type: e.target.value as any }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contractor">Contractor</option>
                  <option value="intern">Intern</option>
                </select>
              ) : (
                <p className="mt-1 text-gray-900 capitalize">{employee.employment_type?.replace('_', ' ') || 'Full Time'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              {isEditable ? (
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., Remote, Dubai Office"
                />
              ) : (
                <p className="mt-1 text-gray-900">{employee.location || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Manager Info */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Management</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Manager</label>
            <p className="mt-1 text-gray-900">
              {employee.manager_name ? (
                <Link to={`/headcount/employees/${employee.manager_id}`} className="text-primary-600 hover:underline">
                  {employee.manager_name}
                </Link>
              ) : (
                'No manager assigned'
              )}
            </p>
          </div>
        </div>

        {/* View Only Notice */}
        {!canEditHeadcount() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-blue-900 font-semibold mb-2">View Only Access</h3>
            <p className="text-blue-700 text-sm">
              As a Team Lead, you can view employee details but cannot make changes. 
              Contact WFM team for any updates or corrections.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
