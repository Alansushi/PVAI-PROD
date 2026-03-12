import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any
  const notification = await db.notification.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.notification.update({
    where: { id },
    data: { read: true },
  })

  return NextResponse.json(updated)
}
