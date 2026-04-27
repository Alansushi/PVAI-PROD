import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendInvitationEmail } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

// GET — list pending invitations for this org (admins only)
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: orgId } = await params

  const membership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id, organizationId: orgId },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (membership.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const invitations = await prisma.invitation.findMany({
    where: { organizationId: orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
    include: { invitedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(invitations)
}

// POST — invite someone to the org directly
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: orgId } = await params

  const membership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id, organizationId: orgId },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (membership.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, orgRole } = await req.json()
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const VALID_ORG_ROLES = ['admin', 'member', 'guest'] as const
  type OrgRole = typeof VALID_ORG_ROLES[number]
  const safeOrgRole: OrgRole = VALID_ORG_ROLES.includes(orgRole) ? orgRole : 'member'

  const normalizedEmail = email.toLowerCase()

  // If the user already exists in the org, no need to invite
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existingUser) {
    const alreadyMember = await prisma.orgMember.findFirst({
      where: { userId: existingUser.id, organizationId: orgId },
    })
    if (alreadyMember) {
      return NextResponse.json({ error: 'Este usuario ya pertenece a la organización' }, { status: 409 })
    }
  }

  // Check for existing pending invitation
  const existingInv = await prisma.invitation.findFirst({
    where: { email: normalizedEmail, organizationId: orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
  })
  if (existingInv) {
    return NextResponse.json({ error: 'Ya hay una invitación pendiente para este email' }, { status: 409 })
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const [invitation, org, inviter] = await Promise.all([
    prisma.invitation.create({
      data: { email: normalizedEmail, organizationId: orgId, orgRole: safeOrgRole, expiresAt, invitedById: session.user.id },
    }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
  ])

  sendInvitationEmail(normalizedEmail, {
    inviteeName:  '',
    orgName:      org?.name ?? 'el despacho',
    inviterName:  inviter?.name ?? 'Un colega',
    token:        invitation.token,
  }).catch(() => {})

  return NextResponse.json({ ok: true, invitationId: invitation.id }, { status: 201 })
}
