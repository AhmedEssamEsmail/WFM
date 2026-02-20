import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  bgColor: string; // Tailwind color class (e.g., 'bg-blue-100')
  iconColor: string; // Tailwind color class (e.g., 'text-blue-600')
  onClick?: () => void;
}

/**
 * StatCard component displays dashboard statistics with icon and colored background
 *
 * Requirements:
 * - 2.1: Display stat cards at top of dashboard
 * - 2.2: Include icon and colored background appropriate to metric type
 * - 2.6: Include icon and colored background for each stat card
 * - 2.7: Arrange stat cards in responsive grid layout
 */
export function StatCard({ title, value, icon: Icon, bgColor, iconColor, onClick }: StatCardProps) {
  return (
    <div
      className={`rounded-lg bg-white p-6 shadow ${
        onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={onClick ? `${title}: ${value}. Click to view details` : `${title}: ${value}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${bgColor} rounded-lg p-3`}>
          <Icon className={`h-8 w-8 ${iconColor}`} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
