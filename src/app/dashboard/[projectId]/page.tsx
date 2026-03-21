'use client'

import { useState, useEffect, use } from 'react'
import { redirect } from 'next/navigation'
import type { DBProjectWithRelations } from '@/lib/db-types'
import DashboardProjectView from '@/components/dashboard/DashboardProjectView'
import { getCached, setCached, invalidateCache } from '@/lib/client-cache'

interface Props {
  params: Promise<{ projectId: string }>
}

function ProjectSkeleton() {
  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Header — matches: flex justify-between items-start */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="h-6 w-56 bg-white/[0.06] rounded animate-pulse" />
          <div className="h-3 w-24 bg-white/[0.06] rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-20 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="flex -space-x-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-[30px] h-[30px] rounded-full bg-white/[0.06] animate-pulse border-2 border-[#0C1F35]" />
            ))}
          </div>
          <div className="h-5 w-24 bg-white/[0.06] rounded-full animate-pulse" />
        </div>
      </div>

      {/* KPIs — matches: grid-cols-4 gap-2.5, px-3.5 py-3 */}
      <div className="grid grid-cols-4 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-3 flex flex-col gap-1.5">
            <div className="h-2 w-24 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-6 w-14 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-2 w-20 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-4 w-16 bg-white/[0.06] rounded-lg animate-pulse mt-0.5" />
          </div>
        ))}
      </div>

      {/* Gantt — matches: container card con header + fila fechas + rows */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center">
          <div className="h-3 w-24 bg-white/[0.06] rounded animate-pulse" />
        </div>
        <div className="grid border-b border-white/[0.06] h-7 items-center px-4"
          style={{ gridTemplateColumns: '155px 1fr' }}>
          <div className="h-2 w-10 bg-white/[0.06] rounded animate-pulse" />
          <div className="flex gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-2 w-7 bg-white/[0.06] rounded animate-pulse" />
            ))}
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}
            className="grid border-b border-white/[0.04] last:border-b-0 items-center min-h-[34px]"
            style={{ gridTemplateColumns: '155px 1fr' }}>
            <div className="px-4 py-1.5 flex flex-col gap-1">
              <div className="h-2.5 w-24 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-2 w-16 bg-white/[0.06] rounded animate-pulse" />
            </div>
            <div className="relative h-[34px]">
              <div
                className="absolute h-[15px] top-1/2 -translate-y-1/2 rounded-[4px] bg-white/[0.06] animate-pulse"
                style={{ left: `${i * 12}%`, width: `${28 + i * 15}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Kanban — matches: una sola card contenedor con header + grid 3 cols */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.07] flex justify-between items-center">
          <div className="h-3 w-24 bg-white/[0.06] rounded animate-pulse" />
          <div className="h-6 w-24 bg-white/[0.06] rounded-lg animate-pulse" />
        </div>
        <div className="grid border-t border-white/[0.07]" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          {[3, 2, 2].map((cardCount, col) => (
            <div key={col} className="border-r border-white/[0.06] last:border-r-0 flex flex-col min-h-[180px]">
              <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.06]">
                <div className="h-2.5 w-24 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-4 w-5 bg-white/[0.06] rounded animate-pulse" />
              </div>
              <div className="p-2 flex flex-col gap-1.5">
                {Array.from({ length: cardCount }).map((_, i) => (
                  <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-2.5 flex flex-col gap-1.5">
                    <div className="h-3 w-4/5 bg-white/[0.06] rounded animate-pulse" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/[0.06] animate-pulse flex-shrink-0" />
                      <div className="h-2 w-20 bg-white/[0.06] rounded animate-pulse" />
                      <div className="h-3.5 w-10 bg-white/[0.06] rounded animate-pulse ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardProjectPage({ params }: Props) {
  const { projectId } = use(params)
  const cacheKey = `project-${projectId}`
  const cached = getCached<DBProjectWithRelations>(cacheKey)
  const [project, setProject] = useState<DBProjectWithRelations | null>(cached)
  const [loading, setLoading] = useState(!cached)
  const [notFound, setNotFound] = useState(false)

  // Always revalidate in background; only blocks on first load (no cache)
  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then(r => {
        if (r.status === 404) { invalidateCache(cacheKey); setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => {
        if (data) {
          setCached(cacheKey, data)
          setProject(data)
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, [projectId, cacheKey])

  if (notFound) return redirect('/dashboard/inicio')
  if (loading) return <ProjectSkeleton />
  if (!project) return redirect('/dashboard/inicio')

  return <DashboardProjectView project={project} />
}
