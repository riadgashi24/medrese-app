import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNavForRole } from '@/data/navigation'
import { useAuth } from '@/context/AuthContext'
import logo from '@/assets/logo.png'

function NavItem({ item, collapsed, onNavigate }) {
  const location = useLocation()
  const [open, setOpen] = useState(
    item.children?.some((c) => location.pathname.startsWith(c.path)) ?? false,
  )
  const Icon = item.icon

  if (item.children) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-300 hover:bg-white/5 hover:text-surface-100"
        >
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-white/8 pl-3">
            {item.children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'block rounded-lg px-3 py-1.5 text-xs transition-colors',
                    isActive
                      ? 'bg-brand-500/12 text-brand-400'
                      : 'text-surface-300 hover:text-surface-100',
                  )
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-brand-500/12 text-brand-400'
            : 'text-surface-300 hover:bg-white/5 hover:text-surface-100',
        )
      }
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="text-[9px] font-mono text-amber-400">{item.badge}</span>
          )}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar({ collapsed, mobileOpen, onMobileClose }) {
  const { user } = useAuth()
  const navItems = getNavForRole(user?.role)

  const content = (
    <>
      <div className="flex items-center gap-0 px-3 py-4 mb-2 ml-3">

        {collapsed && <img src={logo} alt="Logo" className="h-10 w-full" />}

        {!collapsed && (
          <>
          <img src={logo} alt="Logo" className="h-15 w-20" />
          <span className="font-display text-lg text-surface-50 leading-4 mu-2 ">
            MEDRESEJA <span className="text-brand-400 ">ALAUDDIN</span>
          </span>
          </>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            collapsed={collapsed}
            onNavigate={onMobileClose}
          />
        ))}
      </nav>
    </>
  )

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/8 bg-surface-950/95 backdrop-blur-xl transition-transform lg:static lg:translate-x-0',
          collapsed ? 'w-[72px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-end p-2 lg:hidden">
          <button type="button" onClick={onMobileClose} className="p-2 text-surface-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        {content}
      </aside>
    </>
  )
}

export function TopBar({ onMenuClick, collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/8 bg-surface-950/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-surface-300 hover:bg-white/5 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden rounded-lg p-2 text-surface-300 hover:bg-white/5 lg:block"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <div className="text-sm font-medium text-surface-100">{user?.name}</div>
          <div className="text-[10px] font-mono text-surface-300 capitalize">
            {user?.role?.replace('_', ' ')}
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-400">
          {user?.initials}
        </div>
        <button
          type="button"
          onClick={logout}
          className="text-xs text-surface-300 hover:text-surface-100"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}

export function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="relative flex min-h-screen">
      <div className="mesh-bg" />
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="relative z-10 flex flex-1 flex-col min-w-0">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px]">{children}</main>
      </div>
    </div>
  )
}
