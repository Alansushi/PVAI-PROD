import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = new URL(req.url).searchParams.get('email')
  if (!email) return NextResponse.json(null)

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, image: true },
  })

  return NextResponse.json(user ?? null)
}
