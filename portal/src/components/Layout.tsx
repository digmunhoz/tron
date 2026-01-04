import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Home,
  Cloud,
  Globe,
  AppWindow,
  Menu,
  X,
  Shield,
  FileCode,
  LogOut,
  User,
  Settings,
  Users,
  Key,
} from 'lucide-react'
import { Logo } from './Logo'
import { useAuth } from '../contexts/AuthContext'

const generalNavItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Applications', path: '/applications', icon: AppWindow },
]

const adminNavItems = [
  { label: 'Clusters', path: '/clusters', icon: Cloud },
  { label: 'Environments', path: '/environments', icon: Globe },
  { label: 'Templates', path: '/templates', icon: FileCode },
  { label: 'Users', path: '/users', icon: Users },
  { label: 'Tokens', path: '/tokens', icon: Key },
]

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-effect-strong sticky top-0 z-50 border-b border-neutral-200/80">
        <div className="flex items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Logo />
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-sm text-neutral-600">
                <User size={16} />
                <span>{user.full_name || user.email}</span>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
                title="Profile"
              >
                <Settings size={16} />
                <span className="hidden md:inline">Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
                title="Sair"
              >
                <LogOut size={16} />
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-40
            w-64 glass-effect-strong border-r border-neutral-200/80
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            pt-16 md:pt-0
          `}
        >
          <nav className="p-4 space-y-6">
            {/* Menu Geral */}
            <div>
              <ul className="space-y-1.5">
                {generalNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-xl
                          transition-all duration-200
                          ${
                            isActive
                              ? 'bg-gradient-primary text-white shadow-soft font-medium'
                              : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary-600'
                          }
                        `}
                      >
                        <Icon size={18} className={isActive ? 'text-white' : ''} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Menu Administrativo - Apenas para admins */}
            {user?.role === 'admin' && (
              <div>
                <div className="flex items-center gap-2 px-3 mb-3">
                  <Shield size={16} className="text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Administrative
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-xl
                            transition-all duration-200
                            ${
                              isActive
                                ? 'bg-gradient-primary text-white shadow-soft font-medium'
                                : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary-600'
                            }
                          `}
                        >
                          <Icon size={18} className={isActive ? 'text-white' : ''} />
                          <span className="text-sm">{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </nav>
        </aside>

        {/* Overlay para mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 lg:p-10 pb-24">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="glass-effect-strong border-t border-neutral-200/80 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <div className="w-4 h-4 bg-gradient-primary rounded"></div>
              <span>© {new Date().getFullYear()} Tron Platform. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-neutral-500">
              <span>Version 1.0.0</span>
              <span className="hidden md:inline">•</span>
              <span>Platform as a Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
