import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireProjectAccess } from '@/lib/project-access'
import { riskCreateSchema } from '@/lib/schemas'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const project = await requireProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const risks = await prisma.projectRisk.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(risks)
  } catch (err) {
    console.error('[risks GET]', err)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const project = await requireProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const parsed = riskCreateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
    }
    const { title, description, probability, impact, status, mitigation, ownerName } = parsed.data

    const risk = await prisma.projectRisk.create({
      data: {
        projectId: id,
        title,
        description: description?.trim() || null,
        probability: probability ?? 'medium',
        impact: impact ?? 'medium',
        status: status ?? 'open',
        mitigation: mitigation?.trim() || null,
        ownerName: ownerName?.trim() || null,
      },
    })
    return NextResponse.json(risk, { status: 201 })
  } catch (err) {
    console.error('[risks POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
