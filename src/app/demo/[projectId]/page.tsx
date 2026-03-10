'use client'

import { useEffect } from 'react'
import { notFound } from 'next/navigation'
import { useProjectContext } from '@/lib/context/ProjectContext'
import { useAgentContext } from '@/lib/context/AgentContext'
import TopBar from '@/components/project/TopBar'
import KpiCards from '@/components/project/KpiCards'
import GanttChart from '@/components/project/GanttChart'
import KanbanBoard from '@/components/project/KanbanBoard'

interface Props {
  params: { projectId: string }
}

export default function ProjectPage({ params }: Props) {
  const { projectId } = params
  const { getProject } = useProjectContext()
  const { initMessages } = useAgentContext()
  const project = getProject(projectId)

  useEffect(() => {
    if (project) {
      initMessages(project.agentMsgs)
    }
  }, [projectId, project, initMessages])

  if (!project) return notFound()

  return (
    <div className="p-5 flex flex-col gap-4">
      <TopBar project={project} projectId={projectId} />
      <KpiCards kpis={project.kpis} />
      <GanttChart
        title={project.ganttTitle}
        range={project.ganttRange}
        rows={project.gantt}
        deadline={project.deadline}
      />
      <KanbanBoard
        projectId={projectId}
        delTitle={project.delTitle}
        delCount={project.delCount}
        deliverables={project.deliverables}
      />
    </div>
  )
}
