import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(notifications)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { userId, title, body: notifBody, type, projectId, entityId } = body

  if (!userId || !title || !notifBody || !type) {
    return NextResponse.json({ error: 'userId, title, body, type are required' }, { status: 400 })
  }

  // Validate target user belongs to same org as requester
  const requesterMembership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!requesterMembership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const targetMembership = await prisma.orgMember.findFirst({
    where: { userId, organizationId: requesterMembership.organizationId },
  })
  if (!targetMembership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const notification = await db.notification.create({
    data: { userId, title, body: notifBody, type, projectId, entityId },
  })

  return NextResponse.json(notification, { status: 201 })
}

// PUT /api/notifications/read-all
export async function PUT() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}
