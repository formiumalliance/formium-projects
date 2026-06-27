// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
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
      <p style={{ fontSize: '72px', fontWeight: '700', color: '#e5e7eb', lineHeight: 1, marginBottom: '16px' }}>404</p>
      <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#111', marginBottom: '8px' }}>Page not found</h1>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
        The page you are looking for does not exist.
      </p>
      <Link href="/" style={{
        padding: '8px 16px',
        background: '#111',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        textDecoration: 'none',
      }}>
        Go to dashboard
      </Link>
    </div>
  )
}
