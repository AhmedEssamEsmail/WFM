import { useState, useEffect } from 'react'
import { useToast } from '../../lib/ToastContext'
import { settingsService, breakRulesService } from '../../services'
import type { DistributionStrategy, ApplyMode, BreakScheduleRule } from '../../types'
import { handleDatabaseError } from '../../lib/errorHandler'
import AutoDistributionSettings from '../../components/Settings/AutoDistributionSettings'
import RulesConfig from '../../components/BreakSchedule/RulesConfig'

export default function BreakScheduleSettings() {
  const { success, error: showError } = useToast()
  const [defaultStrategy, setDefaultStrategy] = useState<DistributionStrategy>('balanced_coverage')
  const [defaultApplyMode, setDefaultApplyMode] = useState<ApplyMode>('only_unscheduled')
  const [breakRules, setBreakRules] = useState<BreakScheduleRule[]>([])
  const [loadingBreakRules, setLoadingBreakRules] = useState(false)

  useEffect(() => {
    fetchBreakScheduleSettings()
    fetchBreakRules()
  }, [])

  async function fetchBreakScheduleSettings() {
    try {
      const strategyValue = await settingsService.getSetting('break_distribution_strategy')
      const applyModeValue = await settingsService.getSetting('break_apply_mode')
      
      if (strategyValue) setDefaultStrategy(strategyValue as DistributionStrategy)
      if (applyModeValue) setDefaultApplyMode(applyModeValue as ApplyMode)
    } catch (err) {
      handleDatabaseError(err, 'fetch break schedule settings')
    }
  }

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

  async function handleSaveBreakScheduleSettings(strategy: DistributionStrategy, applyMode: ApplyMode) {
    try {
      await settingsService.updateSetting('break_distribution_strategy', strategy)
      await settingsService.updateSetting('break_apply_mode', applyMode)
      
      setDefaultStrategy(strategy)
      setDefaultApplyMode(applyMode)
      success('Break schedule settings saved successfully')
    } catch (error) {
      handleDatabaseError(error, 'save break schedule settings')
      showError('Failed to save break schedule settings')
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <AutoDistributionSettings
          defaultStrategy={defaultStrategy}
          defaultApplyMode={defaultApplyMode}
          onSave={handleSaveBreakScheduleSettings}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loadingBreakRules ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <RulesConfig
            rules={breakRules}
            onUpdateRule={handleUpdateRule}
            onToggleRule={handleToggleRule}
          />
        )}
      </div>
    </div>
  )
}
