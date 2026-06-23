// app/(auth)/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign in | Formium Projects',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
