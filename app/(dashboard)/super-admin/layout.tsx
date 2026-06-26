// app/(dashboard)/super-admin/layout.tsx
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout portalKey="super-admin" portalName="Super Admin">
      {children}
    </DashboardLayout>
  )
}
