'use client'
// app/(dashboard)/error.tsx — Dashboard-level error boundary
import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        background: 'var(--red-bg, #fee2e2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        fontSize: '20px',
      }}>
        ⚠️
      </div>
      <h2 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>
        This page ran into an error
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary, #666)', marginBottom: '8px', maxWidth: '340px' }}>
        Something went wrong loading this page. Your data is safe — try refreshing or go back to the dashboard.
      </p>
      {error?.digest && (
        <p style={{ fontSize: '11px', color: 'var(--text-tertiary, #999)', marginBottom: '20px', fontFamily: 'monospace' }}>
          Ref: {error.digest}
        </p>
      )}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={reset}
          style={{
            padding: '8px 16px',
            background: 'var(--accent, #dc2626)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link href="/" style={{
          padding: '8px 16px',
          background: 'var(--bg-secondary, #f9fafb)',
          color: 'var(--text, #111)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '500',
          textDecoration: 'none',
          display: 'inline-block',
        }}>
          Dashboard home
        </Link>
      </div>
    </div>
  )
}
