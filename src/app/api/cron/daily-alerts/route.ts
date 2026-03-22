import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOverdueTaskAlert } from '@/lib/email'

// Called daily by Vercel Cron (or manually with ?secret=CRON_SECRET)
export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
    ?? new URL(req.url).searchParams.get('secret')

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Find overdue deliverables with a registered owner (userId present)
  const overdueDeliverables = await prisma.deliverable.findMany({
    where: {
      dueDate: { lt: now },
      status: { not: 'ok' },
      ownerId: { not: null },
    },
    include: {
      owner: { select: { id: true, email: true, name: true } },
      project: { select: { id: true, title: true } },
    },
  })

  let emailsSent = 0
  let notificationsCreated = 0
  const errors: string[] = []

  for (const d of overdueDeliverables) {
    if (!d.owner?.email) continue

    try {
      // Send email alert
      await sendOverdueTaskAlert(
        { email: d.owner.email, name: d.owner.name },
        { name: d.name, dueDate: d.dueDate, projectTitle: d.project?.title }
      )
      emailsSent++
    } catch (err) {
      errors.push(`Email for ${d.id}: ${String(err)}`)
    }

    try {
      // Create in-app notification (skip if one already exists today for same deliverable)
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)

      const existing = await prisma.notification.findFirst({
        where: {
          userId: d.owner.id!,
          entityId: d.id,
          type: 'overdue',
          createdAt: { gte: startOfDay },
        },
      })

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: d.owner.id!,
            title: 'Entregable vencido',
            body: `"${d.name}"${d.project ? ` en ${d.project.title}` : ''} venció y sigue pendiente.`,
            type: 'overdue',
            projectId: d.project?.id ?? null,
            entityId: d.id,
          },
        })
        notificationsCreated++
      }
    } catch (err) {
      errors.push(`Notification for ${d.id}: ${String(err)}`)
    }
  }

  // Monday-only: predictive velocity risk notifications for PMs (F3.3)
  let velocityRiskNotifs = 0
  if (now.getDay() === 1) {
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const projects = await prisma.project.findMany({
      where: { endDate: { not: null } },
      include: {
        members: { where: { role: 'owner' } },
      },
    })

    for (const proj of projects) {
      try {
        if (!proj.endDate) continue

        // Compute velocity: completions in last 2 weeks from AuditLog
        const twoWeeksAgo = new Date(now)
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

        const completions = await prisma.auditLog.count({
          where: {
            projectId: proj.id,
            action: 'update',
            createdAt: { gte: twoWeeksAgo },
            newValue: { path: ['status'], equals: 'ok' },
          },
        })
        const velocidadActual = completions / 2

        // Compute required velocity
        const pending = await prisma.deliverable.count({
          where: { projectId: proj.id, status: { not: 'ok' } },
        })
        const weeksLeft = Math.max(
          Math.ceil((proj.endDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)),
          1,
        )
        const velocityRequired = pending / weeksLeft

        if (velocityRequired <= 0 || velocidadActual >= velocityRequired * 0.8) continue

        // Notify each PM (owner)
        for (const pm of proj.members) {
          if (!pm.userId) continue

          // Dedup: skip if notified in last 7 days
          const existing = await prisma.notification.findFirst({
            where: {
              userId: pm.userId,
              type: 'velocity_risk',
              projectId: proj.id,
              createdAt: { gte: sevenDaysAgo },
            },
          })
          if (existing) continue

          await prisma.notification.create({
            data: {
              userId: pm.userId,
              title: 'Riesgo de delay detectado',
              body: `El proyecto "${proj.title}" va a ${velocidadActual.toFixed(1)} tareas/semana pero necesita ${velocityRequired.toFixed(1)} para llegar al deadline.`,
              type: 'velocity_risk',
              projectId: proj.id,
            },
          })
          velocityRiskNotifs++
        }
      } catch (err) {
        errors.push(`VelocityRisk for ${proj.id}: ${String(err)}`)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    overdueFound: overdueDeliverables.length,
    emailsSent,
    notificationsCreated,
    velocityRiskNotifs,
    errors: errors.length > 0 ? errors : undefined,
  })
}

// Allow GET for easy manual testing in browser
export async function GET(req: NextRequest) {
  return POST(req)
}
