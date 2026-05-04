import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const VALID_EXECUTE_TARGETS = new Set([
  'riesgos', 'velocidad', 'prediccion', 'bloqueados',
  'resumen_ejecutivo', 'reporte_semanal', 'avance',
])

function parseActionsJson(raw: string): { actions: { label: string; type: string; target: string }[] } {
  try {
    const parsed = JSON.parse(raw.trim())
    if (!Array.isArray(parsed?.actions)) return { actions: [] }
    const actions = parsed.actions.filter(
      (a: { label?: unknown; type?: unknown; target?: unknown }) =>
        typeof a.label === 'string' &&
        (a.type === 'navigate' || a.type === 'execute') &&
        typeof a.target === 'string' &&
        (a.type === 'navigate'
          ? a.target.startsWith('/dashboard')
          : VALID_EXECUTE_TARGETS.has(a.target as string))
    )
    return { actions: actions.slice(0, 3) }
  } catch {
    return { actions: [] }
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const today = (/^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('date') ?? ''))
    ? url.searchParams.get('date')!
    : todayISO()

  const summary = await db.userDailySummary.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: today,
      },
    },
  }).catch(() => null)

  return NextResponse.json({ summary: summary ?? null })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  let body: { clientDate?: string } = {}
  try { body = await req.json() } catch { /* ignore */ }
  const today = (body.clientDate && /^\d{4}-\d{2}-\d{2}$/.test(body.clientDate))
    ? body.clientDate
    : todayISO()

  // Idempotency: return existing record if already generated today with actions
  const existing = await db.userDailySummary.findUnique({
    where: { userId_date: { userId, date: today } },
  }).catch(() => null)

  if (existing?.actionsJson !== undefined) {
    return NextResponse.json({ summary: existing })
  }

  // Build portfolio stats
  const memberships = await prisma.orgMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          projects: {
            select: {
              id: true,
              status: true,
              deliverables: {
                select: { status: true, dueDate: true },
              },
            },
          },
        },
      },
    },
  })

  const allProjects = memberships.flatMap(
    (m: { organization: { projects: Array<{ id: string; status: string; deliverables: Array<{ status: string; dueDate: Date | null }> }> } }) =>
      m.organization.projects
  )

  const seenIds = new Set<string>()
  const uniqueProjects = allProjects.filter(
    (p: { id: string }) => !seenIds.has(p.id) && seenIds.add(p.id)
  )

  const total = uniqueProjects.length
  const atRisk = uniqueProjects.filter(
    (p: { status: string }) => p.status === 'warn' || p.status === 'danger'
  ).length

  const allDeliverables = uniqueProjects.flatMap(
    (p: { deliverables: Array<{ status: string; dueDate: Date | null }> }) => p.deliverables
  )

  const now = new Date()
  const overdueCount = allDeliverables.filter(
    (d: { status: string; dueDate: Date | null }) =>
      d.status !== 'ok' && d.dueDate && new Date(d.dueDate) < now
  ).length

  const compliance =
    allDeliverables.length === 0
      ? 100
      : Math.round(
          (allDeliverables.filter((d: { status: string }) => d.status === 'ok').length /
            allDeliverables.length) *
            100
        )

  const firstName = session.user.name?.split(' ')[0] ?? ''
  const greetingWord = getGreeting()
  const namePart = firstName ? ` ${firstName}` : ''

  let content: string
  let actionsJson: { actions: { label: string; type: string; target: string }[] } = { actions: [] }

  const complianceClass = compliance >= 80 ? 'ok' : compliance >= 50 ? 'warn' : 'danger'
  const riskLabel = atRisk === 0
    ? `<span class="ok">todos al corriente</span>`
    : `<span class="nl">${atRisk}</span> <span class="warn">en riesgo</span>`

  if (!process.env.ANTHROPIC_API_KEY) {
    content = `${greetingWord}${namePart}, esto es lo que importa hoy. Tienes <span class="nl">${total}</span> proyecto${total !== 1 ? 's' : ''} activo${total !== 1 ? 's' : ''}, ${riskLabel}, cumplimiento <span class="${complianceClass}">${compliance}%</span>.`
  } else {
    const userPrompt = `Genera exactamente 2 oraciones en español para el resumen diario de un director de arquitectura/diseño.

Datos del portafolio:
- Proyectos totales: ${total}
- Proyectos en riesgo (status warn o danger): ${atRisk}
- Cumplimiento de entregables: ${compliance}%
- Entregables vencidos: ${overdueCount}

Oración 1: Saludo. Usa "${greetingWord}${namePart}, esto es lo que importa hoy." — si el nombre está vacío, escribe simplemente "Hola, esto es lo que importa hoy."
Oración 2: Resume el estado del portafolio en una sola oración, usando estas clases HTML inline: <span class="nl"> para números, <span class="ok"> para cosas positivas, <span class="warn"> para advertencias, <span class="danger"> para riesgos críticos.

Después de las 2 oraciones, escribe exactamente el separador "---ACTIONS---" en una línea nueva, seguido de un JSON con hasta 3 acciones concretas para hoy:
{"actions":[{"label":"Ver proyectos en riesgo","type":"navigate","target":"/dashboard/inicio"},{"label":"Generar resumen ejecutivo","type":"execute","target":"resumen_ejecutivo"}]}

Reglas para las acciones:
- type "navigate": target debe ser una URL válida que empiece con /dashboard
- type "execute": target debe ser uno de: riesgos, velocidad, prediccion, bloqueados, resumen_ejecutivo, reporte_semanal, avance
- Si no hay ${atRisk} proyectos en riesgo, no sugieras "ver riesgos"
- Si ${overdueCount} entregables están vencidos, sugiere revisarlos
- Si todo va bien (atRisk=0, cumplimiento>=80), sugiere un análisis proactivo
- Si no hay acciones relevantes, devuelve {"actions":[]}

Responde SOLO con las 2 oraciones HTML seguidas del separador y el JSON. Sin texto adicional.`

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: userPrompt }],
      })

      const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
      const separatorIdx = raw.indexOf('---ACTIONS---')

      if (separatorIdx !== -1) {
        content = raw.slice(0, separatorIdx).trim()
        actionsJson = parseActionsJson(raw.slice(separatorIdx + 13))
      } else {
        content = raw || `${greetingWord}${namePart}, esto es lo que importa hoy. Tienes <span class="nl">${total}</span> proyecto${total !== 1 ? 's' : ''} activo${total !== 1 ? 's' : ''}, ${riskLabel}, cumplimiento <span class="${complianceClass}">${compliance}%</span>.`
      }
    } catch {
      content = `${greetingWord}${namePart}, esto es lo que importa hoy. Tienes <span class="nl">${total}</span> proyecto${total !== 1 ? 's' : ''} activo${total !== 1 ? 's' : ''}, ${riskLabel}, cumplimiento <span class="${complianceClass}">${compliance}%</span>.`
    }
  }

  const summary = await db.userDailySummary.upsert({
    where: { userId_date: { userId, date: today } },
    update: { actionsJson },
    create: { userId, date: today, content, actionsJson },
  })

  return NextResponse.json({ summary })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let dismissed: boolean
  try {
    const body = await req.json()
    if (typeof body.dismissed !== 'boolean') {
      return NextResponse.json({ error: 'dismissed must be a boolean' }, { status: 400 })
    }
    dismissed = body.dismissed
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  await db.userDailySummary.updateMany({
    where: {
      userId: session.user.id,
      date: todayISO(),
    },
    data: { dismissed },
  })

  return NextResponse.json({ ok: true })
}
