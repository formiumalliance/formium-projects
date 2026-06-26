// app/(dashboard)/client/layout.tsx
import { requireClientRole } from '@/lib/auth/session'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  await requireClientRole()
  return (
    <DashboardLayout portalKey="client" portalName="Client Portal">
      {children}
    </DashboardLayout>
  )
}
