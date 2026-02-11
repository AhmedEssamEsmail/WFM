import { useState } from 'react'
import { BreakScheduleRule } from '../../types'
import { BUTTON_STYLES, INPUT_STYLES, SEMANTIC_COLORS } from '../../lib/designSystem'

interface RulesConfigProps {
  rules: BreakScheduleRule[]
  onUpdateRule: (ruleId: string, updates: Partial<BreakScheduleRule>) => Promise<void>
  onToggleRule: (ruleId: string, isActive: boolean) => Promise<void>
}

export default function RulesConfig({ rules, onUpdateRule, onToggleRule }: RulesConfigProps) {
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [editedParams, setEditedParams] = useState<Record<string, unknown>>({})
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = (rule: BreakScheduleRule) => {
    setEditingRule(rule.id)
    setEditedParams(rule.parameters as Record<string, unknown>)
  }

  const handleSave = async (ruleId: string) => {
    setIsSaving(true)
    try {
      await onUpdateRule(ruleId, { parameters: editedParams })
      setEditingRule(null)
    } catch (error) {
      console.error('Failed to update rule:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingRule(null)
    setEditedParams({})
  }

  const handleToggle = async (ruleId: string, currentStatus: boolean) => {
    try {
      await onToggleRule(ruleId, !currentStatus)
    } catch (error) {
      console.error('Failed to toggle rule:', error)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Break Schedule Rules</h3>
      
      <div className="space-y-3">
        {rules.map((rule) => {
          const isEditing = editingRule === rule.id
          const params = isEditing ? editedParams : (rule.parameters as Record<string, unknown>)

          return (
            <div
              key={rule.id}
              className={`bg-white border rounded-lg p-4 ${
                rule.is_active ? 'border-green-300' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-medium text-gray-900">{rule.rule_name}</h4>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        rule.is_active ? SEMANTIC_COLORS.success.badge : SEMANTIC_COLORS.neutral.badge
                      }`}
                    >
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        rule.is_blocking ? SEMANTIC_COLORS.error.badge : SEMANTIC_COLORS.warning.badge
                      }`}
                    >
                      {rule.is_blocking ? 'Blocking' : 'Warning'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{rule.description}</p>

                  {/* Rule parameters */}
                  {params && Object.keys(params).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {Object.entries(params).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <label className="text-xs font-medium text-gray-700 min-w-[120px]">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                          </label>
                          {isEditing ? (
                            <input
                              type={typeof value === 'number' ? 'number' : 'text'}
                              value={String(value)}
                              onChange={(e) =>
                                setEditedParams({
                                  ...editedParams,
                                  [key]:
                                    typeof value === 'number'
                                      ? Number(e.target.value)
                                      : e.target.value,
                                })
                              }
                              className={`${INPUT_STYLES.default} text-xs max-w-[200px]`}
                            />
                          ) : (
                            <span className="text-xs text-gray-900">{String(value)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSave(rule.id)}
                        disabled={isSaving}
                        className={`${BUTTON_STYLES.primary} text-xs px-3 py-1`}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className={`${BUTTON_STYLES.secondary} text-xs px-3 py-1`}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(rule)}
                        className={`${BUTTON_STYLES.secondary} text-xs px-3 py-1`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggle(rule.id, rule.is_active)}
                        className={`${
                          rule.is_active ? BUTTON_STYLES.warning : BUTTON_STYLES.success
                        } text-xs px-3 py-1`}
                      >
                        {rule.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
