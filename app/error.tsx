'use client'
// app/error.tsx — Global error boundary: catches server/client render errors
// Prevents one broken page from making the entire site appear down
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#fafafa',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: '#fee2e2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        fontSize: '24px',
      }}>
        ⚠️
      </div>
      <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#111', marginBottom: '8px' }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px', maxWidth: '360px' }}>
        This page ran into an error. The rest of the app is unaffected.
      </p>
      {error?.digest && (
        <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px', fontFamily: 'monospace' }}>
          Error ID: {error.digest}
        </p>
      )}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={reset}
          style={{
            padding: '8px 16px',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            padding: '8px 16px',
            background: '#fff',
            color: '#111',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            textDecoration: 'none',
          }}
        >
          Go to dashboard
        </a>
      </div>
    </div>
  )
}
