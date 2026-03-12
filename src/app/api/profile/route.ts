import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const ALLOWED_FIELDS = ['name', 'profession', 'profDetail', 'firmName', 'firmUrl', 'phone']

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

  // Only allow safe fields — never email or id
  const data: Record<string, string | null> = {}
  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      data[field] = body[field] ?? null
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

  return NextResponse.json(updated)
}
