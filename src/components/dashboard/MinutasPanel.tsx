'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { DBProcessedMinutaListItem } from '@/lib/db-types'

interface Props {
  projectId: string
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return `hace ${Math.floor(diff / 86400)} días`
}

export default function MinutasPanel({ projectId }: Props) {
  const router = useRouter()
  const [minutas, setMinutas] = useState<DBProcessedMinutaListItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/minutas`)
      .then(r => r.ok ? r.json() : [])
      .then((data: DBProcessedMinutaListItem[]) => {
        setMinutas(data)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [projectId])

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.07]">
        <h3 className="text-xs font-semibold">✦ Minutas procesadas</h3>
      </div>

      {!loaded ? (
        <div className="flex flex-col divide-y divide-white/[0.04]">
          {[1, 2, 3].map(i => (
            <div key={i} className="px-4 py-2.5 flex items-center gap-2.5">
              <div className="flex-1 flex flex-col gap-1">
                <div className="h-2.5 w-3/4 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-2 w-1/3 bg-white/[0.06] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : minutas.length === 0 ? (
        <div className="px-4 py-5 text-[11px] text-pv-gray/60 text-center">
          Aún no hay minutas procesadas
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.04]">
          {minutas.map(m => (
            <div
              key={m.id}
              onClick={() => router.push(`/dashboard/${projectId}/minutas/${m.id}`)}
              className="px-4 py-2.5 flex items-center gap-2.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">
                  {m.title.length > 55 ? m.title.slice(0, 55) + '…' : m.title}
                </div>
                <div className="text-[9px] text-pv-gray/60 mt-0.5 flex items-center gap-1.5">
                  {m.userName && <span>{m.userName}</span>}
                  {m.userName && <span>·</span>}
                  <span>{timeAgo(m.createdAt)}</span>
                </div>
              </div>
              <div className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pv-accent/15 text-pv-accent flex-shrink-0">
                {m.actionsCount} acc.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
