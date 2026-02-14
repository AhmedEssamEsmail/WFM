import { useState, useEffect } from 'react'
import {
  DistributionStrategy,
  ApplyMode,
  AutoDistributePreview,
  AutoDistributeRequest,
} from '../../types'
import { BUTTON_STYLES, INPUT_STYLES, SEMANTIC_COLORS } from '../../lib/designSystem'

interface AutoDistributeModalProps {
  onClose: () => void
  onApply: (request: Omit<AutoDistributeRequest, 'schedule_date'>, failedAgents: Array<{ user_id: string; name: string; reason: string; blockedBy?: string[] }>) => Promise<void>
  onPreview: (request: Omit<AutoDistributeRequest, 'schedule_date'>) => Promise<AutoDistributePreview>
  departments: string[]
  defaultStrategy?: DistributionStrategy
  defaultApplyMode?: ApplyMode
}

export default function AutoDistributeModal({
  onClose,
  onApply,
  onPreview,
  departments,
  defaultStrategy = 'balanced_coverage',
  defaultApplyMode = 'only_unscheduled',
}: AutoDistributeModalProps) {
  const [strategy, setStrategy] = useState<DistributionStrategy>(defaultStrategy)
  const [applyMode, setApplyMode] = useState<ApplyMode>(defaultApplyMode)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [preview, setPreview] = useState<AutoDistributePreview | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  // Generate preview when settings change (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const generatePreview = async () => {
        setIsLoadingPreview(true)
        try {
          const request = {
            strategy,
            apply_mode: applyMode,
            department: selectedDepartment || undefined,
          }
          const previewData = await onPreview(request)
          setPreview(previewData)
        } catch (error) {
          console.error('Failed to generate preview:', error)
        } finally {
          setIsLoadingPreview(false)
        }
      }

      generatePreview()
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [strategy, applyMode, selectedDepartment, onPreview])

  const handleApply = async () => {
    setIsApplying(true)
    try {
      const request = {
        strategy,
        apply_mode: applyMode,
        department: selectedDepartment || undefined,
      }
      // Pass the failed agents information to the parent
      await onApply(request, preview?.failed_agents || [])
      onClose()
    } catch (error) {
      console.error('Failed to apply distribution:', error)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-500 dark:bg-slate-900 bg-opacity-75 dark:bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto relative z-[101]">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Auto-Distribute Breaks</h3>

        <div className="space-y-4">
          {/* Strategy selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Distribution Strategy
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:bg-slate-950">
                <input
                  type="radio"
                  name="strategy"
                  value="balanced_coverage"
                  checked={strategy === 'balanced_coverage'}
                  onChange={(e) => setStrategy(e.target.value as DistributionStrategy)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">Balanced Coverage</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Minimizes variance in coverage across all intervals
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:bg-slate-950">
                <input
                  type="radio"
                  name="strategy"
                  value="staggered_timing"
                  checked={strategy === 'staggered_timing'}
                  onChange={(e) => setStrategy(e.target.value as DistributionStrategy)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">Staggered Timing</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Spreads breaks evenly throughout shift thirds
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Apply mode selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Apply Mode</label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:bg-slate-950">
                <input
                  type="radio"
                  name="applyMode"
                  value="only_unscheduled"
                  checked={applyMode === 'only_unscheduled'}
                  onChange={(e) => setApplyMode(e.target.value as ApplyMode)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">Only Unscheduled</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Only assign breaks to agents without existing schedules
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:bg-slate-950">
                <input
                  type="radio"
                  name="applyMode"
                  value="all_agents"
                  checked={applyMode === 'all_agents'}
                  onChange={(e) => setApplyMode(e.target.value as ApplyMode)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">All Agents</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Clear and reassign breaks for all agents
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Department filter */}
          <div>
            <label htmlFor="department-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Department Filter (Optional)
            </label>
            <select
              id="department-filter"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className={INPUT_STYLES.default}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : preview ? (
            <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-950">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Preview</h4>
              
              {/* Show error if no breaks assigned */}
              {preview.proposed_schedules.length === 0 && preview.failed_agents.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-red-900">No breaks assigned during auto-distribution</div>
                      <div className="text-xs text-red-700 mt-1">
                        All agents failed validation. Check the rule violations below to see which rules are blocking assignments.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-300">Agents Affected:</span>
                  <span className="ml-2 font-medium">{preview.proposed_schedules.length}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-300">Coverage Variance:</span>
                  <span className="ml-2 font-medium">{preview.coverage_stats.variance.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-300">Total Violations:</span>
                  <span className="ml-2 font-medium">{preview.rule_compliance.total_violations}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-300">Blocking Violations:</span>
                  <span className="ml-2 font-medium">{preview.rule_compliance.blocking_violations}</span>
                </div>
              </div>

              {preview.failed_agents.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className={`text-xs font-medium ${SEMANTIC_COLORS.error.text} mb-2`}>
                    ✕ Failed Agents ({preview.failed_agents.length}):
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {preview.failed_agents.map((agent, idx) => (
                      <div key={idx} className="text-xs bg-red-50 border border-red-200 rounded p-3">
                        <div className="font-medium text-slate-900 dark:text-white mb-1">{agent.name}</div>
                        {agent.blockedBy && agent.blockedBy.length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-red-800 font-medium">Blocked by validation rules:</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {agent.blockedBy.map((rule) => (
                                <span key={rule} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                  {rule}
                                </span>
                              ))}
                            </div>
                            <div className="text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{agent.reason}</div>
                          </div>
                        ) : (
                          <div className="text-slate-700 dark:text-slate-300 leading-relaxed">{agent.reason}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className={`${BUTTON_STYLES.secondary} text-sm`}>
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying || isLoadingPreview}
            className={`${BUTTON_STYLES.primary} text-sm`}
          >
            {isApplying ? 'Applying...' : 'Apply Distribution'}
          </button>
        </div>
      </div>
    </div>
  )
}



