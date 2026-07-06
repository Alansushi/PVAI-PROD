import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, memberId } = await params

  const project = await verifyProjectAccess(id, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const member = await prisma.projectMember.findFirst({
    where: { id: memberId, projectId: id },
    include: { invitation: true },
  })
  if (!member) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
  if (member.userId) {
    return NextResponse.json({ error: 'Este miembro ya tiene cuenta vinculada' }, { status: 409 })
  }
  if (!member.invitation) {
    return NextResponse.json(
      { error: 'Este miembro no tiene invitación por email' },
      { status: 404 }
    )
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const invitation = await prisma.invitation.update({
    where: { id: member.invitation.id },
    data: { token: randomUUID(), expiresAt },
  })

  const inviter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  })

  try {
    await sendInvitationEmail(invitation.email, {
      inviteeName:  member.name,
      orgName:      project.organization?.name ?? 'el despacho',
      projectTitle: project.title,
      inviterName:  inviter?.name ?? 'Un colega',
      token:        invitation.token,
    })
  } catch {
    return NextResponse.json(
      { error: 'La invitación se regeneró pero el email no pudo enviarse' },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true, expiresAt: invitation.expiresAt })
}
