import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Eres el Agente IA de Proyecto Vivo. Ayudas a directores de arquitectura y diseño a gestionar sus proyectos de forma eficiente.

Reglas:
- Responde siempre en español
- Sé conciso y directo — máximo 3-4 párrafos
- Usa HTML inline con estas clases para resaltar información:
  - <span class="ok">texto</span> para cosas buenas (verde)
  - <span class="warn">texto</span> para advertencias (amber)
  - <span class="danger">texto</span> para riesgos críticos (rojo)
  - <span class="nl">texto</span> para datos numéricos o nombres clave (azul)
- Usa <strong> para encabezados o puntos clave
- Usa <br> para separar párrafos
- Basa tu análisis en los datos reales del proyecto que se te proporcionan`

function buildProjectContext(project: {
  title: string
  type: string
  status: string
  nextPaymentAmount?: string | null
  nextPaymentStatus?: string | null
  deliverables: Array<{
    name: string
    status: string
    priority: string
    ownerName?: string | null
    dueDate?: Date | null
  }>
  members: Array<{
    name: string
    role: string
  }>
}): string {
  const today = new Date()
  const statusLabel = project.status === 'ok' ? 'Al corriente' : project.status === 'warn' ? 'En riesgo' : 'Cobro vencido'

  const deliverableLines = project.deliverables.map(d => {
    const due = d.dueDate
      ? d.dueDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'sin fecha'
    const statusLabel = d.status === 'ok' ? 'Completado' : d.status === 'warn' ? 'En proceso' : 'En riesgo'
    return `- ${d.name} | ${statusLabel} | Prioridad: ${d.priority} | Responsable: ${d.ownerName ?? 'Sin asignar'} | Vence: ${due}`
  }).join('\n')

  const memberLines = project.members.map(m => `- ${m.name} (${m.role})`).join('\n')

  const done  = project.deliverables.filter(d => d.status === 'ok').length
  const total = project.deliverables.length
  const atRisk = project.deliverables.filter(d => d.status === 'danger').length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  return `PROYECTO: ${project.title}
Tipo: ${project.type}
Estado general: ${statusLabel}
Avance: ${pct}% (${done}/${total} entregables completados)
En riesgo: ${atRisk} entregables
Próximo cobro: ${project.nextPaymentAmount ?? 'No especificado'} — ${project.nextPaymentStatus ?? ''}
Fecha actual: ${today.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}

ENTREGABLES (${total} total):
${deliverableLines || '(sin entregables)'}

EQUIPO (${project.members.length} miembros):
${memberLines || '(sin miembros asignados)'}`
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { projectId, message, type } = body as {
    projectId: string
    message: string
    type?: string
  }

  if (!projectId || !message) {
    return NextResponse.json({ error: 'projectId and message are required' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ html: '<strong>⚠ Agente no configurado:</strong> Añade <span class="warn">ANTHROPIC_API_KEY</span> a tu archivo .env.local para activar el agente IA.' })
  }

  // Verify user has access (get all memberships for multi-org support)
  const memberships = await prisma.orgMember.findMany({
    where: { userId: session.user.id },
  })
  if (!memberships.length) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 })
  }

  // Rate limit: 5 messages per minute per user (across all their projects)
  const oneMinuteAgo = new Date(Date.now() - 60_000)
  const orgIds = memberships.map(m => m.organizationId)
  const userProjectIds = await prisma.project.findMany({
    where: { organizationId: { in: orgIds } },
    select: { id: true },
  }).then(ps => ps.map(p => p.id))

  const recentCount = await prisma.agentMessage.count({
    where: {
      projectId: { in: userProjectIds },
      role: 'user',
      createdAt: { gte: oneMinuteAgo },
    },
  })
  if (recentCount >= 5) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
  }

  // Verify access to the specific project (guests only see assigned projects)
  const guestOrgIds = memberships.filter(m => m.role === 'guest').map(m => m.organizationId)
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId: { in: orgIds },
    },
    select: {
      title: true,
      type: true,
      status: true,
      organizationId: true,
      nextPaymentAmount: true,
      nextPaymentStatus: true,
      deliverables: {
        select: { id: true, name: true, status: true, priority: true, ownerName: true, dueDate: true },
        orderBy: { position: 'asc' },
      },
      members: {
        select: { name: true, role: true },
      },
    },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // For guest users, verify they are a ProjectMember of this specific project
  if (guestOrgIds.includes(project.organizationId)) {
    const isMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: session.user.id },
    })
    if (!isMember) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const isMinuta = type === 'minuta'
  const model = isMinuta ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001'

  if (isMinuta) {
    const deliverableLines = project.deliverables.map(d => {
      const statusLabel = d.status === 'ok' ? 'ok' : d.status === 'warn' ? 'warn' : 'danger'
      return `${(d as { id: string } & typeof d).id} | ${d.name} | ${statusLabel} | ${d.priority} | ${d.ownerName ?? 'sin asignar'}`
    }).join('\n')

    const memberLines = project.members.map((m: { name: string; role: string }) => m.name).join(', ')

    const minutaSystemPrompt = `Eres un asistente de gestión de proyectos. Analiza la minuta y genera un plan de acciones sobre entregables. Responde únicamente con JSON válido.`

    const minutaUserPrompt = `ENTREGABLES EXISTENTES (id | nombre | status | prioridad | responsable):
${deliverableLines || '(sin entregables)'}

MIEMBROS DEL EQUIPO: ${memberLines || '(sin miembros)'}

MINUTA:
${message}

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "summary": "Una oración resumiendo los acuerdos clave.",
  "actions": [
    {"type":"update","id":"abc","name":"Nombre entregable","changes":{"status":"ok","dueDate":"2026-04-15"},"reason":"La minuta indica que fue aprobado"},
    {"type":"note","id":"xyz","name":"Nombre entregable","note":"Cliente pidió revisar el material antes del viernes"},
    {"type":"create","name":"Gestionar permiso municipal","status":"warn","priority":"alta","ownerName":"Juan García","dueDate":"2026-04-20","startDate":"2026-04-10"}
  ]
}

Reglas estrictas:
- Prefiere "update" sobre "create" si hay un entregable con nombre similar (matching flexible)
- Usa "note" cuando la minuta menciona anotar, registrar o recordar algo internamente
- Usa "create" solo para temas sin equivalente existente
- Si un entregable cambia de estado o fecha, usa "update"
- No inventes entregables que no estén en la minuta
- Para status usa ÚNICAMENTE: "ok" (completado), "warn" (en proceso), "danger" (en riesgo)
- Para priority usa ÚNICAMENTE: "alta", "media", "baja"
- Para ownerName usa exactamente el nombre del miembro del equipo si la minuta lo menciona; omite el campo si no hay responsable claro
- Para dueDate y startDate usa formato ISO YYYY-MM-DD si la minuta menciona fechas; omite si no hay fecha
- Responde solo JSON, sin explicaciones`

    try {
      const response = await client.messages.create({
        model,
        max_tokens: 800,
        system: minutaSystemPrompt,
        messages: [{ role: 'user', content: minutaUserPrompt }],
      })

      const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
      try {
        // Extract first JSON object — handles markdown code fences and leading text
        const match = rawText.match(/\{[\s\S]*\}/)
        if (!match) throw new Error('No JSON found')
        const plan = JSON.parse(match[0])
        return NextResponse.json({ plan })
      } catch {
        return NextResponse.json({ plan: { summary: 'No se pudo interpretar la minuta.', actions: [] } })
      }
    } catch (err) {
      console.error('Agent minuta error:', err)
      return NextResponse.json({ plan: { summary: 'Error al procesar la minuta.', actions: [] } })
    }
  }

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${buildProjectContext(project)}\n\nPregunta/instrucción: ${message}`,
        },
      ],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ html: rawText })
  } catch (err) {
    console.error('Agent API error:', err)
    return NextResponse.json({
      html: '<strong class="danger">✦ Error del agente:</strong> No se pudo conectar con el servidor de IA. Verifica tu API key.',
    })
  }
}
