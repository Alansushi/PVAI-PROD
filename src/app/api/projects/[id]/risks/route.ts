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

    const risks = await db.projectRisk.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(risks)
  } catch (err) {
    console.error('[risks GET]', err)
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
    const { title, description, probability, impact, status, mitigation, ownerName } = body

    if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

    const risk = await db.projectRisk.create({
      data: {
        projectId: id,
        title: title.trim(),
        description: description?.trim() || null,
        probability: probability ?? 'medium',
        impact: impact ?? 'medium',
        status: status ?? 'open',
        mitigation: mitigation?.trim() || null,
        ownerName: ownerName?.trim() || null,
      },
    })
    return NextResponse.json(risk, { status: 201 })
  } catch (err) {
    console.error('[risks POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
