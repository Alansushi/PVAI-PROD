import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { DBAuditLogEntry, DBVelocityWeek } from '@/lib/db-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

function getISOWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function weekLabel(weekStart: Date): string {
  return weekStart.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const type = req.nextUrl.searchParams.get('type')

    if (type === 'velocity') {
      // Fetch audit logs for deliverable updates in the last 7 weeks
      const sevenWeeksAgo = new Date()
      sevenWeeksAgo.setDate(sevenWeeksAgo.getDate() - 49)

      const logs = await db.auditLog.findMany({
        where: {
          projectId: id,
          entity: 'deliverable',
          action: 'update',
          createdAt: { gte: sevenWeeksAgo },
        },
        orderBy: { createdAt: 'asc' },
      })

      // Count completions per ISO week (where newValue.status === 'ok' and oldValue.status !== 'ok')
      const weekMap = new Map<string, { weekStart: Date; completed: number }>()

      for (const log of logs) {
        const nv = log.newValue as Record<string, unknown> | null
        const ov = log.oldValue as Record<string, unknown> | null
        if (nv?.status === 'ok' && ov?.status !== 'ok') {
          const weekStart = getISOWeekStart(new Date(log.createdAt))
          const key = weekStart.toISOString()
          const entry = weekMap.get(key) ?? { weekStart, completed: 0 }
          entry.completed++
          weekMap.set(key, entry)
        }
      }

      // Build last 6 complete weeks + current week = 7 weeks displayed
      const weeks: DBVelocityWeek[] = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i * 7)
        const ws = getISOWeekStart(d)
        const key = ws.toISOString()
        weeks.push({
          weekLabel: weekLabel(ws),
          startDate: ws.toISOString(),
          completed: weekMap.get(key)?.completed ?? 0,
        })
      }

      // Required per week: pending deliverables / weeks remaining
      const pendingCount = await prisma.deliverable.count({
        where: { projectId: id, status: { not: 'ok' } },
      })

      let requiredPerWeek = 0
      if (project.endDate) {
        const weeksLeft = Math.max(
          Math.ceil((new Date(project.endDate).getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)),
          1,
        )
        requiredPerWeek = Math.ceil(pendingCount / weeksLeft)
      }

      return NextResponse.json({ weeks, requiredPerWeek })
    }

    // Default: recent activity feed
    const logs = await db.auditLog.findMany({
      where: { projectId: id, entity: 'deliverable' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true } } },
    })

    const entries: DBAuditLogEntry[] = logs.map((log: {
      id: string
      userId: string
      action: string
      entityName: string | null
      createdAt: Date
      user: { name: string | null } | null
    }) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      entityName: log.entityName,
      createdAt: log.createdAt,
      userName: log.user?.name ?? null,
    }))

    return NextResponse.json(entries)
  } catch (err) {
    console.error('[activity] Error:', err)
    return NextResponse.json([], { status: 200 })
  }
}
