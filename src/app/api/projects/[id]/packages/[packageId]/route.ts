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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; packageId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await verifyProjectAccess(params.id, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = await db.deliverablePackage.findFirst({
    where: { id: params.packageId, projectId: params.id },
    include: { deliverables: { select: { id: true } } },
  })
  if (!existing) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

  const body = await req.json()
  const { name, description, deliverableIds = [], milestones = [] } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pkg = await db.$transaction(async (tx: any) => {
    await tx.deliverablePackage.update({
      where: { id: params.packageId },
      data: { name, description: description ?? null },
    })

    // Recreate milestones
    await tx.milestone.deleteMany({ where: { packageId: params.packageId } })
    if (milestones.length > 0) {
      await tx.milestone.createMany({
        data: milestones.map((m: { type: string; date: string; label?: string }) => ({
          packageId: params.packageId,
          projectId: params.id,
          type: m.type,
          date: new Date(m.date),
          label: m.label ?? null,
        })),
      })
    }

    // Diff deliverables: unlink removed, link new
    const prevIds = existing.deliverables.map((d: { id: string }) => d.id)
    const toUnlink = prevIds.filter((id: string) => !deliverableIds.includes(id))
    const toLink = deliverableIds.filter((id: string) => !prevIds.includes(id))

    if (toUnlink.length > 0) {
      await tx.deliverable.updateMany({
        where: { id: { in: toUnlink } },
        data: { packageId: null },
      })
    }
    if (toLink.length > 0) {
      await tx.deliverable.updateMany({
        where: { id: { in: toLink }, projectId: params.id },
        data: { packageId: params.packageId },
      })
    }

    return tx.deliverablePackage.findUnique({
      where: { id: params.packageId },
      include: {
        milestones: { orderBy: { date: 'asc' } },
        deliverables: { select: { id: true, name: true, status: true, dueDate: true } },
      },
    })
  })

  return NextResponse.json(pkg)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; packageId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = await verifyProjectAccess(params.id, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = await db.deliverablePackage.findFirst({
    where: { id: params.packageId, projectId: params.id },
  })
  if (!existing) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

  await db.deliverablePackage.delete({ where: { id: params.packageId } })

  return NextResponse.json({ ok: true })
}
