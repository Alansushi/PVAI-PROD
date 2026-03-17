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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; riskId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, riskId } = await params
    const project = await getProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const { title, description, probability, impact, status, mitigation, ownerName } = body

    const risk = await db.projectRisk.update({
      where: { id: riskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(probability !== undefined && { probability }),
        ...(impact !== undefined && { impact }),
        ...(status !== undefined && { status }),
        ...(mitigation !== undefined && { mitigation: mitigation?.trim() || null }),
        ...(ownerName !== undefined && { ownerName: ownerName?.trim() || null }),
      },
    })
    return NextResponse.json(risk)
  } catch (err) {
    console.error('[risks PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; riskId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, riskId } = await params
    const project = await getProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.projectRisk.delete({ where: { id: riskId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[risks DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
