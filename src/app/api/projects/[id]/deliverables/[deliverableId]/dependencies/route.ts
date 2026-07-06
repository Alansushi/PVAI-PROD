import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireProjectAccess as getProjectAccess } from '@/lib/project-access'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

type Params = { params: Promise<{ id: string; deliverableId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, deliverableId } = await params
    const project = await getProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const blockedBy = await db.deliverableDependency.findMany({
      where: { blockedId: deliverableId },
      include: { blocker: { select: { id: true, name: true, status: true } } },
    })
    return NextResponse.json({ blockedBy })
  } catch (err) {
    console.error('[dependencies GET]', err)
    return NextResponse.json({ blockedBy: [] })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, deliverableId } = await params
    const project = await getProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { blockerId } = await req.json()
    if (!blockerId) return NextResponse.json({ error: 'blockerId required' }, { status: 400 })
    if (blockerId === deliverableId) return NextResponse.json({ error: 'Cannot depend on itself' }, { status: 400 })

    // Validate both deliverables belong to this project
    const [blockerDel, blockedDel] = await Promise.all([
      prisma.deliverable.findFirst({ where: { id: blockerId, projectId: id } }),
      prisma.deliverable.findFirst({ where: { id: deliverableId, projectId: id } }),
    ])
    if (!blockerDel || !blockedDel) return NextResponse.json({ error: 'Deliverable not found in project' }, { status: 404 })

    const dep = await db.deliverableDependency.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId: deliverableId } },
      update: {},
      create: { blockerId, blockedId: deliverableId },
      include: { blocker: { select: { id: true, name: true, status: true } } },
    })
    return NextResponse.json(dep, { status: 201 })
  } catch (err) {
    console.error('[dependencies POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, deliverableId } = await params
    const project = await getProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { blockerId } = await req.json()
    if (!blockerId) return NextResponse.json({ error: 'blockerId required' }, { status: 400 })

    await db.deliverableDependency.deleteMany({
      where: { blockerId, blockedId: deliverableId },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[dependencies DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
