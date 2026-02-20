import { ValidationViolation } from '../../types';
import { BUTTON_STYLES, SEMANTIC_COLORS } from '../../lib/designSystem';

interface ValidationBannerProps {
  violations: ValidationViolation[];
  onSaveAnyway?: () => void;
  onDismiss?: () => void;
}

export default function ValidationBanner({
  violations,
  onSaveAnyway,
  onDismiss,
}: ValidationBannerProps) {
  if (violations.length === 0) return null;

  const errors = violations.filter((v) => v.severity === 'error');
  const warnings = violations.filter((v) => v.severity === 'warning');
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <div className="space-y-3">
      {/* Error banner */}
      {hasErrors && (
        <div
          className={`${SEMANTIC_COLORS.error.bg} border ${SEMANTIC_COLORS.error.border} rounded-lg p-4`}
        >
          <div className="flex items-start gap-3">
            <svg
              className={`h-5 w-5 ${SEMANTIC_COLORS.error.icon} mt-0.5 flex-shrink-0`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${SEMANTIC_COLORS.error.text}`}>
                {errors.length} Blocking {errors.length === 1 ? 'Error' : 'Errors'}
              </h3>
              <div className="${SEMANTIC_COLORS.error.text} mt-2 text-sm">
                <ul className="list-inside list-disc space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{error.rule_name}:</span> {error.message}
                      {error.affected_intervals && error.affected_intervals.length > 0 && (
                        <span className="ml-2 text-xs">
                          (Intervals: {error.affected_intervals.join(', ')})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="${SEMANTIC_COLORS.error.text} mt-2 text-sm">
                These errors must be fixed before saving.
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                aria-label="Dismiss"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Warning banner */}
      {hasWarnings && (
        <div
          className={`${SEMANTIC_COLORS.warning.bg} border ${SEMANTIC_COLORS.warning.border} rounded-lg p-4`}
        >
          <div className="flex items-start gap-3">
            <svg
              className={`h-5 w-5 ${SEMANTIC_COLORS.warning.icon} mt-0.5 flex-shrink-0`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${SEMANTIC_COLORS.warning.text}`}>
                {warnings.length} {warnings.length === 1 ? 'Warning' : 'Warnings'}
              </h3>
              <div className="${SEMANTIC_COLORS.warning.text} mt-2 text-sm">
                <ul className="list-inside list-disc space-y-1">
                  {warnings.map((warning, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{warning.rule_name}:</span> {warning.message}
                      {warning.affected_intervals && warning.affected_intervals.length > 0 && (
                        <span className="ml-2 text-xs">
                          (Intervals: {warning.affected_intervals.join(', ')})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 flex gap-3">
                {onSaveAnyway && (
                  <button
                    onClick={onSaveAnyway}
                    className={`${BUTTON_STYLES.warning} px-3 py-1 text-xs`}
                  >
                    Save Anyway
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className={`${BUTTON_STYLES.secondary} px-3 py-1 text-xs`}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
