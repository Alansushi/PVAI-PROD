import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

async function verifyProjectAccess(projectId: string, userId: string) {
  const memberships = await prisma.orgMember.findMany({
    where: { userId },
    select: { organizationId: true },
  })
  if (!memberships.length) return false
  const orgIds = memberships.map(m => m.organizationId)
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: { in: orgIds } },
    select: { id: true },
  })
  return !!project
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  if (!(await verifyProjectAccess(id, session.user.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const messages = await db.agentMessage.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'asc' },
    take: 30,
    select: {
      id: true, role: true, content: true, createdAt: true,
      cardType: true, dismissed: true, actions: true,
      executed: true, undone: true,
    },
  })

  return NextResponse.json({ messages })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: projectId } = await params
  if (!(await verifyProjectAccess(projectId, session.user.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  type PatchBody =
    | { messageId: string; dismissed: true }
    | { messageId: string; executed: true; beforeState: unknown }
    | { messageId: string; action: 'undo' }

  const body = await req.json() as PatchBody
  const { messageId } = body
  if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 })

  // --- dismiss ---
  if ('dismissed' in body) {
    await db.agentMessage.updateMany({
      where: { id: messageId, projectId },
      data: { dismissed: true },
    })
    return NextResponse.json({ ok: true })
  }

  // --- mark executed with beforeState ---
  if ('executed' in body) {
    await db.agentMessage.updateMany({
      where: { id: messageId, projectId },
      data: { executed: true, beforeState: body.beforeState ?? null },
    })
    return NextResponse.json({ ok: true })
  }

  // --- undo ---
  if ('action' in body && body.action === 'undo') {
    const msg = await db.agentMessage.findFirst({
      where: { id: messageId, projectId, executed: true, undone: false },
      select: { actions: true, beforeState: true },
    })
    if (!msg) return NextResponse.json({ error: 'Nothing to undo' }, { status: 404 })

    const actions = Array.isArray(msg.actions) ? (msg.actions as Array<Record<string, unknown>>) : []
    const primaryAction = actions.find((a) => a.variant === 'primary') ?? actions[0]
    const before = msg.beforeState as Record<string, unknown> | null

    if (primaryAction && before) {
      const actionType = primaryAction.actionType as string
      const payload = primaryAction.payload as Record<string, unknown> | undefined

      if ((actionType === 'update' || actionType === 'reassign') && payload?.id) {
        // Restore deliverable to beforeState values
        const updateData: Record<string, unknown> = {}
        if (before.status !== undefined) updateData.status = before.status
        if (before.dueDate !== undefined) updateData.dueDate = before.dueDate ? new Date(before.dueDate as string) : null
        if (before.priority !== undefined) updateData.priority = before.priority
        if (before.ownerName !== undefined) updateData.ownerName = before.ownerName
        if (Object.keys(updateData).length > 0) {
          await prisma.deliverable.updateMany({
            where: { id: payload.id as string, projectId },
            data: updateData,
          })
        }
      } else if (actionType === 'create' && before.createdId) {
        // Delete the deliverable that was created by this action
        await prisma.deliverable.deleteMany({
          where: { id: before.createdId as string, projectId },
        })
      }
    }

    await db.agentMessage.updateMany({
      where: { id: messageId, projectId },
      data: { undone: true },
    })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown operation' }, { status: 400 })
}
