import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { AgentCardType } from '@/lib/types'
import { VIEW_FOCUS, ALLOWED_VIEWS, type AgentViewKey } from '@/lib/agent-prompts'

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
- Basa tu análisis en los datos reales del proyecto que se te proporcionan
- Puedes indicar el tipo de respuesta anteponiendo <CARD:alerta>, <CARD:recomendacion>, <CARD:insight> o <CARD:pregunta> al inicio de tu respuesta. Úsalo solo si el tipo difiere del contexto de la pregunta (ej: usa <CARD:alerta> si detectas un riesgo crítico aunque la pregunta sea de avance).
- Opcionalmente, al final de respuestas de análisis estructurado, añade una línea <REASONING>texto plano breve (máx. 80 palabras) explicando qué datos concretos del proyecto justifican este análisis</REASONING>. Omite en respuestas de chat libre o si no aporta valor.`

function escapeForPrompt(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\n/g, ' ')
    .replace(/\|/g, '·')
    .replace(/`/g, "'")
    .slice(0, 120)
}

function stripHtml(str: unknown): string {
  if (typeof str !== 'string') return ''
  return str.replace(/<[^>]*>/g, '').slice(0, 500)
}

function validateMinutaPlan(plan: unknown): { summary: string; actions: unknown[] } {
  if (!plan || typeof plan !== 'object') throw new Error('plan is not an object')
  const p = plan as Record<string, unknown>
  if (typeof p.summary !== 'string') throw new Error('missing summary')
  if (!Array.isArray(p.actions)) throw new Error('actions is not array')
  return {
    summary: stripHtml(p.summary),
    actions: (p.actions as unknown[])
      .filter((a): a is Record<string, unknown> =>
        !!a && typeof a === 'object' && ['update', 'note', 'create', 'reassign'].includes((a as Record<string, unknown>).type as string)
      )
      .map((a) => {
        const action = a as Record<string, unknown>
        return {
          ...action,
          name: stripHtml(action.name),
          note: stripHtml(action.note),
        }
      })
      .slice(0, 15),
  }
}

const CHIP_CARD_TYPE: Record<string, AgentCardType> = {
  riesgos: 'alerta',
  bloqueados: 'alerta',
  sugerir_riesgos: 'alerta',
  equipo: 'recomendacion',
  balancear_carga: 'recomendacion',
  sin_asignar: 'recomendacion',
  avance: 'insight',
  tiempo: 'insight',
  velocidad: 'insight',
  prediccion: 'insight',
  resumen_ejecutivo: 'insight',
  siguiente_entrega: 'insight',
  estado_paquetes: 'insight',
}

function resolveCardType(chipType: string | undefined, rawText: string): AgentCardType {
  // Claude can override type by prefixing response with <CARD:tipo>
  const override = rawText.match(/^<CARD:(alerta|recomendacion|insight|pregunta)>/)
  if (override) return override[1] as AgentCardType
  if (!chipType || chipType === 'free') return 'pregunta'
  return CHIP_CARD_TYPE[chipType] ?? 'insight'
}

function stripCardPrefix(text: string): string {
  return text.replace(/^<CARD:(alerta|recomendacion|insight|pregunta)>/, '')
}

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
    return `- ${escapeForPrompt(d.name)} | ${statusLabel} | Prioridad: ${d.priority} | Responsable: ${d.ownerName ? escapeForPrompt(d.ownerName) : 'Sin asignar'} | Vence: ${due}`
  }).join('\n')

  const memberLines = project.members.map(m => `- ${escapeForPrompt(m.name)} (${m.role})`).join('\n')

  const done  = project.deliverables.filter(d => d.status === 'ok').length
  const total = project.deliverables.length
  const atRisk = project.deliverables.filter(d => d.status === 'danger').length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  return `PROYECTO: ${escapeForPrompt(project.title)}
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

async function buildPortfolioContext(userId: string): Promise<string> {
  type Row = { title: string; status: string; deliverables: { dueDate: Date | null }[]; _count: { deliverables: number } }
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } } },
    include: {
      deliverables: { where: { status: { not: 'completado' } }, take: 5, orderBy: { dueDate: 'asc' } },
      _count: { select: { deliverables: true } },
    },
    take: 10,
    orderBy: { updatedAt: 'desc' },
  }) as unknown as Row[]

  const lines = projects.map((p) => {
    const overdue = p.deliverables.filter(d => d.dueDate && new Date(d.dueDate) < new Date()).length
    return `- ${p.title} | estado: ${p.status} | vencidos: ${overdue}/${p._count.deliverables}`
  })
  return `Portafolio (${projects.length} proyectos):\n${lines.join('\n')}`
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { projectId, message, type, view: rawView } = body as {
    projectId?: string
    message: string
    type?: string
    view?: string
  }

  const view: AgentViewKey = (rawView && ALLOWED_VIEWS.has(rawView as AgentViewKey))
    ? (rawView as AgentViewKey)
    : 'default'

  console.log(`[agent] view=${view} projectId=${projectId ?? 'portfolio'}`)

  if (!message || message.length > 6000) {
    return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 })
  }
  if (!projectId && view !== 'inicio') {
    return NextResponse.json({ error: 'projectId requerido' }, { status: 400 })
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

  // Read user's agentMode to shape response length
  const agentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agentMode: true },
  })
  const agentMode = agentUser?.agentMode ?? 'equilibrado'

  // Rate limit: 5 messages per minute per user (across all their projects)
  const oneMinuteAgo = new Date(Date.now() - 60_000)
  const orgIds = memberships.map(m => m.organizationId)

  const recentCount = await prisma.agentMessage.count({
    where: {
      userId: session.user.id,
      role: 'user',
      createdAt: { gte: oneMinuteAgo },
    },
  })
  if (recentCount >= 5) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
  }

  // S3: Rate limit específico para minutas (3 por 5 minutos por proyecto)
  if (type === 'minuta') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const recentMinutas = await db.agentMessage.count({
      where: { projectId, role: 'user', createdAt: { gte: new Date(Date.now() - 5 * 60_000) } },
    }).catch(() => 0)
    if (recentMinutas >= 3) {
      return NextResponse.json({ error: 'Máximo 3 minutas cada 5 minutos. Espera un momento.' }, { status: 429 })
    }
  }

  // Verify access to the specific project (guests only see assigned projects)
  const guestOrgIds = memberships.filter(m => m.role === 'guest').map(m => m.organizationId)

  // For portfolio view, skip project fetch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let project: any = null

  if (view !== 'inicio') {
    project = await prisma.project.findFirst({
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
    if (guestOrgIds.includes(project.organizationId!)) {
      const isMember = await prisma.projectMember.findFirst({
        where: { projectId: projectId!, userId: session.user.id },
      })
      if (!isMember) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
  }

  const isMinuta = type === 'minuta'
  const isReporte = type === 'reporte_semanal'
  const model = (isMinuta || isReporte) ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001'

  if (isMinuta) {
    const today = new Date().toISOString().split('T')[0]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deliverableLines = (project!.deliverables as any[]).map((d: any) => {
      const statusLabel = d.status === 'ok' ? 'ok' : d.status === 'warn' ? 'warn' : 'danger'
      const due = d.dueDate ? new Date(d.dueDate).toISOString().split('T')[0] : 'sin fecha'
      return `${d.id} | ${escapeForPrompt(d.name)} | ${statusLabel} | ${d.priority} | ${d.ownerName ? escapeForPrompt(d.ownerName) : 'sin asignar'} | ${due}`
    }).join('\n')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memberLines = (project!.members as any[]).map((m: any) => escapeForPrompt(m.name)).join(', ')

    const minutaSystemPrompt = `Eres un asistente de gestión de proyectos. Analiza la minuta y genera un plan de acciones sobre entregables. Responde únicamente con JSON válido.`

    const minutaUserPrompt = `FECHA ACTUAL: ${today}
Si la minuta menciona fechas relativas (próximo lunes, fin de mes, etc.), resuélvelas a formato YYYY-MM-DD basándote en la fecha actual.

ENTREGABLES EXISTENTES (id | nombre | status_actual | prioridad | responsable | vencimiento):
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
    {"type":"create","name":"Gestionar permiso municipal","status":"warn","priority":"alta","ownerName":"Juan García","dueDate":"2026-04-20","startDate":"2026-04-10"},
    {"type":"reassign","id":"abc","name":"Nombre entregable","ownerName":"Juan García","reason":"La minuta lo designa como nuevo responsable"}
  ]
}

Reglas estrictas:
- Prefiere "update" sobre "create" si hay un entregable con nombre similar (matching flexible)
- Usa "note" cuando la minuta menciona anotar, registrar o recordar algo internamente
- Usa "reassign" cuando la minuta cambia el responsable de un entregable sin cambiar su estado
- Usa "create" solo para temas sin equivalente existente
- Si un entregable cambia de estado o fecha, usa "update"
- No inventes entregables que no estén en la minuta
- Para status usa ÚNICAMENTE: "ok" (completado), "warn" (en proceso), "danger" (en riesgo)
- Para priority usa ÚNICAMENTE: "alta", "media", "baja"
- Para ownerName usa exactamente el nombre del miembro del equipo si la minuta lo menciona; omite el campo si no hay responsable claro
- Para dueDate y startDate usa formato ISO YYYY-MM-DD si la minuta menciona fechas; omite si no hay fecha
- Si la minuta no contiene acuerdos claros sobre entregables, devuelve actions: [] y explica en summary por qué no hay acciones aplicables
- Máximo 12 acciones por minuta. Si hay más, prioriza las de mayor impacto
- Responde solo JSON, sin explicaciones`

    try {
      const response = await client.messages.create({
        model,
        max_tokens: 1200,
        system: minutaSystemPrompt,
        messages: [{ role: 'user', content: minutaUserPrompt }],
      })

      const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
      try {
        // Extract first JSON object — handles markdown code fences and leading text
        const match = rawText.match(/\{[\s\S]*\}/)
        if (!match) throw new Error('No JSON found')
        const rawPlan = JSON.parse(match[0])
        const plan = validateMinutaPlan(rawPlan)
        return NextResponse.json({ plan })
      } catch {
        return NextResponse.json({ plan: { summary: 'No se pudo interpretar la minuta.', actions: [] } })
      }
    } catch (err) {
      console.error('Agent minuta error:', err)
      return NextResponse.json({ plan: { summary: 'Error al procesar la minuta.', actions: [] } })
    }
  }

  if (isReporte) {
    // Fetch project with risks and KPIs for enriched context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const [risks, kpis] = await Promise.all([
      db.projectRisk.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } }).catch(() => []),
      db.projectKPI.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } }).catch(() => []),
    ])

    const riskLines = risks.length
      ? risks.map((r: { title: string; probability: string; impact: string; status: string; mitigation: string | null }) =>
          `- ${r.title} | Prob: ${r.probability} | Impacto: ${r.impact} | Estado: ${r.status}${r.mitigation ? ` | Mitigación: ${r.mitigation}` : ''}`
        ).join('\n')
      : '(sin riesgos registrados)'

    const kpiLines = kpis.length
      ? kpis.map((k: { title: string; current: number; target: number; unit: string }) => {
          const pct = k.target > 0 ? Math.round((k.current / k.target) * 100) : 0
          return `- ${k.title}: ${k.current}${k.unit ? ' ' + k.unit : ''} / ${k.target}${k.unit ? ' ' + k.unit : ''} (${pct}%)`
        }).join('\n')
      : '(sin KPIs registrados)'

    const reportePrompt = `${buildProjectContext(project!)}

RIESGOS REGISTRADOS:
${riskLines}

KPIs DEL PROYECTO:
${kpiLines}

Genera un reporte semanal ejecutivo completo del proyecto. Estructura el reporte así:
<strong>📊 Reporte Semanal — [nombre del proyecto]</strong><br>
<strong>Resumen ejecutivo:</strong> [2-3 oraciones del estado general]<br><br>
<strong>Avance:</strong> [% completado, tareas ok/total, ritmo]<br><br>
<strong>Logros de la semana:</strong> [bullet points con entregables completados o avances clave]<br><br>
<strong>Alertas y riesgos:</strong> [entregables en riesgo + riesgos del risk register relevantes]<br><br>
<strong>KPIs:</strong> [estado de los KPIs con colores ok/warn/danger]<br><br>
<strong>Próximos pasos:</strong> [3-5 acciones prioritarias para la próxima semana]<br><br>
Usa las clases HTML del sistema (ok, warn, danger, nl) para resaltar información clave.`

    try {
      const response = await client.messages.create({
        model,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: reportePrompt }],
      })

      const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

      let reporteReasoning: string | null = null
      let processedReporteText = rawText
      const reporteReasoningMatch = rawText.match(/<REASONING>([\s\S]*?)<\/REASONING>/)
      if (reporteReasoningMatch) {
        reporteReasoning = reporteReasoningMatch[1].trim().slice(0, 500)
        processedReporteText = rawText.replace(/<REASONING>[\s\S]*?<\/REASONING>/, '').trim()
      }

      // Persist report non-blocking
      db.processedReport.create({
        data: { projectId, userId: session.user.id, content: processedReporteText },
      }).catch(() => {})

      return NextResponse.json({ cardType: 'insight' as AgentCardType, html: processedReporteText, timestamp: new Date().toISOString(), reasoning: reporteReasoning })
    } catch (err) {
      console.error('Agent reporte error:', err)
      return NextResponse.json({
        html: '<strong class="danger">✦ Error:</strong> No se pudo generar el reporte. Intenta de nuevo.',
      })
    }
  }

  // Mode-specific prompt suffix and token budget (only for regular queries, not minuta/reporte)
  const MODE_SUFFIX: Record<string, string> = {
    solo_cuando_lo_pida: '\n\nModo: Responde con máximo 1 punto. Solo si hay algo crítico. Sé breve y conservador.',
    equilibrado: '\n\nModo: Genera 2-3 puntos con balance entre alertas y oportunidades.',
    proactivo: '\n\nModo: Genera 3-5 puntos. Incluye sugerencias de mejora aunque no sean urgentes.',
  }
  const MODE_TOKENS: Record<string, number> = {
    solo_cuando_lo_pida: 300,
    equilibrado: 600,
    proactivo: 1024,
  }
  const modeSystemPrompt = SYSTEM_PROMPT + (MODE_SUFFIX[agentMode] ?? MODE_SUFFIX['equilibrado'])
  const modeMaxTokens = MODE_TOKENS[agentMode] ?? 600

  try {
    let userContent: string
    if (view === 'inicio') {
      const portfolioCtx = await buildPortfolioContext(session.user.id)
      const focusLine = VIEW_FOCUS['inicio']
      userContent = `[Vista: Portafolio]\n${focusLine}\n\n${portfolioCtx}\n\nPregunta/instrucción: ${message}`
    } else {
      const focusLine = view ? (VIEW_FOCUS[view] ?? VIEW_FOCUS['default']) : ''
      userContent = focusLine
        ? `[Vista actual: ${focusLine}]\n\n${buildProjectContext(project!)}\n\nPregunta/instrucción: ${message}`
        : `${buildProjectContext(project!)}\n\nPregunta/instrucción: ${message}`
    }

    const response = await client.messages.create({
      model,
      max_tokens: modeMaxTokens,
      system: modeSystemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    let reasoning: string | null = null
    let processedText = rawText
    const reasoningMatch = rawText.match(/<REASONING>([\s\S]*?)<\/REASONING>/)
    if (reasoningMatch) {
      reasoning = reasoningMatch[1].trim().slice(0, 500)
      processedText = rawText.replace(/<REASONING>[\s\S]*?<\/REASONING>/, '').trim()
    }
    const cardType = resolveCardType(type, processedText)
    const cleanHtml = stripCardPrefix(processedText)

    // Persist conversation to DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    await db.agentMessage.createMany({
      data: [
        { projectId: projectId ?? null, userId: session.user.id, role: 'user', content: message, scope: view === 'inicio' ? 'portfolio' : null },
        { projectId: projectId ?? null, userId: session.user.id, role: 'agent', content: cleanHtml, cardType, reasoning, scope: view === 'inicio' ? 'portfolio' : null },
      ],
    }).catch(() => {}) // non-blocking — don't fail the response if DB write fails

    return NextResponse.json({ cardType, html: cleanHtml, timestamp: new Date().toISOString(), reasoning })
  } catch (err) {
    console.error('Agent API error:', err)
    return NextResponse.json({
      cardType: 'insight' as AgentCardType,
      html: '<strong class="danger">✦ Error del agente:</strong> No se pudo conectar con el servidor de IA. Verifica tu API key.',
      timestamp: new Date().toISOString(),
    })
  }
}
