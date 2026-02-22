import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { breakRulesService } from '../../services';
import type { BreakScheduleRule } from '../../types';
import { handleDatabaseError } from '../../lib/errorHandler';
import RulesConfig from '../../components/BreakSchedule/RulesConfig';
import DistributionSettingsForm from '../../components/DistributionSettingsForm';

export default function BreakScheduleSettings() {
  const { success, error: showError } = useToast();
  const [breakRules, setBreakRules] = useState<BreakScheduleRule[]>([]);
  const [loadingBreakRules, setLoadingBreakRules] = useState(false);
  const [activeSection, setActiveSection] = useState<'rules' | 'distribution'>('distribution');

  const fetchBreakRules = useCallback(async () => {
    setLoadingBreakRules(true);
    try {
      const data = await breakRulesService.getRules();
      setBreakRules(data);
    } catch (error) {
      handleDatabaseError(error, 'fetch break rules');
      showError('Failed to load break rules');
    } finally {
      setLoadingBreakRules(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchBreakRules();
  }, [fetchBreakRules]);

  async function handleUpdateRule(ruleId: string, updates: Partial<BreakScheduleRule>) {
    try {
      await breakRulesService.updateRule(ruleId, updates);
      await fetchBreakRules();
      success('Rule updated successfully');
    } catch (error) {
      handleDatabaseError(error, 'update break rule');
      showError('Failed to update rule');
    }
  }

  async function handleToggleRule(ruleId: string, isActive: boolean) {
    try {
      await breakRulesService.toggleRule(ruleId, isActive);
      await fetchBreakRules();
      success(`Rule ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      handleDatabaseError(error, 'toggle break rule');
      showError('Failed to toggle rule');
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs for Break Schedule Settings */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSection('distribution')}
            className={`${
              activeSection === 'distribution'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium`}
          >
            Distribution Settings
          </button>
          <button
            onClick={() => setActiveSection('rules')}
            className={`${
              activeSection === 'rules'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium`}
          >
            Validation Rules
          </button>
        </nav>
      </div>

      {/* Distribution Settings Section */}
      {activeSection === 'distribution' && (
        <div className="rounded-lg bg-white p-6 shadow">
          <DistributionSettingsForm />
        </div>
      )}

      {/* Rules Configuration Section */}
      {activeSection === 'rules' && (
        <div className="rounded-lg bg-white p-6 shadow">
          {loadingBreakRules ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <RulesConfig
              rules={breakRules}
              onUpdateRule={handleUpdateRule}
              onToggleRule={handleToggleRule}
            />
          )}
        </div>
      )}
    </div>
  );
}
