import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { renderToStream } from '@react-pdf/renderer'
import { createElement } from 'react'
import ProjectReportPDF from '@/components/pdf/ProjectReportPDF'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

async function getProjectAccess(userId: string, projectId: string) {
  const memberships = await prisma.orgMember.findMany({ where: { userId } })
  if (!memberships.length) return null
  const orgIds = memberships.map(m => m.organizationId)
  const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: { in: orgIds } } })
  if (!project) return null
  const guestOrgIds = memberships.filter(m => m.role === 'guest').map(m => m.organizationId)
  if (guestOrgIds.includes(project.organizationId)) {
    const isMember = await prisma.projectMember.findFirst({ where: { projectId, userId } })
    if (!isMember) return null
  }
  return project
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const project = await getProjectAccess(session.user.id, id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Fetch all data in one go
    const [deliverables, members, risks, kpis] = await Promise.all([
      prisma.deliverable.findMany({ where: { projectId: id }, orderBy: { position: 'asc' } }),
      prisma.projectMember.findMany({ where: { projectId: id } }),
      db.projectRisk.findMany({ where: { projectId: id } }),
      db.projectKPI.findMany({ where: { projectId: id } }),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(ProjectReportPDF as any, {
      project,
      deliverables,
      members,
      risks,
      kpis,
    }) as any

    const pdfStream = await renderToStream(element)

    // Convert Node stream to ReadableStream for NextResponse
    const webStream = new ReadableStream({
      start(controller) {
        pdfStream.on('data', (chunk: Buffer) => controller.enqueue(chunk))
        pdfStream.on('end', () => controller.close())
        pdfStream.on('error', (err: Error) => controller.error(err))
      },
    })

    const slug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${slug}-reporte.pdf"`,
      },
    })
  } catch (err) {
    console.error('[report-pdf GET]', err)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
