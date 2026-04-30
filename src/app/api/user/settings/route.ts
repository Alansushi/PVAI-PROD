import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const VALID_AGENT_MODES = ['solo_cuando_lo_pida', 'equilibrado', 'proactivo']

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { agentMode: true },
  })

  const agentMode = user?.agentMode ?? 'equilibrado'

  return NextResponse.json({ agentMode })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { agentMode } = body

  if (!agentMode || !VALID_AGENT_MODES.includes(agentMode)) {
    return NextResponse.json(
      { error: `Invalid agentMode. Must be one of: ${VALID_AGENT_MODES.join(', ')}` },
      { status: 400 }
    )
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { agentMode },
  })

  return NextResponse.json({ ok: true })
}
