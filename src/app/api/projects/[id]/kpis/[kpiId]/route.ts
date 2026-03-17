import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

async function getProjectAccess(userId: string, projectId: string) {
  const memberships = await prisma.orgMember.findMany({ where: { userId } })
  if (!memberships.length) return null
  const orgIds = memberships.map(m => m.organizationId)
  const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: { in: orgIds } } })
  if (!project) return null
  const guestOrgIds = memberships.filter(m => m.role === 'guest').map(m => m.organizationId)
  if (guestOrgIds.includes(project.organizationId)) {
    const isMember = await prisma.projectMember.findFirst({ where: { projectId, userId } })
    if (!isMember) return null
  }
  return project
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; kpiId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, kpiId } = await params
    const project = await getProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const { title, target, current, unit } = body

    const kpi = await db.projectKPI.update({
      where: { id: kpiId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(target !== undefined && { target: parseFloat(target) }),
        ...(current !== undefined && { current: parseFloat(current) }),
        ...(unit !== undefined && { unit: unit.trim() }),
      },
    })
    return NextResponse.json(kpi)
  } catch (err) {
    console.error('[kpis PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; kpiId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, kpiId } = await params
    const project = await getProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.projectKPI.delete({ where: { id: kpiId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[kpis DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
