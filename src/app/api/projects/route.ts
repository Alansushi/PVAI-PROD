import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const memberships = await prisma.orgMember.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
  })

  if (!memberships.length) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 })
  }

  const projectsList = await Promise.all(
    memberships.map(m => {
      if (m.role === 'guest') {
        return prisma.project.findMany({
          where: {
            organizationId: m.organizationId,
            members: { some: { userId: session.user.id } },
          },
          include: {
            members: true,
            deliverables: { orderBy: { position: 'asc' } },
            ganttRows: { orderBy: { order: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        })
      }
      return prisma.project.findMany({
        where: { organizationId: m.organizationId },
        include: {
          members: true,
          deliverables: { orderBy: { position: 'asc' } },
          ganttRows: { orderBy: { order: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      })
    })
  )

  // Flatten and deduplicate by project id
  const allProjects = projectsList.flat()
  const projects = Array.from(new Map(allProjects.map(p => [p.id, p])).values())

  // For display: prefer non-guest org name; fall back to first membership
  const primaryMembership = memberships.find(m => m.role !== 'guest') ?? memberships[0]

  return NextResponse.json({ projects, orgName: primaryMembership.organization.name })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allMemberships = await prisma.orgMember.findMany({
    where: { userId: session.user.id },
  })
  // Prefer owner/member org; guests cannot create projects in orgs where they are guests
  const membership = allMemberships.find(m => m.role !== 'guest') ?? null

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 })
  }

  const body = await req.json()
  const { title, type, status, startDate, endDate, nextPaymentAmount, nextPaymentStatus, budget, billedAmount } = body

  if (!title || !type) {
    return NextResponse.json({ error: 'title and type are required' }, { status: 400 })
  }

  const project = await prisma.project.create({
    data: {
      organizationId: membership.organizationId,
      title,
      type,
      status: status ?? 'ok',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      nextPaymentAmount,
      nextPaymentStatus,
      budget: budget != null ? Number(budget) : undefined,
      billedAmount: billedAmount != null ? Number(billedAmount) : undefined,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    action: 'create',
    entity: 'project',
    entityId: project.id,
    entityName: project.title,
    projectId: project.id,
    newValue: { title, type, status },
  })

  // Auto-add creator as project member
  const creator = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  })
  const creatorName = creator?.name ?? 'Usuario'
  const parts = creatorName.trim().split(/\s+/)
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : creatorName.slice(0, 2).toUpperCase()

  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: session.user.id,
      name: creatorName,
      initials,
      color: '#2E8FC0',
      role: 'Colaborador',
      isExternal: false,
    },
  })

  return NextResponse.json(project, { status: 201 })
}
