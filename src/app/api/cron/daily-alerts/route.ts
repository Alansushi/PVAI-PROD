import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOverdueTaskAlert } from '@/lib/email'

// Called daily by Vercel Cron (or manually with ?secret=CRON_SECRET)
export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
    ?? new URL(req.url).searchParams.get('secret')

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
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

  return NextResponse.json({
    ok: true,
    overdueFound: overdueDeliverables.length,
    emailsSent,
    notificationsCreated,
    errors: errors.length > 0 ? errors : undefined,
  })
}

// Allow GET for easy manual testing in browser
export async function GET(req: NextRequest) {
  return POST(req)
}
