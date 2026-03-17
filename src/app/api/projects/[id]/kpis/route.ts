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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const project = await getProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const kpis = await db.projectKPI.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(kpis)
  } catch (err) {
    console.error('[kpis GET]', err)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const project = await getProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const { title, target, current, unit } = body

    if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
    if (target === undefined || target === null) return NextResponse.json({ error: 'target required' }, { status: 400 })

    const kpi = await db.projectKPI.create({
      data: {
        projectId: id,
        title: title.trim(),
        target: parseFloat(target),
        current: current !== undefined ? parseFloat(current) : 0,
        unit: unit?.trim() ?? '',
      },
    })
    return NextResponse.json(kpi, { status: 201 })
  } catch (err) {
    console.error('[kpis POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
