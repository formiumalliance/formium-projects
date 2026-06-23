// app/(dashboard)/settings/layout.tsx
import { requireAuth } from '@/lib/auth/session'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { User } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Account', href: '/settings', icon: User },
]

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()
  return (
    <DashboardLayout navItems={NAV_ITEMS} portalName="Account Settings">
      {children}
    </DashboardLayout>
  )
}
