'use client'

import { ProjectProvider } from '@/lib/context/ProjectContext'
import { AgentProvider } from '@/lib/context/AgentContext'
import DemoNav from '@/components/layout/DemoNav'
import Sidebar from '@/components/layout/Sidebar'
import AgentPanel from '@/components/layout/AgentPanel'
import { getAllProjects } from '@/lib/data/projects'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const projects = getAllProjects()

  return (
    <ProjectProvider>
      <AgentProvider>
        <div className="min-h-screen bg-pv-navy flex flex-col">
          <DemoNav />
          <div
            className="flex-1 overflow-hidden"
            style={{ display: 'grid', gridTemplateColumns: '210px 1fr 295px', height: 'calc(100vh - 57px)' }}
          >
            <Sidebar projects={projects} />
            <main className="overflow-y-auto">{children}</main>
            <AgentPanel />
          </div>
        </div>
      </AgentProvider>
    </ProjectProvider>
  )
}
