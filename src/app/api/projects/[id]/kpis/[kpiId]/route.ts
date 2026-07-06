import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireProjectAccess } from '@/lib/project-access'
import { kpiUpdateSchema } from '@/lib/schemas'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; kpiId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, kpiId } = await params
    const project = await requireProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const existing = await prisma.projectKPI.findFirst({ where: { id: kpiId, projectId: id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const parsed = kpiUpdateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
    }
    const { title, target, current, unit } = parsed.data

    const kpi = await prisma.projectKPI.update({
      where: { id: kpiId },
      data: {
        ...(title !== undefined && { title }),
        ...(target !== undefined && { target }),
        ...(current !== undefined && { current }),
        ...(unit !== undefined && { unit }),
      },
    })
    return NextResponse.json(kpi)
  } catch (err) {
    console.error('[kpis PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; kpiId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, kpiId } = await params
    const project = await requireProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const existing = await prisma.projectKPI.findFirst({ where: { id: kpiId, projectId: id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.projectKPI.delete({ where: { id: kpiId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[kpis DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
