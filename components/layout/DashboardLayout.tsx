// components/layout/DashboardLayout.tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, FolderKanban, Users, Settings, Bell,
  LogOut, Sun, Moon, Menu, X, ChevronDown, ChevronRight,
  FileText, GitBranch, Inbox, Archive, BarChart2, Shield,
  Code2, UserCheck, Briefcase, PlusCircle, Package
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

interface DashboardLayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
  portalName: string
}

export default function DashboardLayout({ children, navItems, portalName }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    fetch('/api/notifications?unread=true')
      .then(r => r.json())
      .then(data => setUnreadCount(data.unreadCount || 0))
      .catch(() => {})
  }, [pathname])

  const user = session?.user

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg-secondary)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 40,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '240px',
        flexShrink: 0,
        background: 'var(--bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
      className="max-lg:translate-x-[-100%] lg:translate-x-0"
      >
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
              <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.4px', color: 'var(--text)' }}>
                Formium
              </span>
              <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '16px' }}>·</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px', fontWeight: '500' }}>
              {portalName}
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{ padding: '6px', height: 'auto' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={16} strokeWidth={1.75} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    background: 'var(--accent)',
                    color: '#fff',
                    borderRadius: '100px',
                    padding: '1px 6px',
                    minWidth: '18px',
                    textAlign: 'center',
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{
          padding: '12px 10px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}>
          {/* Theme toggle */}
          <button
            className="nav-item"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

          {/* User info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: 'var(--radius)',
          }}>
            <div className="avatar avatar-sm" style={{
              background: 'var(--accent-muted)',
              color: 'var(--accent)',
              fontSize: '11px',
              fontWeight: '700',
            }}>
              {user?.name ? getInitials(user.name) : '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.2 }}>
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px', height: 'auto', color: 'var(--text-tertiary)' }}
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: 'clamp(0px, 240px, 240px)', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}
        className="lg:ml-[240px] ml-0"
      >
        {/* Top bar */}
        <header style={{
          height: '56px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <button
            className="btn btn-ghost btn-sm lg:hidden"
            style={{ padding: '6px', height: 'auto' }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>

          <div style={{ flex: 1 }} />

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '8px', height: 'auto', position: 'relative' }}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  background: 'var(--accent)',
                  borderRadius: '100%',
                  border: '1.5px solid var(--bg)',
                }} />
              )}
            </button>
            {notificationsOpen && (
              <NotificationsDropdown onClose={() => setNotificationsOpen(false)} />
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '24px 20px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
