import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ token: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: { select: { name: true } },
      invitedBy:    { select: { name: true } },
    },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
  }
  if (invitation.acceptedAt) {
    return NextResponse.json({ error: 'Invitación ya aceptada' }, { status: 410 })
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invitación expirada' }, { status: 410 })
  }

  return NextResponse.json({
    orgName:     invitation.organization.name,
    projectId:   invitation.projectId,
    projectRole: invitation.projectRole,
    inviterName: invitation.invitedBy.name,
    expiresAt:   invitation.expiresAt,
    // email is intentionally omitted from the public GET — only verified after POST accept
  })
}

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión para aceptar la invitación' }, { status: 401 })
  }

  const { token } = await params

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { projectMember: true },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
  }
  if (invitation.acceptedAt) {
    return NextResponse.json({ error: 'Invitación ya aceptada' }, { status: 410 })
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invitación expirada' }, { status: 410 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  })

  if (user?.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'Esta invitación fue enviada a otro email' },
      { status: 403 }
    )
  }

  // Upsert OrgMember — may already exist if user was added before
  const existingMembership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id, organizationId: invitation.organizationId },
  })
  if (!existingMembership) {
    await prisma.orgMember.create({
      data: {
        userId:         session.user.id,
        organizationId: invitation.organizationId,
        role:           invitation.orgRole,
      },
    })
  }

  // Link the external ProjectMember to the real user account
  if (invitation.projectMemberId && invitation.projectMember) {
    const alreadyLinked = await prisma.projectMember.findFirst({
      where: { projectId: invitation.projectMember.projectId, userId: session.user.id },
    })
    if (!alreadyLinked) {
      await prisma.projectMember.update({
        where: { id: invitation.projectMemberId },
        data: {
          userId:     session.user.id,
          isExternal: false,
          name:       user?.name ?? invitation.projectMember.name,
        },
      })
    }
  }

  // Mark invitation as accepted
  await prisma.invitation.update({
    where: { token },
    data: { acceptedAt: new Date() },
  })

  return NextResponse.json({
    ok:        true,
    projectId: invitation.projectId,
    orgId:     invitation.organizationId,
  })
}
