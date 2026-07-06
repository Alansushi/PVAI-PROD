import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireProjectAccess } from '@/lib/project-access'
import { kpiCreateSchema } from '@/lib/schemas'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const project = await requireProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const kpis = await prisma.projectKPI.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(kpis)
  } catch (err) {
    console.error('[kpis GET]', err)
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

    const parsed = kpiCreateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
    }
    const { title, target, current, unit } = parsed.data

    const kpi = await prisma.projectKPI.create({
      data: {
        projectId: id,
        title,
        target,
        current: current ?? 0,
        unit: unit ?? '',
      },
    })
    return NextResponse.json(kpi, { status: 201 })
  } catch (err) {
    console.error('[kpis POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
