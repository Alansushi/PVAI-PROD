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

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const summary = await db.userDailySummary.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: todayISO(),
      },
    },
  }).catch(() => null)

  return NextResponse.json({ summary: summary ?? null })
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const today = todayISO()

  // Idempotency: return existing record if already generated today
  const existing = await db.userDailySummary.findUnique({
    where: { userId_date: { userId, date: today } },
  }).catch(() => null)

  if (existing) {
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
                select: { status: true },
              },
            },
          },
        },
      },
    },
  })

  const allProjects = memberships.flatMap(
    (m: { organization: { projects: Array<{ id: string; status: string; deliverables: Array<{ status: string }> }> } }) =>
      m.organization.projects
  )

  // De-duplicate projects (user may belong to multiple orgs that share nothing, but guard anyway)
  const seenIds = new Set<string>()
  const uniqueProjects = allProjects.filter(
    (p: { id: string }) => !seenIds.has(p.id) && seenIds.add(p.id)
  )

  const total = uniqueProjects.length
  const atRisk = uniqueProjects.filter(
    (p: { status: string }) => p.status === 'warn' || p.status === 'danger'
  ).length

  const allDeliverables = uniqueProjects.flatMap(
    (p: { deliverables: Array<{ status: string }> }) => p.deliverables
  )
  const compliance =
    allDeliverables.length === 0
      ? 100
      : Math.round(
          (allDeliverables.filter((d: { status: string }) => d.status === 'ok').length /
            allDeliverables.length) *
            100
        )

  // Derive first name from session
  const firstName = session.user.name?.split(' ')[0] ?? 'director'
  const greeting = getGreeting()

  // Attempt AI generation; fall back to plain text if unavailable
  let content: string

  if (!process.env.ANTHROPIC_API_KEY) {
    // Plain text fallback
    content = `${greeting} ${firstName}, esto es lo que importa hoy. Tienes <span class="nl">${total}</span> proyecto${total !== 1 ? 's' : ''} activo${total !== 1 ? 's' : ''}${atRisk > 0 ? `, <span class="warn">${atRisk} en riesgo</span>` : ', <span class="ok">todos al corriente</span>'}. Cumplimiento de entregables: <span class="${compliance >= 80 ? 'ok' : compliance >= 50 ? 'warn' : 'danger'}">${compliance}%</span>.`
  } else {
    const riskLabel =
      atRisk === 0
        ? `<span class="ok">todos al corriente</span>`
        : `<span class="nl">${atRisk}</span> <span class="warn">en riesgo</span>`

    const complianceClass =
      compliance >= 80 ? 'ok' : compliance >= 50 ? 'warn' : 'danger'

    const userPrompt = `Genera exactamente 2 oraciones en español para el resumen diario de un director de arquitectura/diseño.

Datos:
- Saludo: "${greeting} ${firstName}, esto es lo que importa hoy."
- Proyectos totales: ${total}
- Proyectos en riesgo (status warn o danger): ${atRisk}
- Cumplimiento de entregables: ${compliance}%

Oración 1: Usa exactamente el saludo proporcionado arriba, sin modificarlo.
Oración 2: Resume el estado del portafolio en una sola oración, usando estas clases HTML inline para resaltar datos: <span class="nl"> para números y datos clave, <span class="ok"> para cosas positivas, <span class="warn"> para advertencias, <span class="danger"> para riesgos críticos.

Ejemplos de oración 2:
- "Tienes <span class=\\"nl\\">3</span> proyectos activos, <span class=\\"warn\\">1 en riesgo</span> y un cumplimiento del <span class=\\"ok\\">87%</span>."
- "Tu portafolio tiene <span class=\\"nl\\">5</span> proyectos, <span class=\\"ok\\">todos al corriente</span> con <span class=\\"ok\\">${compliance}% de cumplimiento</span>."

Estado actual: ${total} proyectos, ${riskLabel}, cumplimiento <span class="${complianceClass}">${compliance}%</span>.
Responde solo con las 2 oraciones en HTML, sin explicaciones adicionales.`

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 180,
        messages: [{ role: 'user', content: userPrompt }],
      })

      content =
        response.content[0].type === 'text'
          ? response.content[0].text.trim()
          : `${greeting} ${firstName}, esto es lo que importa hoy. Tienes <span class="nl">${total}</span> proyecto${total !== 1 ? 's' : ''} activo${total !== 1 ? 's' : ''}, ${riskLabel}, cumplimiento <span class="${complianceClass}">${compliance}%</span>.`
    } catch {
      // Plain text fallback on API error
      content = `${greeting} ${firstName}, esto es lo que importa hoy. Tienes <span class="nl">${total}</span> proyecto${total !== 1 ? 's' : ''} activo${total !== 1 ? 's' : ''}, ${riskLabel}, cumplimiento <span class="${complianceClass}">${compliance}%</span>.`
    }
  }

  // Persist and return
  const summary = await db.userDailySummary.create({
    data: { userId, date: today, content },
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
