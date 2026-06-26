// app/(dashboard)/settings/layout.tsx
import { requireAuth } from '@/lib/auth/session'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()
  return (
    <DashboardLayout portalKey="settings" portalName="Account Settings">
      {children}
    </DashboardLayout>
  )
}
