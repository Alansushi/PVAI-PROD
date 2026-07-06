import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireProjectAccess as getProjectAccess } from '@/lib/project-access'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const project = await getProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const reports = await db.processedReport.findMany({
      where: { projectId: id },
      orderBy: { generatedAt: 'desc' },
      take: 5,
    })
    return NextResponse.json(reports)
  } catch (err) {
    console.error('[reports GET]', err)
    return NextResponse.json([], { status: 200 })
  }
}
