import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

function authCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true
  const url = new URL(req.url)
  return url.searchParams.get('secret') === secret
}

export async function GET(req: NextRequest) {
  if (!authCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  let totalCards = 0

  // Find all users in proactivo mode with active memberships
  const proactiveUsers = await prisma.user.findMany({
    where: { agentMode: 'proactivo' },
    select: { id: true, name: true },
  })

  for (const user of proactiveUsers) {
    const memberships = await prisma.orgMember.findMany({
      where: { userId: user.id },
      select: { organizationId: true },
    })
    const orgIds = memberships.map(m => m.organizationId)
    if (!orgIds.length) continue

    // Condition 1: Deliverables that became overdue in the last 6h
    const newlyOverdue = await prisma.deliverable.findMany({
      where: {
        status: { not: 'ok' },
        dueDate: { gte: sixHoursAgo, lt: new Date() },
        project: {
          organizationId: { in: orgIds },
          members: { some: { userId: user.id } },
        },
      },
      include: { project: { select: { id: true, title: true } } },
      take: 5,
    })

    for (const del of newlyOverdue) {
      const alreadyNotified = await db.agentMessage.count({
        where: {
          userId: user.id,
          projectId: del.projectId,
          cardType: 'alerta',
          createdAt: { gte: sixHoursAgo },
          content: { contains: del.name.slice(0, 30) },
        },
      }).catch(() => 1) // if error, skip

      if (alreadyNotified > 0) continue

      const content = `<CARD:alerta><strong class="danger">⚠ Entregable vencido:</strong> <span class="nl">${del.name}</span> del proyecto <span class="nl">${del.project.title}</span> acaba de vencer. Actualiza su estado o reagenda para mantener el proyecto al corriente.`

      await db.agentMessage.create({
        data: {
          userId: user.id,
          projectId: del.projectId,
          role: 'agent',
          content,
          cardType: 'alerta',
          scope: 'project',
          dismissed: false,
        },
      }).catch(() => {})

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Entregable vencido',
          body: `"${del.name}" en ${del.project.title} venció hace menos de 6 horas.`,
          type: 'deliverable_overdue',
          projectId: del.projectId,
          entityId: del.id,
        },
      }).catch(() => {})

      totalCards++
    }

    // Condition 2: Project moved to warn/danger in last 6h (via AuditLog)
    const projectStatusChanges = await prisma.auditLog.findMany({
      where: {
        entity: 'project',
        action: 'update',
        createdAt: { gte: sixHoursAgo },
        userId: user.id,
      },
      select: { projectId: true, newValue: true, entityName: true },
    })

    for (const log of projectStatusChanges) {
      if (!log.projectId) continue
      const nv = log.newValue as Record<string, unknown> | null
      if (!nv || (nv['status'] !== 'warn' && nv['status'] !== 'danger')) continue

      const statusLabel = nv['status'] === 'danger' ? 'cobro vencido' : 'en riesgo'
      const content = `<CARD:alerta><strong class="warn">⚠ Estado del proyecto:</strong> <span class="nl">${log.entityName ?? 'Proyecto'}</span> cambió a <span class="${nv['status'] === 'danger' ? 'danger' : 'warn'}">${statusLabel}</span>. Revisa los entregables pendientes y el estado del cobro.`

      const alreadyNotified = await db.agentMessage.count({
        where: {
          userId: user.id,
          projectId: log.projectId,
          cardType: 'alerta',
          createdAt: { gte: sixHoursAgo },
        },
      }).catch(() => 1)

      if (alreadyNotified > 0) continue

      await db.agentMessage.create({
        data: {
          userId: user.id,
          projectId: log.projectId,
          role: 'agent',
          content,
          cardType: 'alerta',
          scope: 'project',
          dismissed: false,
        },
      }).catch(() => {})

      totalCards++
    }

    // Condition 3: 3+ deliverables assigned to same person in last 24h
    const recentAssignments = await prisma.deliverable.findMany({
      where: {
        ownerId: { not: null },
        updatedAt: { gte: oneDayAgo },
        project: {
          organizationId: { in: orgIds },
          members: { some: { userId: user.id } },
        },
      },
      select: { ownerId: true, ownerName: true, projectId: true },
    })

    const ownerCounts = new Map<string, { name: string; projectId: string; count: number }>()
    for (const d of recentAssignments) {
      if (!d.ownerId || !d.ownerName) continue
      const existing = ownerCounts.get(d.ownerId)
      if (existing) existing.count++
      else ownerCounts.set(d.ownerId, { name: d.ownerName, projectId: d.projectId, count: 1 })
    }

    for (const [, data] of ownerCounts) {
      if (data.count < 3) continue

      const alreadyNotified = await db.agentMessage.count({
        where: {
          userId: user.id,
          cardType: 'recomendacion',
          createdAt: { gte: oneDayAgo },
          content: { contains: data.name.slice(0, 20) },
        },
      }).catch(() => 1)

      if (alreadyNotified > 0) continue

      const content = `<CARD:recomendacion><strong class="warn">⚡ Alta carga de trabajo:</strong> <span class="nl">${data.name}</span> tiene <span class="nl">${data.count} tareas</span> asignadas en las últimas 24h. Considera redistribuir la carga para evitar cuellos de botella.`

      await db.agentMessage.create({
        data: {
          userId: user.id,
          projectId: data.projectId,
          role: 'agent',
          content,
          cardType: 'recomendacion',
          scope: 'project',
          dismissed: false,
        },
      }).catch(() => {})

      totalCards++
    }
  }

  return NextResponse.json({ ok: true, cardsCreated: totalCards, usersChecked: proactiveUsers.length })
}

export async function POST(req: NextRequest) {
  return GET(req)
}
