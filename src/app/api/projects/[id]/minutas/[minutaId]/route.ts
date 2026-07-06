import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireProjectAccess } from '@/lib/project-access'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; minutaId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, minutaId } = await params

  const project = await requireProjectAccess(session.user.id, id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const minuta = await db.processedMinuta.findUnique({
    where: { id: minutaId },
    include: { user: { select: { name: true } } },
  })

  if (!minuta || minuta.projectId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...minuta,
    createdAt: minuta.createdAt.toISOString(),
    userName: minuta.user?.name ?? null,
  })
}
