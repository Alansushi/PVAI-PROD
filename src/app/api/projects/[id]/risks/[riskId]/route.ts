import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireProjectAccess } from '@/lib/project-access'
import { riskUpdateSchema } from '@/lib/schemas'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; riskId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, riskId } = await params
    const project = await requireProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const existing = await prisma.projectRisk.findFirst({ where: { id: riskId, projectId: id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const parsed = riskUpdateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
    }
    const { title, description, probability, impact, status, mitigation, ownerName } = parsed.data

    const risk = await prisma.projectRisk.update({
      where: { id: riskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(probability !== undefined && { probability }),
        ...(impact !== undefined && { impact }),
        ...(status !== undefined && { status }),
        ...(mitigation !== undefined && { mitigation: mitigation?.trim() || null }),
        ...(ownerName !== undefined && { ownerName: ownerName?.trim() || null }),
      },
    })
    return NextResponse.json(risk)
  } catch (err) {
    console.error('[risks PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; riskId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, riskId } = await params
    const project = await requireProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const existing = await prisma.projectRisk.findFirst({ where: { id: riskId, projectId: id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.projectRisk.delete({ where: { id: riskId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[risks DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
