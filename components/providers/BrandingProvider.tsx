'use client'
// components/providers/BrandingProvider.tsx — FR-005: Global branding
import { createContext, useContext, useEffect, useState } from 'react'

interface Branding { logoUrl: string | null; faviconUrl: string | null }

const BrandingContext = createContext<Branding>({ logoUrl: null, faviconUrl: null })
export const useBranding = () => useContext(BrandingContext)

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding>({ logoUrl: null, faviconUrl: null })

  useEffect(() => {
    fetch('/api/admin/branding')
      .then(r => r.json())
      .then(d => {
        setBranding({ logoUrl: d.logoUrl, faviconUrl: d.faviconUrl })
        // FR-005: dynamically update favicon
        if (d.faviconUrl) {
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
            || document.createElement('link')
          link.type = 'image/x-icon'
          link.rel  = 'shortcut icon'
          link.href = d.faviconUrl
          document.head.appendChild(link)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  )
}
