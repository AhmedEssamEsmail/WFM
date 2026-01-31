import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ShiftType } from '../types'

interface ParsedRow {
  email: string
  userId?: string
  userName?: string
  shifts: { date: string; shiftType: ShiftType }[]
  error?: string
}

interface ParseResult {
  headers: string[]
  rows: ParsedRow[]
  errors: string[]
}

const validShiftTypes: ShiftType[] = ['AM', 'PM', 'BET', 'OFF']

export default function ScheduleUpload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null)
  const [error, setError] = useState('')

  // Redirect non-WFM users
  if (user?.role !== 'wfm') {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">Only WFM users can access the schedule upload feature.</p>
      </div>
    )
  }

  function parseCSV(content: string): ParseResult {
    const lines = content.trim().split('\n')
    const errors: string[] = []
    
    if (lines.length < 2) {
      return { headers: [], rows: [], errors: ['CSV must have a header row and at least one data row'] }
    }

    // Parse headers (first row should be: email, 1, 2, 3... or email, 2026-01-01, 2026-01-02...)
    const headerLine = lines[0].trim()
    const headers = headerLine.split(',').map(h => h.trim())

    if (headers.length < 2) {
      return { headers: [], rows: [], errors: ['CSV must have at least an email column and one date column'] }
    }

    if (headers[0].toLowerCase() !== 'email') {
      errors.push('First column header should be "email"')
    }

    // Determine the year/month context for simple date numbers
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()

    // Parse date headers
    const dateHeaders: string[] = []
    for (let i = 1; i < headers.length; i++) {
      const h = headers[i]
      
      // Check if it's a full date (YYYY-MM-DD) or just a day number
      if (/^\d{4}-\d{2}-\d{2}$/.test(h)) {
        dateHeaders.push(h)
      } else if (/^\d{1,2}$/.test(h)) {
        // It's just a day number, assume current month
        const day = parseInt(h, 10)
        const date = new Date(currentYear, currentMonth, day)
        const formattedDate = date.toISOString().split('T')[0]
        dateHeaders.push(formattedDate)
      } else {
        errors.push(`Invalid date header: "${h}". Use YYYY-MM-DD or day number (1-31)`)
      }
    }

    // Parse data rows
    const rows: ParsedRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const cells = line.split(',').map(c => c.trim())
      const email = cells[0]

      if (!email || !email.includes('@')) {
        errors.push(`Row ${i + 1}: Invalid email "${email}"`)
        continue
      }

      const shifts: { date: string; shiftType: ShiftType }[] = []
      
      for (let j = 1; j < cells.length && j <= dateHeaders.length; j++) {
        const value = cells[j]?.toUpperCase() || ''
        
        if (!value) continue
        
        if (validShiftTypes.includes(value as ShiftType)) {
          shifts.push({
            date: dateHeaders[j - 1],
            shiftType: value as ShiftType
          })
        } else {
          errors.push(`Row ${i + 1}, Column ${j + 1}: Invalid shift type "${cells[j]}". Valid values: AM, PM, BET, OFF`)
        }
      }

      rows.push({ email, shifts })
    }

    return { headers: ['Email', ...dateHeaders], rows, errors }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setParseResult(null)
    setUploadResult(null)
    setError('')

    try {
      const content = await selectedFile.text()
      const result = parseCSV(content)

      // Resolve emails to user IDs
      const emails = result.rows.map(r => r.email)
      if (emails.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, email, name')
          .in('email', emails)

        const userMap = new Map(users?.map(u => [u.email.toLowerCase(), { id: u.id, name: u.name }]) || [])

        result.rows.forEach(row => {
          const userData = userMap.get(row.email.toLowerCase())
          if (userData) {
            row.userId = userData.id
            row.userName = userData.name
          } else {
            row.error = 'User not found'
          }
        })
      }

      setParseResult(result)
    } catch (err) {
      setError('Failed to parse CSV file')
      console.error(err)
    }
  }

  async function handleUpload() {
    if (!parseResult || parseResult.errors.length > 0) return

    setUploading(true)
    setError('')

    try {
      let successCount = 0
      let failedCount = 0

      for (const row of parseResult.rows) {
        if (!row.userId || row.error) {
          failedCount++
          continue
        }

        for (const shift of row.shifts) {
          try {
            // Upsert: insert or update if exists
            const { error: upsertError } = await supabase
              .from('shifts')
              .upsert(
                {
                  user_id: row.userId,
                  date: shift.date,
                  shift_type: shift.shiftType
                },
                { onConflict: 'user_id,date' }
              )

            if (upsertError) {
              console.error('Upsert error:', upsertError)
              failedCount++
            } else {
              successCount++
            }
          } catch (err) {
            console.error('Shift insert error:', err)
            failedCount++
          }
        }
      }

      setUploadResult({ success: successCount, failed: failedCount })
    } catch (err) {
      setError('Failed to upload schedule')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  function resetForm() {
    setFile(null)
    setParseResult(null)
    setUploadResult(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Schedule</h1>
        <p className="text-gray-600 mt-1">Bulk upload shifts via CSV file</p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">CSV Format Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>First column must be <code className="bg-blue-100 px-1 rounded">email</code> (agent's email address)</li>
          <li>Subsequent columns are dates (either <code className="bg-blue-100 px-1 rounded">1, 2, 3...</code> for current month or <code className="bg-blue-100 px-1 rounded">2026-01-15</code> for specific dates)</li>
          <li>Cell values: <code className="bg-blue-100 px-1 rounded">AM</code>, <code className="bg-blue-100 px-1 rounded">PM</code>, <code className="bg-blue-100 px-1 rounded">BET</code>, or <code className="bg-blue-100 px-1 rounded">OFF</code></li>
          <li>Empty cells are skipped (existing shifts not deleted)</li>
          <li>Existing shifts for the same user/date are updated (merge mode)</li>
        </ul>
        <div className="mt-3">
          <p className="text-sm text-blue-800 font-medium mb-1">Example CSV:</p>
          <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
email,1,2,3,4,5{String.fromCharCode(10)}agent@example.com,AM,PM,AM,OFF,BET{String.fromCharCode(10)}lead@example.com,PM,AM,OFF,AM,PM
          </pre>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {file && (
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Parse Results */}
      {parseResult && (
        <div className="space-y-4">
          {/* Errors */}
          {parseResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-900 mb-2">Parsing Errors ({parseResult.errors.length})</h3>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                {parseResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          {parseResult.rows.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="font-medium text-gray-900">
                  Preview ({parseResult.rows.length} users, {parseResult.rows.reduce((acc, r) => acc + r.shifts.length, 0)} shifts)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shifts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {parseResult.rows.map((row, i) => (
                      <tr key={i} className={row.error ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.error ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Error
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Ready
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.userName || <span className="text-red-600">{row.error}</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {row.shifts.length} shift(s)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {parseResult.rows.length > 0 && parseResult.errors.length === 0 && !uploadResult && (
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Schedule
                  </>
                )}
              </button>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Upload Complete</h3>
              <p className="text-sm text-green-800">
                Successfully uploaded <span className="font-bold">{uploadResult.success}</span> shifts.
                {uploadResult.failed > 0 && (
                  <span className="text-red-600"> {uploadResult.failed} failed.</span>
                )}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Upload Another
                </button>
                <button
                  onClick={() => navigate('/schedule')}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  View Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
