import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNavigation } from '../hooks/useNavigation'
import { ROLE_COLORS, ROLE_LABELS } from '../lib/designSystem'
import { STORAGE_KEYS } from '../constants'
import {
  ChevronDoubleLeftIcon,
  CloseIcon,
  MenuIcon,
  SignOutIcon,
} from './icons'

interface LayoutProps {
  children: React.ReactNode
}

const SIDEBAR_COLLAPSED_KEY = STORAGE_KEYS.SIDEBAR_COLLAPSED

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const { navItems, isRouteActive } = useNavigation()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    return saved ? JSON.parse(saved) : false
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  const NavLink = ({ item, isMobile = false }: { item: { name: string; href: string; icon: React.ElementType }; isMobile?: boolean }) => {
    const isActive = isRouteActive(item.href)
    const Icon = item.icon

    return (
      <Link
        to={item.href}
        onClick={() => isMobile && setMobileMenuOpen(false)}
        className={`flex items-center rounded-lg transition-all duration-200 px-3 py-2.5 ${isActive
            ? 'bg-primary-50 text-primary-700 shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          } ${!isMobile && sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
        title={sidebarCollapsed ? item.name : undefined}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
        {(!sidebarCollapsed || isMobile) && <span className="font-medium text-sm">{item.name}</span>}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-30 ${sidebarCollapsed ? 'md:w-20' : 'md:w-48'
          }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          {!sidebarCollapsed && (
            <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              WFM System
            </Link>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${sidebarCollapsed ? 'mx-auto' : ''}`}
          >
            <ChevronDoubleLeftIcon className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => <NavLink key={item.name} item={item} />)}
        </nav>
      </aside>

      {/* --- MOBILE OVERLAY & SIDEBAR --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <span className="text-xl font-bold text-primary-600">WFM System</span>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-gray-400"><CloseIcon /></button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => <NavLink key={item.name} item={item} isMobile />)}
        </nav>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-48'}`}>
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-end px-4 sm:px-6 lg:px-8 gap-4">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md mr-auto">
            <MenuIcon />
          </button>

          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden lg:block text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900 leading-none mb-1 truncate max-w-[150px]">{user.name}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 whitespace-nowrap flex-shrink-0"
                aria-label="Sign out"
              >
                <SignOutIcon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
