import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await verifyProjectAccess(id, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const packages = await db.deliverablePackage.findMany({
    where: { projectId: id },
    include: {
      milestones: { orderBy: { date: 'asc' } },
      deliverables: { select: { id: true, name: true, status: true, dueDate: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(packages)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await verifyProjectAccess(id, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, description, deliverableIds = [], milestones = [] } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pkg = await db.$transaction(async (tx: any) => {
    const created = await tx.deliverablePackage.create({
      data: {
        projectId: id,
        name,
        description: description ?? null,
      },
    })

    if (milestones.length > 0) {
      await tx.milestone.createMany({
        data: milestones.map((m: { type: string; date: string; label?: string }) => ({
          packageId: created.id,
          projectId: id,
          type: m.type,
          date: new Date(m.date),
          label: m.label ?? null,
        })),
      })
    }

    if (deliverableIds.length > 0) {
      await tx.deliverable.updateMany({
        where: { id: { in: deliverableIds }, projectId: id },
        data: { packageId: created.id },
      })
    }

    return tx.deliverablePackage.findUnique({
      where: { id: created.id },
      include: {
        milestones: { orderBy: { date: 'asc' } },
        deliverables: { select: { id: true, name: true, status: true, dueDate: true } },
      },
    })
  })

  return NextResponse.json(pkg, { status: 201 })
}
