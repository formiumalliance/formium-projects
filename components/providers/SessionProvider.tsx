'use client'
// components/providers/SessionProvider.tsx
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { BrandingProvider } from './BrandingProvider'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {/* FIX BUG-007: ThemeProvider was missing — dark mode toggle had no effect */}
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <BrandingProvider>
          {children}
        </BrandingProvider>
      </ThemeProvider>
    </NextAuthSessionProvider>
  )
}
