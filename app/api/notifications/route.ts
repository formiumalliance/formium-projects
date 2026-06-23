// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { markAllRead } from '@/lib/notifications/service'
import { handleApiError } from '@/lib/utils/api-error'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

    const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  })

    return NextResponse.json({ data: notifications, unreadCount })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { action, notificationId } = body

    if (action === 'mark-all-read') {
    await markAllRead(session.user.id)
    return NextResponse.json({ success: true })
  }

    if (action === 'mark-read' && notificationId) {
    await prisma.notification.update({
      where: { id: notificationId, userId: session.user.id },
      data: { isRead: true, readAt: new Date() },
    })
    return NextResponse.json({ success: true })
  }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}
