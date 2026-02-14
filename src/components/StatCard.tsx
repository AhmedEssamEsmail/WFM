import React from 'react'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  bgColor: string // Tailwind color class (e.g., 'bg-blue-100')
  iconColor: string // Tailwind color class (e.g., 'text-blue-600')
  onClick?: () => void
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
export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  bgColor, 
  iconColor, 
  onClick 
}: StatCardProps) {
  return (
    <div 
      className={`bg-white rounded-lg shadow p-6 ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      } : undefined}
      aria-label={onClick ? `${title}: ${value}. Click to view details` : `${title}: ${value}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${bgColor} rounded-lg p-3`}>
          <Icon className={`w-8 h-8 ${iconColor}`} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
