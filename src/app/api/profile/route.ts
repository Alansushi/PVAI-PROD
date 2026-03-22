import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  profession: z.string().max(255).optional(),
  profDetail: z.string().max(500).optional().nullable(),
  firmName: z.string().max(255).optional(),
  firmUrl: z.string().url('URL inválida').max(500).optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      profession: true,
      profDetail: true,
      firmName: true,
      firmUrl: true,
      phone: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const parsed = profileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  // Only allow validated fields — never email or id
  const data: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      data[key] = value ?? null
    }
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      profession: true,
      profDetail: true,
      firmName: true,
      firmUrl: true,
      phone: true,
    },
  })

  createAuditLog({
    userId: session.user.id,
    action: 'update',
    entity: 'user',
    entityId: session.user.id,
    entityName: session.user.name ?? session.user.id,
    newValue: data,
  }).catch(() => {})

  return NextResponse.json(updated)
}
