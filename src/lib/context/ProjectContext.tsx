'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { Project, Deliverable } from '@/lib/types'
import { PROJECTS_MAP } from '@/lib/data/projects'

interface ProjectContextValue {
  projects: typeof PROJECTS_MAP
  getProject: (id: string) => Project | undefined
  updateDeliverable: (projectId: string, deliverable: Deliverable) => void
  addDeliverable: (projectId: string, deliverable: Deliverable) => void
  deleteDeliverable: (projectId: string, deliverableId: string) => void
  addMember: (projectId: string, memberId: string) => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState(() =>
    JSON.parse(JSON.stringify(PROJECTS_MAP)) as typeof PROJECTS_MAP
  )

  const getProject = useCallback(
    (id: string) => projects[id],
    [projects]
  )

  const updateDeliverable = useCallback((projectId: string, deliverable: Deliverable) => {
    setProjects(prev => {
      const p = { ...prev }
      p[projectId] = {
        ...p[projectId],
        deliverables: p[projectId].deliverables.map(d =>
          d.id === deliverable.id ? deliverable : d
        ),
      }
      return p
    })
  }, [])

  const addDeliverable = useCallback((projectId: string, deliverable: Deliverable) => {
    setProjects(prev => {
      const p = { ...prev }
      p[projectId] = {
        ...p[projectId],
        deliverables: [...p[projectId].deliverables, deliverable],
      }
      return p
    })
  }, [])

  const deleteDeliverable = useCallback((projectId: string, deliverableId: string) => {
    setProjects(prev => {
      const p = { ...prev }
      p[projectId] = {
        ...p[projectId],
        deliverables: p[projectId].deliverables.filter(d => d.id !== deliverableId),
      }
      return p
    })
  }, [])

  const addMember = useCallback((projectId: string, memberId: string) => {
    setProjects(prev => {
      const p = { ...prev }
      if (p[projectId].members.includes(memberId)) return prev
      p[projectId] = {
        ...p[projectId],
        members: [...p[projectId].members, memberId],
      }
      return p
    })
  }, [])

  return (
    <ProjectContext.Provider value={{ projects, getProject, updateDeliverable, addDeliverable, deleteDeliverable, addMember }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProjectContext must be used inside ProjectProvider')
  return ctx
}
