import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'
import { registerSchema } from '@/lib/schemas'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profDetail, firmUrl, phone, invitationToken } = body

    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }
    const { name, email, password, profession, firmName } = parsed.data
    const normalizedEmail = email.toLowerCase()

    // Check unique email (case-insensitive)
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (prisma.user.create as any)({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        profession,
        profDetail: profDetail || null,
        firmName,
        firmUrl: firmUrl || null,
        phone: phone || null,
      },
    })

    // Always create the user's own org
    const slug =
      firmName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') +
      '-' +
      Date.now()

    const org = await prisma.organization.create({
      data: { name: firmName, slug },
    })

    await prisma.orgMember.create({
      data: { userId: user.id, organizationId: org.id, role: 'admin' },
    })

    // Auto-accept a pending invitation if a token was provided
    if (invitationToken) {
      const invitation = await prisma.invitation.findUnique({
        where: { token: invitationToken },
        include: { projectMember: true },
      })

      if (
        invitation &&
        !invitation.acceptedAt &&
        invitation.expiresAt > new Date() &&
        invitation.email.toLowerCase() === normalizedEmail
      ) {
        // Join the invited org
        const alreadyInOrg = await prisma.orgMember.findFirst({
          where: { userId: user.id, organizationId: invitation.organizationId },
        })
        if (!alreadyInOrg) {
          await prisma.orgMember.create({
            data: { userId: user.id, organizationId: invitation.organizationId, role: invitation.orgRole },
          })
        }

        // Link the external ProjectMember to the new account
        if (invitation.projectMemberId && invitation.projectMember) {
          const alreadyInProject = await prisma.projectMember.findFirst({
            where: { projectId: invitation.projectMember.projectId, userId: user.id },
          })
          if (!alreadyInProject) {
            await prisma.projectMember.update({
              where: { id: invitation.projectMemberId },
              data: { userId: user.id, isExternal: false, name: user.name ?? invitation.projectMember.name },
            })
          }
        }

        await prisma.invitation.update({
          where: { token: invitationToken },
          data: { acceptedAt: new Date() },
        })
      }
    }

    sendWelcomeEmail({ name: user.name, email: user.email }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
