import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { sendTaskAssignedEmail } from '@/lib/email'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

async function verifyDeliverableAccess(deliverableId: string, projectId: string, userId: string) {
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

  const deliverable = await prisma.deliverable.findFirst({
    where: { id: deliverableId, projectId },
  })
  if (!deliverable) return null

  return { deliverable, projectTitle: project.title }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; deliverableId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await verifyDeliverableAccess(params.deliverableId, params.id, session.user.id)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { deliverable: existing, projectTitle } = result
  const body = await req.json()

  const VALID_STATUS = ['ok', 'warn', 'danger']
  const VALID_PRIORITY = ['alta', 'media', 'baja']
  if (body.status && !VALID_STATUS.includes(body.status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  if (body.priority && !VALID_PRIORITY.includes(body.priority))
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })

  const updated = await db.deliverable.update({
    where: { id: params.deliverableId },
    data: {
      name: body.name ?? undefined,
      status: body.status ?? undefined,
      meta: body.meta ?? undefined,
      ownerId: body.ownerId !== undefined ? (body.ownerId || null) : undefined,
      ownerName: body.ownerName ?? undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      priority: body.priority ?? undefined,
      notes: body.notes ?? undefined,
      position: body.position ?? undefined,
      updatedById: session.user.id,
      updatedByName: session.user.name ?? null,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    action: 'update',
    entity: 'deliverable',
    entityId: updated.id,
    entityName: updated.name,
    projectId: params.id,
    deliverableId: updated.id,
    oldValue: { name: existing.name, status: existing.status, priority: existing.priority },
    newValue: { name: updated.name, status: updated.status, priority: updated.priority },
  })

  // Email + in-app notification when ownerId changes to a new user
  if (body.ownerId && body.ownerId !== existing.ownerId) {
    const assignee = await prisma.user.findUnique({ where: { id: body.ownerId } })
    if (assignee?.email) {
      await sendTaskAssignedEmail(assignee.email, {
        assigneeName: assignee.name ?? 'Colaborador',
        taskName: updated.name,
        projectTitle,
        dueDate: updated.dueDate,
      })
    }
    await db.notification.create({
      data: {
        userId: body.ownerId,
        title: 'Te asignaron una tarea',
        body: `"${updated.name}" en ${projectTitle}`,
        type: 'task_assigned',
        projectId: params.id,
        entityId: updated.id,
      },
    })
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; deliverableId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const deleteResult = await verifyDeliverableAccess(params.deliverableId, params.id, session.user.id)
  if (!deleteResult) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { deliverable: existingDel } = deleteResult

  await prisma.deliverable.delete({ where: { id: params.deliverableId } })

  await createAuditLog({
    userId: session.user.id,
    action: 'delete',
    entity: 'deliverable',
    entityId: params.deliverableId,
    entityName: existingDel.name,
    projectId: params.id,
    oldValue: { name: existingDel.name },
  })

  return NextResponse.json({ success: true })
}
