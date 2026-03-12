import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; minutaId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberships = await prisma.orgMember.findMany({ where: { userId: session.user.id } })
  if (!memberships.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const orgIds = memberships.map(m => m.organizationId)
  const guestOrgIds = memberships.filter(m => m.role === 'guest').map(m => m.organizationId)
  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: { in: orgIds } },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (guestOrgIds.includes(project.organizationId)) {
    const isMember = await prisma.projectMember.findFirst({ where: { projectId: params.id, userId: session.user.id } })
    if (!isMember) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const minuta = await db.processedMinuta.findUnique({
    where: { id: params.minutaId },
    include: { user: { select: { name: true } } },
  })

  if (!minuta || minuta.projectId !== params.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...minuta,
    createdAt: minuta.createdAt.toISOString(),
    userName: minuta.user?.name ?? null,
  })
}
