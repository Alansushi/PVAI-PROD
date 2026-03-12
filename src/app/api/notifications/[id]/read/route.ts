import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any
  const notification = await db.notification.findFirst({
    where: { id: params.id, userId: session.user.id },
  })

  if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.notification.update({
    where: { id: params.id },
    data: { read: true },
  })

  return NextResponse.json(updated)
}
