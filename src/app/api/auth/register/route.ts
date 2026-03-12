import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, profession, profDetail, firmName, firmUrl, phone } = body

    // Validate required fields
    if (!name || !email || !password || !profession || !firmName) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Check unique email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user (cast needed until prisma generate runs with DATABASE_URL)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (prisma.user.create as any)({
      data: {
        name,
        email,
        password: hashedPassword,
        profession,
        profDetail: profDetail || null,
        firmName,
        firmUrl: firmUrl || null,
        phone: phone || null,
      },
    })

    // Create org from firmName
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

    // Create OrgMember as admin
    await prisma.orgMember.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: 'admin',
      },
    })

    // Fire-and-forget welcome email
    sendWelcomeEmail({ name: user.name, email: user.email }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
