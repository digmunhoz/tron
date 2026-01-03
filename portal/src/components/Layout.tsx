import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  Home,
  Cloud,
  Globe,
  AppWindow,
  Menu,
  X,
  Sparkles,
  Shield,
  FileCode,
} from 'lucide-react'

const generalNavItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Applications', path: '/applications', icon: AppWindow },
]

const adminNavItems = [
  { label: 'Clusters', path: '/clusters', icon: Cloud },
  { label: 'Environments', path: '/environments', icon: Globe },
  { label: 'Templates', path: '/templates', icon: FileCode },
]

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Sparkles className="text-blue-600" size={20} />
              </div>
              <span className="text-xl font-semibold text-slate-800 tracking-tight">
                Tron
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-40
            w-64 bg-white/95 backdrop-blur-sm border-r border-slate-200/60
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            pt-16 md:pt-0
          `}
        >
          <nav className="p-4 space-y-6">
            {/* Menu Geral */}
            <div>
              <ul className="space-y-1">
                {generalNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg
                          transition-all duration-200
                          ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }
                        `}
                      >
                        <Icon size={18} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Menu Administrativo */}
            <div>
              <div className="flex items-center gap-2 px-3 mb-2">
                <Shield size={16} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Administrative
                </span>
              </div>
            <ul className="space-y-1">
                {adminNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200
                        ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }
                      `}
                    >
                      <Icon size={18} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
            </div>
          </nav>
        </aside>

        {/* Overlay para mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
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
      <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200/60 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Sparkles className="text-blue-600" size={16} />
              <span>© {new Date().getFullYear()} Tron Platform. Todos os direitos reservados.</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>Versão 1.0.0</span>
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
