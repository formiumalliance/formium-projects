// app/(dashboard)/profile/page.tsx
// Redirects to /settings which has the full profile management UI
import { redirect } from 'next/navigation'

export default function ProfilePage() {
  redirect('/settings')
}
