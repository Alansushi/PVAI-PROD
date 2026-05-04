import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Rate limit: 10 per hour per user (same DB pattern as /api/agent)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentCount = await db.sharedSummary.count({
    where: { userId, createdAt: { gte: oneHourAgo } },
  }).catch(() => 0)

  if (recentCount >= 10) {
    return NextResponse.json(
      { error: 'Límite de resúmenes alcanzado. Espera un momento.' },
      { status: 429 }
    )
  }

  let scope: 'portfolio' | 'project'
  let projectId: string | undefined

  try {
    const body = await req.json()
    if (body.scope !== 'portfolio' && body.scope !== 'project') {
      return NextResponse.json({ error: 'scope must be portfolio or project' }, { status: 400 })
    }
    scope = body.scope
    projectId = typeof body.projectId === 'string' ? body.projectId : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (scope === 'project' && !projectId) {
    return NextResponse.json({ error: 'projectId required for project scope' }, { status: 400 })
  }

  const directorName = session.user.name?.split(' ')[0] ?? 'El equipo'

  let contextText: string

  if (scope === 'project' && projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        deliverables: { select: { name: true, status: true, dueDate: true } },
        packages: {
          include: {
            milestones: { orderBy: { date: 'asc' }, take: 2 },
          },
        },
      },
    }).catch(() => null)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const total = project.deliverables.length
    const done = project.deliverables.filter(d => d.status === 'ok').length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    const now = new Date()
    const overdue = project.deliverables.filter(
      d => d.status !== 'ok' && d.dueDate && new Date(d.dueDate) < now
    ).length

    const nextMilestones = project.packages
      .flatMap(p => p.milestones)
      .filter(m => new Date(m.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 2)
      .map(m => `${m.label ?? m.type} (${new Date(m.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })})`)

    contextText = `Proyecto: ${project.title}
Estado: ${project.status === 'ok' ? 'Al corriente' : project.status === 'warn' ? 'En riesgo' : 'Cobro vencido'}
Avance: ${pct}% (${done}/${total} tareas completadas)
Entregables vencidos: ${overdue}
Próximos hitos: ${nextMilestones.length > 0 ? nextMilestones.join(', ') : 'Sin hitos próximos definidos'}`
  } else {
    // Portfolio scope
    const memberships = await prisma.orgMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            projects: {
              select: {
                title: true,
                status: true,
                deliverables: { select: { status: true, dueDate: true } },
              },
            },
          },
        },
      },
    })

    const seenTitles = new Set<string>()
    const projects = memberships
      .flatMap(m => m.organization.projects)
      .filter(p => !seenTitles.has(p.title) && seenTitles.add(p.title))

    const now = new Date()
    const total = projects.length
    const atRisk = projects.filter(p => p.status === 'warn' || p.status === 'danger').length
    const allDels = projects.flatMap(p => p.deliverables)
    const done = allDels.filter(d => d.status === 'ok').length
    const pct = allDels.length > 0 ? Math.round((done / allDels.length) * 100) : 100
    const overdue = allDels.filter(d => d.status !== 'ok' && d.dueDate && new Date(d.dueDate) < now).length

    contextText = `Portafolio de proyectos
Total de proyectos activos: ${total}
Proyectos en riesgo: ${atRisk}
Cumplimiento general de entregables: ${pct}%
Entregables vencidos: ${overdue}`
  }

  const systemPrompt = `Eres el asistente de comunicación de un director de arquitectura y diseño.
Genera un resumen de estado para compartir con clientes o equipo.
Tono: profesional pero cálido, primera persona del director (habla como "${directorName}").
Longitud: 4-6 frases.
Estructura: saludo → estado actual → 1-2 hitos o datos clave → cierre con CTA o pregunta de seguimiento.
Devuelve SOLO el texto plano, sin HTML ni markdown, sin comillas al inicio/final.`

  let content: string

  if (!process.env.ANTHROPIC_API_KEY) {
    content = `Hola, quería actualizarte sobre el estado de ${scope === 'project' ? 'nuestro proyecto' : 'nuestros proyectos'}. ${contextText}. Quedo atento a cualquier comentario o pregunta.`
  } else {
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Datos para el resumen:\n${contextText}` }],
      })

      content =
        response.content[0].type === 'text'
          ? response.content[0].text.trim()
          : `Hola, te comparto el estado actualizado de ${scope === 'project' ? 'nuestro proyecto' : 'nuestros proyectos'}. ${contextText}`
    } catch {
      content = `Hola, te comparto el estado actualizado de ${scope === 'project' ? 'nuestro proyecto' : 'nuestros proyectos'}. ${contextText}`
    }
  }

  const record = await db.sharedSummary.create({
    data: { userId, scope, projectId: projectId ?? null, content },
  })

  return NextResponse.json({ content: record.content, id: record.id })
}
