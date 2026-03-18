'use client'

import { createContext, useContext, ReactNode } from 'react'

const ProjectContext = createContext<null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  return (
    <ProjectContext.Provider value={null}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  return useContext(ProjectContext)
}
