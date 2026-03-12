import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { AgentProvider } from '@/lib/context/AgentContext'
import { ProjectProvider } from '@/lib/context/ProjectContext'
import DashboardNav from '@/components/layout/DashboardNav'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import AgentPanel from '@/components/layout/AgentPanel'
import DashboardFooter from '@/components/layout/DashboardFooter'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.user?.id) redirect('/login')

  const memberships = await prisma.orgMember.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
  })
  if (!memberships.length) redirect('/onboarding')

  const isOnlyGuest = memberships.every(m => m.role === 'guest')
  const primaryMembership = memberships.find(m => m.role !== 'guest') ?? memberships[0]

  // Guests only see projects they're assigned to
  const projectsList = await Promise.all(
    memberships.map(m => {
      if (m.role === 'guest') {
        return prisma.project.findMany({
          where: {
            organizationId: m.organizationId,
            members: { some: { userId: session.user.id } },
          },
          select: { id: true, title: true, type: true, status: true },
          orderBy: { createdAt: 'desc' },
        })
      }
      return prisma.project.findMany({
        where: { organizationId: m.organizationId },
        select: { id: true, title: true, type: true, status: true },
        orderBy: { createdAt: 'desc' },
      })
    })
  )
  const allProjects = projectsList.flat()
  const projects = Array.from(new Map(allProjects.map(p => [p.id, p])).values())

  return (
    <ProjectProvider>
    <AgentProvider>
      <div className="min-h-screen bg-pv-navy flex flex-col">
        <DashboardNav session={session} orgName={primaryMembership.organization.name} />
        <div
          style={{ display: 'grid', gridTemplateColumns: '210px 1fr', marginRight: '295px' }}
        >
          <DashboardSidebar projects={projects} isOnlyGuest={isOnlyGuest} />
          <main>{children}</main>
        </div>
        <DashboardFooter />
        <AgentPanel />
      </div>
    </AgentProvider>
    </ProjectProvider>
  )
}
