import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { DBProcessedMinutaListItem } from '@/lib/db-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const memberships = await prisma.orgMember.findMany({ where: { userId: session.user.id } })
  if (!memberships.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const orgIds = memberships.map(m => m.organizationId)
  const guestOrgIds = memberships.filter(m => m.role === 'guest').map(m => m.organizationId)
  const project = await prisma.project.findFirst({
    where: { id, organizationId: { in: orgIds } },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (guestOrgIds.includes(project.organizationId)) {
    const isMember = await prisma.projectMember.findFirst({ where: { projectId: id, userId: session.user.id } })
    if (!isMember) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const minutas = await db.processedMinuta.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { user: { select: { name: true } } },
  })

  const items: DBProcessedMinutaListItem[] = minutas.map((m: {
    id: string
    title: string
    createdAt: Date
    actionsJson: string
    user: { name: string | null } | null
  }) => ({
    id: m.id,
    title: m.title,
    createdAt: m.createdAt.toISOString(),
    userName: m.user?.name ?? null,
    actionsCount: (() => {
      try { return JSON.parse(m.actionsJson).length } catch { return 0 }
    })(),
  }))

  return NextResponse.json(items)
  } catch (err) {
    console.error('[minutas GET] Error:', err)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const membershipsPost = await prisma.orgMember.findMany({ where: { userId: session.user.id } })
  if (!membershipsPost.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const orgIdsPost = membershipsPost.map(m => m.organizationId)
  const guestOrgIdsPost = membershipsPost.filter(m => m.role === 'guest').map(m => m.organizationId)
  const project = await prisma.project.findFirst({
    where: { id, organizationId: { in: orgIdsPost } },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (guestOrgIdsPost.includes(project.organizationId)) {
    const isMember = await prisma.projectMember.findFirst({ where: { projectId: id, userId: session.user.id } })
    if (!isMember) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { title, inputText, summary, actionsJson } = await req.json()

  const MAX_TEXT = 50_000 // ~50KB por campo
  if (
    (typeof title === 'string' && title.length > 255) ||
    (typeof inputText === 'string' && inputText.length > MAX_TEXT) ||
    (typeof summary === 'string' && summary.length > MAX_TEXT) ||
    (typeof actionsJson === 'string' && actionsJson.length > MAX_TEXT)
  ) {
    return NextResponse.json({ error: 'Contenido demasiado largo' }, { status: 400 })
  }

  const minuta = await db.processedMinuta.create({
    data: {
      projectId: id,
      userId: session.user.id,
      title: typeof title === 'string' && title.trim() ? title.trim() : 'Minuta sin título',
      inputText: typeof inputText === 'string' ? inputText : '',
      summary: typeof summary === 'string' ? summary : '',
      actionsJson: typeof actionsJson === 'string' ? actionsJson : '[]',
    },
  })

  return NextResponse.json(minuta, { status: 201 })
  } catch (err) {
    console.error('[minutas POST] Error:', err)
    return NextResponse.json({ error: 'Error al guardar minuta' }, { status: 500 })
  }
}
