// components/layout/DashboardLayout.tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import {
  Bell, LogOut, Sun, Moon, Menu, X,
  LayoutDashboard, FolderKanban, Users, Settings, FileText,
  Shield, Package, GitBranch, Archive, CheckSquare, MessageSquare,
  PlusCircle, TrendingUp, FolderOpen, User
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { useBranding } from '@/components/providers/BrandingProvider'
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown'

// ─── Nav definitions (all icons live here, never passed as props) ─────────────
const PORTAL_NAV: Record<string, { label: string; href: string; icon: React.ElementType }[]> = {
  'super-admin': [
    { label: 'Dashboard',       href: '/super-admin',                 icon: LayoutDashboard },
    { label: 'All Projects',    href: '/super-admin/projects',        icon: FolderKanban },
    { label: 'Users',           href: '/super-admin/users',           icon: Users },
    { label: 'Templates',       href: '/super-admin/templates',       icon: FileText },
    { label: 'Documents',       href: '/super-admin/documents',       icon: FileText },
    { label: 'Change Requests', href: '/super-admin/change-requests', icon: GitBranch },
    { label: 'Handovers',       href: '/super-admin/handovers',       icon: Package },
    { label: 'Archive',         href: '/super-admin/archive',         icon: Archive },
    { label: 'Audit Log',       href: '/super-admin/audit',           icon: Shield },
    { label: 'Settings',        href: '/super-admin/settings',        icon: Settings },
  ],
  'project-head': [
    { label: 'Dashboard',       href: '/project-head',                 icon: LayoutDashboard },
    { label: 'All Projects',    href: '/project-head/projects',        icon: FolderKanban },
    { label: 'Team',            href: '/project-head/team',            icon: Users },
    { label: 'Change Requests', href: '/project-head/change-requests', icon: GitBranch },
    { label: 'Handovers',       href: '/project-head/handovers',       icon: Package },
    { label: 'Documents',       href: '/project-head/documents',       icon: FileText },
    { label: 'Templates',       href: '/project-head/templates',       icon: Settings },
  ],
  'pm': [
    { label: 'Dashboard',       href: '/pm',                 icon: LayoutDashboard },
    { label: 'Projects',        href: '/pm/projects',        icon: FolderKanban },
    { label: 'Tasks',           href: '/pm/tasks',           icon: CheckSquare },
    { label: 'Updates',         href: '/pm/updates',         icon: MessageSquare },
    { label: 'Change Requests', href: '/pm/change-requests', icon: GitBranch },
    { label: 'Feedback',        href: '/pm/feedback',        icon: MessageSquare },
    { label: 'Documents',       href: '/pm/documents',       icon: FileText },
    { label: 'Handover',        href: '/pm/handover',        icon: Package },
  ],
  'bgm': [
    { label: 'Dashboard',       href: '/bgm',              icon: LayoutDashboard },
    { label: 'All Projects',    href: '/bgm/projects',     icon: FolderKanban },
    { label: 'New Project',     href: '/bgm/projects/new', icon: PlusCircle },
    { label: 'Proposals',       href: '/bgm/proposals',    icon: FileText },
    { label: 'Contact Sphere',  href: '/bgm/contacts',     icon: Users },
    { label: 'Revenue',         href: '/bgm/revenue',      icon: TrendingUp },
  ],
  'dev': [
    { label: 'My Tasks', href: '/dev',          icon: CheckSquare },
    { label: 'Projects', href: '/dev/projects', icon: FolderKanban },
    { label: 'Updates',  href: '/dev/updates',  icon: MessageSquare },
  ],
  'client': [
    { label: 'Dashboard',       href: '/client',                 icon: LayoutDashboard },
    { label: 'My Projects',     href: '/client/projects',        icon: FolderOpen },
    { label: 'Updates',         href: '/client/updates',         icon: MessageSquare },
    { label: 'Change Requests', href: '/client/change-requests', icon: GitBranch },
    { label: 'Files',           href: '/client/files',           icon: FileText },
    { label: 'Handover',        href: '/client/handover',        icon: Package },
  ],
  'settings': [
    { label: 'Account', href: '/settings', icon: User },
  ],
}

interface DashboardLayoutProps {
  children: React.ReactNode
  portalKey: string   // e.g. 'super-admin', 'pm', 'dev', etc.
  portalName: string  // e.g. 'Super Admin', 'PM Portal', etc.
}

export default function DashboardLayout({ children, portalKey, portalName }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  const navItems = PORTAL_NAV[portalKey] ?? []
  const user = session?.user
  const { logoUrl } = useBranding()

  useEffect(() => {
    fetch('/api/notifications?unread=true')
      .then(r => r.json())
      .then(data => setUnreadCount(data.unreadCount || 0))
      .catch(() => {})
  }, [pathname])

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.4px', color: 'var(--text)' }}>
                    Formium
                  </span>
                  <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '16px' }}>·</span>
                </div>
              )}
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
          <button
            className="nav-item"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

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

        <main style={{ flex: 1, padding: '24px 20px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
