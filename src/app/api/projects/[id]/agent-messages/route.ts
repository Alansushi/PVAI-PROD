import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify user has access via org membership
  const memberships = await prisma.orgMember.findMany({
    where: { userId: session.user.id },
    select: { organizationId: true },
  })
  if (!memberships.length) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 })
  }

  const orgIds = memberships.map(m => m.organizationId)
  const project = await prisma.project.findFirst({
    where: { id, organizationId: { in: orgIds } },
    select: { id: true },
  })
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any
  const messages = await db.agentMessage.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'asc' },
    take: 30,
    select: { id: true, role: true, content: true, createdAt: true, cardType: true, dismissed: true, actions: true },
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
  const { messageId } = await req.json() as { messageId: string }
  if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any
  await db.agentMessage.updateMany({
    where: { id: messageId, projectId },
    data: { dismissed: true },
  })
  return NextResponse.json({ ok: true })
}
