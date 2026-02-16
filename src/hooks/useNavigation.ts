import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import type { UserRole } from '../types'
import {
  BalanceIcon,
  BreakScheduleIcon,
  DashboardIcon,
  LeaveIcon,
  ReportsIcon,
  RequestsIcon,
  ScheduleIcon,
  SettingsIcon,
  SwapIcon,
  UploadIcon,
  UsersIcon,
} from '../components/icons'

export interface NavItem {
  name: string
  href: string
  roles: UserRole[]
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', roles: ['agent', 'tl', 'wfm'], icon: DashboardIcon },
  { name: 'Schedule', href: '/schedule', roles: ['agent', 'tl', 'wfm'], icon: ScheduleIcon },
  { name: 'Break Schedule', href: '/break-schedule', roles: ['agent', 'tl', 'wfm'], icon: BreakScheduleIcon },
  { name: 'Requests', href: '/requests', roles: ['agent', 'tl', 'wfm'], icon: RequestsIcon },
  { name: 'Swap Requests', href: '/swap-requests', roles: ['agent', 'tl', 'wfm'], icon: SwapIcon },
  { name: 'Leave Requests', href: '/leave-requests', roles: ['agent', 'tl', 'wfm'], icon: LeaveIcon },
  { name: 'Leave Balances', href: '/leave-balances', roles: ['agent', 'tl', 'wfm'], icon: BalanceIcon },
  { name: 'Reports', href: '/reports', roles: ['tl', 'wfm'], icon: ReportsIcon },
  { name: 'Schedule Upload', href: '/schedule/upload', roles: ['wfm'], icon: UploadIcon },
  { name: 'Headcount', href: '/headcount/employees', roles: ['tl', 'wfm'], icon: UsersIcon },
  { name: 'Settings', href: '/settings', roles: ['wfm'], icon: SettingsIcon },
]

/**
 * Custom hook for navigation logic
 * Provides filtered navigation items based on user role and active route detection
 */
export function useNavigation() {
  const { user } = useAuth()
  const location = useLocation()

  // Filter navigation items based on user role
  const filteredNavItems = useMemo(() => {
    if (!user) return []
    return NAV_ITEMS.filter(item => item.roles.includes(user.role))
  }, [user])

  // Check if a route is currently active
  const isRouteActive = (href: string): boolean => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  return {
    navItems: filteredNavItems,
    isRouteActive,
    currentPath: location.pathname,
  }
}
