import { REQUEST_TYPE_COLORS, REQUEST_TYPE_LABELS } from '../lib/designSystem';

export type RequestType = 'swap' | 'leave';

interface TypeBadgeProps {
  type: RequestType;
  className?: string;
}

/**
 * TypeBadge component displays a colored badge indicating the request type
 *
 * Requirements:
 * - 10.1: Display "Swap" with blue background for swap requests
 * - 10.2: Display "Leave" with orange background for leave requests
 * - 10.3: Ensure text is readable against background color
 * - 10.4: Use consistent sizing and styling across all request displays
 */
export function TypeBadge({ type, className = '' }: TypeBadgeProps) {
  const colorClass = REQUEST_TYPE_COLORS[type];
  const label = REQUEST_TYPE_LABELS[type];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}
      aria-label={`Request type: ${label}`}
    >
      {label}
    </span>
  );
}
