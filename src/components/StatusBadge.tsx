import type { SwapRequestStatus, LeaveRequestStatus } from '../types';
import { getStatusColor, getStatusLabel } from '../lib/designSystem';

export type RequestStatus = SwapRequestStatus | LeaveRequestStatus;

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

/**
 * StatusBadge component displays a colored badge indicating the request status
 *
 * Requirements:
 * - 9.1: Display "Approved" with green background for approved requests
 * - 9.2: Display "Pending TL" with yellow background for pending TL approval
 * - 9.3: Display "Pending Recipient" with blue background for pending recipient acceptance
 * - 9.4: Display "Rejected" with red background for rejected requests
 * - 9.5: Display "Pending WFM" with yellow background for pending WFM approval
 * - Ensure text is readable against background color
 */
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const colorClass = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}
      aria-label={`Request status: ${label}`}
    >
      {label}
    </span>
  );
}
