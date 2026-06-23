'use client'
// app/(auth)/reset-password/page.tsx
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

function ResetForm() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token') || ''
  const [form, setForm]       = useState({ password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (!token) { toast.error('Invalid reset link'); return }
    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: form.password }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || 'Link may have expired'); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  if (!token) return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Invalid or missing reset token.</p>
      <Link href="/forgot-password" className="btn btn-secondary">Request new link</Link>
    </div>
  )

  if (done) return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width:'52px',height:'52px',borderRadius:'100%',background:'var(--green-bg)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:'22px' }}>✓</div>
      <h2 style={{ fontSize:'20px',fontWeight:'700',marginBottom:'8px' }}>Password updated</h2>
      <p style={{ fontSize:'14px',color:'var(--text-secondary)' }}>Redirecting you to sign in…</p>
    </div>
  )

  return (
    <>
      <h1 style={{ fontSize:'22px',fontWeight:'700',letterSpacing:'-0.4px',marginBottom:'6px' }}>Set new password</h1>
      <p style={{ fontSize:'14px',color:'var(--text-secondary)',marginBottom:'28px' }}>Choose a strong password for your account.</p>
      <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:'14px' }}>
        <div>
          <label className="input-label">New password</label>
          <div style={{ position:'relative' }}>
            <input className="input" type={showPw?'text':'password'} placeholder="Minimum 8 characters"
              value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
              required autoFocus style={{ paddingRight:'44px' }} />
            <button type="button" onClick={()=>setShowPw(v=>!v)}
              style={{ position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-tertiary)',padding:'0' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="input-label">Confirm new password</label>
          <input className="input" type={showPw?'text':'password'} placeholder="Repeat your password"
            value={form.confirm} onChange={e=>setForm(f=>({...f,confirm:e.target.value}))} required />
        </div>
        {form.password && (
          <div>
            <div style={{ display:'flex',gap:'4px',marginBottom:'4px' }}>
              {[8,12,16].map(l=>(
                <div key={l} style={{ flex:1,height:'3px',borderRadius:'100px',background:form.password.length>=l?'var(--accent)':'var(--border)',transition:'background 0.2s' }} />
              ))}
            </div>
            <p style={{ fontSize:'11px',color:'var(--text-tertiary)' }}>
              {form.password.length<8?'Too short':form.password.length<12?'Good — try longer for stronger security':'Strong password'}
            </p>
          </div>
        )}
        <button type="submit" className="btn btn-primary" style={{ width:'100%',height:'44px',marginTop:'4px' }} disabled={loading}>
          {loading?'Updating…':'Update password'}
        </button>
      </form>
      <div style={{ textAlign:'center',marginTop:'24px' }}>
        <Link href="/login" style={{ fontSize:'14px',color:'var(--text-secondary)',display:'inline-flex',alignItems:'center',gap:'5px',textDecoration:'none' }}>
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:'24px' }}>
      <div style={{ width:'100%',maxWidth:'380px' }}>
        <div style={{ textAlign:'center',marginBottom:'40px' }}>
          <span style={{ fontSize:'22px',fontWeight:'700',letterSpacing:'-0.5px',color:'var(--text)' }}>Formium</span>
          <span style={{ color:'var(--accent)',fontWeight:'700',fontSize:'22px' }}>·</span>
        </div>
        <Suspense fallback={<div style={{ textAlign:'center',color:'var(--text-secondary)',fontSize:'14px' }}>Loading…</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
