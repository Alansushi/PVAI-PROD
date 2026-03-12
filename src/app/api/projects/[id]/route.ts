import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

async function getProjectForUser(projectId: string, userId: string) {
  const memberships = await prisma.orgMember.findMany({ where: { userId } })
  if (!memberships.length) return null

  const orgIds = memberships.map(m => m.organizationId)
  const guestOrgIds = memberships.filter(m => m.role === 'guest').map(m => m.organizationId)

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: { in: orgIds } },
    include: {
      members: true,
      deliverables: { orderBy: { position: 'asc' } },
      ganttRows: { orderBy: { order: 'asc' } },
    },
  })
  if (!project) return null

  if (guestOrgIds.includes(project.organizationId)) {
    const isMember = await prisma.projectMember.findFirst({ where: { projectId, userId } })
    if (!isMember) return null
  }

  return project
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await getProjectForUser(id, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(project)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await getProjectForUser(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const updated = await prisma.project.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      type: body.type ?? undefined,
      status: body.status ?? undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      nextPaymentAmount: body.nextPaymentAmount ?? undefined,
      nextPaymentStatus: body.nextPaymentStatus ?? undefined,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    action: 'update',
    entity: 'project',
    entityId: updated.id,
    entityName: updated.title,
    projectId: updated.id,
    oldValue: { title: existing.title, type: existing.type, status: existing.status },
    newValue: { title: updated.title, type: updated.type, status: updated.status },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await getProjectForUser(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const orgMember = await prisma.orgMember.findFirst({
    where: { userId: session.user.id, organizationId: existing.organizationId },
  })
  if (!orgMember?.canDeleteProjects) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.project.delete({ where: { id } })

  await createAuditLog({
    userId: session.user.id,
    action: 'delete',
    entity: 'project',
    entityId: id,
    entityName: existing.title,
    oldValue: { title: existing.title },
  })

  return NextResponse.json({ success: true })
}
