import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { DBAuditLogEntry } from '@/lib/db-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const memberships = await prisma.orgMember.findMany({ where: { userId: session.user.id } })
    if (!memberships.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const orgIds = memberships.map(m => m.organizationId)
    const guestOrgIds = memberships.filter(m => m.role === 'guest').map(m => m.organizationId)
    const project = await prisma.project.findFirst({
      where: { id, organizationId: { in: orgIds } },
    })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (guestOrgIds.includes(project.organizationId)) {
      const isMember = await prisma.projectMember.findFirst({ where: { projectId: id, userId: session.user.id } })
      if (!isMember) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const logs = await db.auditLog.findMany({
      where: { projectId: id, entity: 'deliverable' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true } } },
    })

    const entries: DBAuditLogEntry[] = logs.map((log: {
      id: string
      userId: string
      action: string
      entityName: string | null
      createdAt: Date
      user: { name: string | null } | null
    }) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      entityName: log.entityName,
      createdAt: log.createdAt,
      userName: log.user?.name ?? null,
    }))

    return NextResponse.json(entries)
  } catch (err) {
    console.error('[activity] Error:', err)
    return NextResponse.json([], { status: 200 })
  }
}
