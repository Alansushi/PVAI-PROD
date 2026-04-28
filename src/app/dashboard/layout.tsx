import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { AgentProvider } from '@/lib/context/AgentContext'
import { ProjectProvider } from '@/lib/context/ProjectContext'
import { ToastProvider } from '@/lib/context/ToastContext'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import DashboardShell from '@/components/layout/DashboardShell'
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

  // Only admins see all org projects; everyone else only sees assigned projects
  const projectsList = await Promise.all(
    memberships.map(m => {
      if (m.role !== 'admin') {
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
    <ToastProvider>
    <ProjectProvider>
    <AgentProvider>
      <div className="min-h-screen bg-pv-navy flex flex-col">
        <DashboardShell
          session={session}
          orgName={primaryMembership.organization.name}
          sidebar={<DashboardSidebar projects={projects} isOnlyGuest={isOnlyGuest} />}
        >
          {children}
        </DashboardShell>
        <DashboardFooter />
      </div>
    </AgentProvider>
    </ProjectProvider>
    </ToastProvider>
  )
}
