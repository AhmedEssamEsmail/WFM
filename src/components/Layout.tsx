import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNavigation } from '../hooks/useNavigation'
import { ROLE_COLORS, ROLE_LABELS } from '../lib/designSystem'
import {
  CloseIcon,
  MenuIcon,
  SignOutIcon,
} from './icons'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const { navItems, isRouteActive } = useNavigation()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const NavLink = ({ item, isMobile = false }: { item: { name: string; href: string; icon: React.ElementType }; isMobile?: boolean }) => {
    const isActive = isRouteActive(item.href)
    const Icon = item.icon

    return (
      <Link
        to={item.href}
        onClick={() => isMobile && setMobileMenuOpen(false)}
        className={`flex items-center space-x-3 rounded-lg transition-all duration-200 px-3 py-2.5 ${isActive
            ? 'bg-primary-50 text-primary-700 shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
        <span className="font-medium text-sm">{item.name}</span>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200 z-30 md:w-64">
        <div className="flex items-center h-16 px-4 border-b border-gray-100">
          <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
            WFM System
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => <NavLink key={item.name} item={item} />)}
        </nav>

        {/* Bottom section with user controls */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 font-semibold text-sm">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>
          )}

          {/* Dark Mode Toggle - Placeholder for future implementation */}
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle dark mode"
          >
            <span>Dark Mode</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
            aria-label="Sign out"
          >
            <SignOutIcon className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => <NavLink key={item.name} item={item} isMobile />)}
        </nav>

        {/* Mobile bottom section with user controls */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 font-semibold text-sm">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>
          )}

          {/* Dark Mode Toggle - Placeholder for future implementation */}
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle dark mode"
          >
            <span>Dark Mode</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
            aria-label="Sign out"
          >
            <SignOutIcon className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center px-4 sm:px-6 lg:px-8">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md">
            <MenuIcon />
          </button>
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
