import { useState } from 'react';
import { DistributionStrategy, ApplyMode } from '../types';
import { BUTTON_STYLES } from '../lib/designSystem';

interface AutoDistributionSettingsProps {
  defaultStrategy: DistributionStrategy;
  defaultApplyMode: ApplyMode;
  onSave: (strategy: DistributionStrategy, applyMode: ApplyMode) => Promise<void>;
}

export default function AutoDistributionSettings({
  defaultStrategy,
  defaultApplyMode,
  onSave,
}: AutoDistributionSettingsProps) {
  const [strategy, setStrategy] = useState<DistributionStrategy>(defaultStrategy);
  const [applyMode, setApplyMode] = useState<ApplyMode>(defaultApplyMode);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(strategy, applyMode);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = strategy !== defaultStrategy || applyMode !== defaultApplyMode;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Auto-Distribution Default Settings
        </h3>
        <p className="mb-6 text-sm text-gray-600">
          Configure default settings for the auto-distribution feature. These will be pre-selected
          when opening the auto-distribution modal.
        </p>
      </div>

      {/* Default Strategy */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-700">
          Default Distribution Strategy
        </label>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-gray-50">
            <input
              type="radio"
              name="strategy"
              value="ladder"
              checked={strategy === 'ladder'}
              onChange={(e) => setStrategy(e.target.value as DistributionStrategy)}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-medium">Ladder Distribution</div>
              <div className="text-xs text-gray-600">
                Assigns breaks sequentially with predictable 15-minute increments
              </div>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-gray-50">
            <input
              type="radio"
              name="strategy"
              value="balanced_coverage"
              checked={strategy === 'balanced_coverage'}
              onChange={(e) => setStrategy(e.target.value as DistributionStrategy)}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-medium">Balanced Coverage</div>
              <div className="text-xs text-gray-600">
                Minimizes variance in coverage across all intervals
              </div>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-gray-50">
            <input
              type="radio"
              name="strategy"
              value="staggered_timing"
              checked={strategy === 'staggered_timing'}
              onChange={(e) => setStrategy(e.target.value as DistributionStrategy)}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-medium">Staggered Timing</div>
              <div className="text-xs text-gray-600">
                Spreads breaks evenly throughout shift thirds
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Default Apply Mode */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-700">Default Apply Mode</label>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-gray-50">
            <input
              type="radio"
              name="applyMode"
              value="only_unscheduled"
              checked={applyMode === 'only_unscheduled'}
              onChange={(e) => setApplyMode(e.target.value as ApplyMode)}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-medium">Only Unscheduled</div>
              <div className="text-xs text-gray-600">
                Only assign breaks to agents without existing schedules
              </div>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-gray-50">
            <input
              type="radio"
              name="applyMode"
              value="all_agents"
              checked={applyMode === 'all_agents'}
              onChange={(e) => setApplyMode(e.target.value as ApplyMode)}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-medium">All Agents</div>
              <div className="text-xs text-gray-600">Clear and reassign breaks for all agents</div>
            </div>
          </label>
        </div>
      </div>

      <div className="flex justify-end border-t pt-4">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={BUTTON_STYLES.primary}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
