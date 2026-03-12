import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

async function verifyProjectAccess(projectId: string, userId: string) {
  const memberships = await prisma.orgMember.findMany({ where: { userId } })
  if (!memberships.length) return null
  const orgIds = memberships.map(m => m.organizationId)
  const guestOrgIds = memberships.filter(m => m.role === 'guest').map(m => m.organizationId)
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: { in: orgIds } },
  })
  if (!project) return null
  if (guestOrgIds.includes(project.organizationId)) {
    const isMember = await prisma.projectMember.findFirst({ where: { projectId, userId } })
    if (!isMember) return null
  }
  return project
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await verifyProjectAccess(params.id, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, initials, color, role } = body

  if (!name || !color || !role) {
    return NextResponse.json({ error: 'name, color, role are required' }, { status: 400 })
  }

  const existing = await prisma.projectMember.findFirst({
    where: { id: params.memberId, projectId: params.id },
  })
  if (!existing) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const updated = await prisma.projectMember.update({
    where: { id: params.memberId },
    data: {
      name,
      initials: initials ?? existing.initials,
      color,
      role,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    action: 'update',
    entity: 'member',
    entityId: params.memberId,
    entityName: name,
    projectId: params.id,
    oldValue: { name: existing.name, role: existing.role, color: existing.color },
    newValue: { name, role, color },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await verifyProjectAccess(params.id, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = await prisma.projectMember.findFirst({
    where: { id: params.memberId, projectId: params.id },
  })
  if (!existing) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  await prisma.projectMember.delete({ where: { id: params.memberId } })

  await createAuditLog({
    userId: session.user.id,
    action: 'delete',
    entity: 'member',
    entityId: params.memberId,
    entityName: existing.name,
    projectId: params.id,
    oldValue: { name: existing.name, role: existing.role },
  })

  return NextResponse.json({ success: true })
}
