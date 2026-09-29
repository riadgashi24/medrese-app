import { useState } from 'react'
import { NavLink, useLocation, Link } from 'react-router-dom'
import { Bell, ChevronDown, ChevronRight, Menu, X } from 'lucide-react'
import { useInbox } from '@/lib/studentPortal'
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
  const [flyoutTop, setFlyoutTop] = useState(null)

  if (item.children) {
    return (
      <div onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFlyoutTop(null) }} onKeyDown={(event) => { if (event.key === 'Escape') setFlyoutTop(null) }}>
        <button
          type="button"
          aria-label={item.label}
          title={collapsed ? item.label : undefined}
          aria-expanded={collapsed ? flyoutTop !== null : open}
          onClick={(event) => collapsed ? setFlyoutTop(flyoutTop === null ? Math.min(event.currentTarget.getBoundingClientRect().top, window.innerHeight - 280) : null) : setOpen(!open)}
          className={cn('flex w-full items-center rounded-lg text-sm text-surface-300 hover:bg-white/5 hover:text-surface-100', collapsed ? 'h-11 justify-center p-0' : 'gap-2 px-3 py-2')}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </>
          )}
        </button>
        {collapsed && flyoutTop !== null && (
          <div className="fixed left-[76px] z-[60] w-52 rounded-xl border border-surface-700 bg-surface-950 p-2 shadow-xl" style={{ top: Math.max(8, flyoutTop) }}>
            <p className="px-3 py-2 text-sm font-semibold text-surface-100">{item.label}</p>
            {item.children.map(child => <NavLink key={child.path} to={child.path} onClick={() => { setFlyoutTop(null); onNavigate?.() }} className={({ isActive }) => cn('block rounded-lg px-3 py-2 text-sm', isActive ? 'bg-brand-500/12 text-brand-400' : 'text-surface-300 hover:bg-brand-500/10')}>{child.label}</NavLink>)}
          </div>
        )}
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
      aria-label={item.label}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
          collapsed && 'h-11 justify-center !p-0',
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

function StudentNotificationBell() {
  const { data, isError } = useInbox()
  const unread = data?.filter(n => !n.read).length || 0
  return <Link to="/student/notifications" aria-label={isError ? 'Njoftimet nuk u ngarkuan' : `Njoftime: ${unread} të palexuara`} className="relative rounded-lg p-2 text-surface-300 hover:bg-white/5"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-brand-600 px-1.5 text-[10px] text-white">{unread > 99 ? '99+' : unread}</span>}</Link>
}

export function Sidebar({ collapsed, mobileOpen, onMobileClose }) {
  const { user } = useAuth()
  const navItems = getNavForRole(user?.role)

  const content = (
    <>
      <div className={cn('flex items-center py-5 mb-2', collapsed ? 'justify-center px-1' : 'px-4')}>
        <Link to="/dashboard" aria-label="Medreseja Alauddin, paneli" className="flex items-center gap-2">
          {collapsed && <img src={logo} alt="Medreseja Alauddin" className="h-16 w-16 object-contain" />}

          {!collapsed && (
            <>
              <img src={logo} alt="Medreseja Alauddin" className="h-16 w-16 shrink-0 object-contain" />
              <span className="font-display text-lg text-surface-50 leading-4 mu-2 ">
                MEDRESEJA <span className="text-brand-400 ">ALAUDDIN</span>
              </span>
            </>
          )}</Link>
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
          'fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-white/8 bg-surface-950 transition-transform lg:static lg:transform-none',
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
        {['student', 'boarding'].includes(user?.role) && <StudentNotificationBell />}
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
        <Link to="/profile" aria-label="Hap profilin" className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-brand-500/50">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-medium text-surface-100">{user?.name}</div>
            <div className="text-[10px] font-mono text-surface-300 capitalize">
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
          {user?.photo_url ? (
            <img src={user.photo_url} alt="Hap profilin" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-400">
              {user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={logout}
          className="text-xs text-surface-300 hover:text-surface-100"
        >
          Dil
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
