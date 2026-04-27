import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { sendInvitationEmail } from '@/lib/email'

async function verifyProjectAccess(projectId: string, userId: string) {
  const memberships = await prisma.orgMember.findMany({ where: { userId } })
  if (!memberships.length) return null
  const orgIds = memberships.map(m => m.organizationId)
  const guestOrgIds = memberships.filter(m => m.role === 'guest').map(m => m.organizationId)
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: { in: orgIds } },
    include: { organization: true },
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

  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  })

  return NextResponse.json(members)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await verifyProjectAccess(id, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, initials, color, role, isExternal, userId, notifyEmail } = body

  if (!name || !initials || !color || !role) {
    return NextResponse.json({ error: 'name, initials, color, role are required' }, { status: 400 })
  }

  // If inviting a registered user (userId provided), validate and create guest OrgMember if needed
  if (userId) {
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const existingMembership = await prisma.orgMember.findFirst({
      where: { userId, organizationId: project.organizationId },
    })
    if (!existingMembership) {
      await prisma.orgMember.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          organizationId: project.organizationId,
          role: 'guest',
        },
      })
    }

    const existingPM = await prisma.projectMember.findFirst({
      where: { projectId: id, userId },
    })
    if (existingPM) return NextResponse.json({ error: 'Already a member' }, { status: 409 })
  }

  const member = await prisma.projectMember.create({
    data: {
      projectId: id,
      name,
      initials,
      color,
      role,
      isExternal: isExternal ?? false,
      userId: userId ?? undefined,
    },
  })

  await createAuditLog({
    userId: session.user.id,
    action: 'create',
    entity: 'member',
    entityId: member.id,
    entityName: name,
    projectId: id,
    newValue: { name, role, isExternal },
  })

  // If no userId was provided (external member), create a tokenized invitation
  if (!userId && notifyEmail) {
    const [inviter, projectWithOrg] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id } }),
      prisma.project.findUnique({ where: { id }, include: { organization: true } }),
    ])

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.invitation.create({
      data: {
        email:           notifyEmail.toLowerCase(),
        organizationId:  project.organizationId,
        projectId:       id,
        projectMemberId: member.id,
        orgRole:         'member',
        projectRole:     role,
        expiresAt,
        invitedById:     session.user.id,
      },
    })

    sendInvitationEmail(notifyEmail, {
      inviteeName:  name,
      orgName:      (projectWithOrg as { organization?: { name?: string } } | null)?.organization?.name ?? 'el despacho',
      projectTitle: projectWithOrg?.title,
      inviterName:  inviter?.name ?? 'Un colega',
      token:        invitation.token,
    }).catch(() => {})
  }

  return NextResponse.json(member, { status: 201 })
}
