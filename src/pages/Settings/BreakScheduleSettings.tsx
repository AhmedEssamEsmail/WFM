import { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { breakRulesService } from '../../services'
import type { BreakScheduleRule } from '../../types'
import { handleDatabaseError } from '../../lib/errorHandler'
import RulesConfig from '../../components/BreakSchedule/RulesConfig'

export default function BreakScheduleSettings() {
  const { success, error: showError } = useToast()
  const [breakRules, setBreakRules] = useState<BreakScheduleRule[]>([])
  const [loadingBreakRules, setLoadingBreakRules] = useState(false)

  useEffect(() => {
    fetchBreakRules()
  }, [])

  async function fetchBreakRules() {
    setLoadingBreakRules(true)
    try {
      const data = await breakRulesService.getRules()
      setBreakRules(data)
    } catch (error) {
      handleDatabaseError(error, 'fetch break rules')
      showError('Failed to load break rules')
    } finally {
      setLoadingBreakRules(false)
    }
  }

  async function handleUpdateRule(ruleId: string, updates: Partial<BreakScheduleRule>) {
    try {
      await breakRulesService.updateRule(ruleId, updates)
      await fetchBreakRules()
      success('Rule updated successfully')
    } catch (error) {
      handleDatabaseError(error, 'update break rule')
      showError('Failed to update rule')
    }
  }

  async function handleToggleRule(ruleId: string, isActive: boolean) {
    try {
      await breakRulesService.toggleRule(ruleId, isActive)
      await fetchBreakRules()
      success(`Rule ${isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      handleDatabaseError(error, 'toggle break rule')
      showError('Failed to toggle rule')
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      {loadingBreakRules ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <RulesConfig
          rules={breakRules}
          onUpdateRule={handleUpdateRule}
          onToggleRule={handleToggleRule}
        />
      )}
    </div>
  )
}



