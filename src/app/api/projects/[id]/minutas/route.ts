import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { DBProcessedMinutaListItem } from '@/lib/db-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberships = await prisma.orgMember.findMany({ where: { userId: session.user.id } })
  if (!memberships.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const orgIds = memberships.map(m => m.organizationId)
  const guestOrgIds = memberships.filter(m => m.role === 'guest').map(m => m.organizationId)
  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: { in: orgIds } },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (guestOrgIds.includes(project.organizationId)) {
    const isMember = await prisma.projectMember.findFirst({ where: { projectId: params.id, userId: session.user.id } })
    if (!isMember) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const minutas = await db.processedMinuta.findMany({
    where: { projectId: params.id },
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
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const membershipsPost = await prisma.orgMember.findMany({ where: { userId: session.user.id } })
  if (!membershipsPost.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const orgIdsPost = membershipsPost.map(m => m.organizationId)
  const guestOrgIdsPost = membershipsPost.filter(m => m.role === 'guest').map(m => m.organizationId)
  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: { in: orgIdsPost } },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (guestOrgIdsPost.includes(project.organizationId)) {
    const isMember = await prisma.projectMember.findFirst({ where: { projectId: params.id, userId: session.user.id } })
    if (!isMember) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { title, inputText, summary, actionsJson } = await req.json()

  const minuta = await db.processedMinuta.create({
    data: {
      projectId: params.id,
      userId: session.user.id,
      title: title ?? 'Minuta sin título',
      inputText: inputText ?? '',
      summary: summary ?? '',
      actionsJson: actionsJson ?? '[]',
    },
  })

  return NextResponse.json(minuta, { status: 201 })
}
