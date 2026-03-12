import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await verifyProjectAccess(params.id, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const deliverables = await prisma.deliverable.findMany({
    where: { projectId: params.id },
    orderBy: { position: 'asc' },
  })

  return NextResponse.json(deliverables)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await verifyProjectAccess(params.id, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, status, meta, ownerId, ownerName, dueDate, startDate, priority, notes, position } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const VALID_STATUS = ['ok', 'warn', 'danger']
  const VALID_PRIORITY = ['alta', 'media', 'baja']
  if (status && !VALID_STATUS.includes(status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  if (priority && !VALID_PRIORITY.includes(priority))
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })

  const deliverable = await db.deliverable.create({
    data: {
      projectId: params.id,
      name,
      status: status ?? 'warn',
      meta: meta ?? '',
      ownerId: ownerId ?? null,
      ownerName: ownerName ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      startDate: startDate ? new Date(startDate) : null,
      priority: priority ?? 'media',
      notes: notes ?? '',
      position: position ?? 0,
      createdById: session.user.id,
      createdByName: session.user.name ?? null,
      updatedById: session.user.id,
      updatedByName: session.user.name ?? null,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    action: 'create',
    entity: 'deliverable',
    entityId: deliverable.id,
    entityName: deliverable.name,
    projectId: params.id,
    deliverableId: deliverable.id,
    newValue: { name, status, priority },
  })

  // In-app notification when task is created with an owner (and it's not the creator)
  if (ownerId && ownerId !== session.user.id) {
    await db.notification.create({
      data: {
        userId: ownerId,
        title: 'Nueva tarea asignada',
        body: `"${deliverable.name}" en ${project.title}`,
        type: 'task_created',
        projectId: params.id,
        entityId: deliverable.id,
      },
    })
  }

  return NextResponse.json(deliverable, { status: 201 })
}
