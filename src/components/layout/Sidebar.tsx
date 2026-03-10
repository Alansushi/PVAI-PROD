'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Project } from '@/lib/types'
import { useAgent } from '@/lib/hooks/useAgent'
import { useParams } from 'next/navigation'
import MinutaModal from '@/components/modals/MinutaModal'
import { useState } from 'react'

const DOT_COLORS = {
  ok:     'bg-pv-green',
  warn:   'bg-pv-amber',
  danger: 'bg-pv-red',
}

interface Props {
  projects: Project[]
}

export default function Sidebar({ projects }: Props) {
  const pathname = usePathname()
  const params = useParams()
  const projectId = (params?.projectId as string) ?? 'pedregal'
  const { generateDoc } = useAgent(projectId)
  const [minutaOpen, setMinutaOpen] = useState(false)

  const isDashboard = pathname === '/demo/dashboard'

  return (
    <>
      <aside className="bg-black/20 border-r border-white/[0.06] flex flex-col overflow-y-auto">
        {/* Vista general */}
        <div className="px-3.5 pt-[18px] pb-1.5 text-[9px] font-bold uppercase tracking-[1px] text-pv-gray">
          General
        </div>
        <Link
          href="/demo/dashboard"
          className={`px-3.5 py-2 flex items-center gap-2.5 border-l-[3px] transition-all text-pv-white no-underline
            ${isDashboard
              ? 'bg-pv-accent/10 border-pv-accent'
              : 'border-transparent hover:bg-white/[0.04]'
            }`}
        >
          <span className="text-[14px] flex-shrink-0">🏢</span>
          <div>
            <div className="text-xs font-semibold">Vista del despacho</div>
            <div className="text-[10px] text-pv-gray">Director / Socios</div>
          </div>
        </Link>

        <div className="h-px bg-white/[0.06] mx-3.5 my-1.5" />

        <div className="px-3.5 pt-1 pb-1.5 text-[9px] font-bold uppercase tracking-[1px] text-pv-gray">
          Proyectos activos
        </div>

        {projects.map(p => {
          const active = pathname === `/demo/${p.id}`
          return (
            <Link
              key={p.id}
              href={`/demo/${p.id}`}
              className={`px-3.5 py-2 flex items-center gap-2.5 border-l-[3px] transition-all text-pv-white no-underline
                ${active
                  ? 'bg-pv-accent/10 border-pv-accent'
                  : 'border-transparent hover:bg-white/[0.04]'
                }`}
            >
              <div className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${DOT_COLORS[p.dotStatus]}`} />
              <div>
                <div className="text-xs font-semibold">{p.title}</div>
                <div className="text-[10px] text-pv-gray">{p.type}</div>
              </div>
            </Link>
          )
        })}

        <div className="h-px bg-white/[0.06] mx-3.5 my-1.5" />

        <div className="px-3.5 pt-2 pb-1.5 text-[9px] font-bold uppercase tracking-[1px] text-pv-gray">
          Acciones rápidas
        </div>

        <button
          onClick={() => setMinutaOpen(true)}
          className="px-3.5 py-2 flex items-center gap-2.5 text-xs text-pv-gray hover:text-pv-white hover:bg-white/[0.04] transition-all text-left w-full border-none bg-transparent font-sans cursor-pointer"
        >
          <span>📋</span> Procesar minuta
        </button>
        <button
          onClick={() => {}}
          className="px-3.5 py-2 flex items-center gap-2.5 text-xs text-pv-gray hover:text-pv-white hover:bg-white/[0.04] transition-all text-left w-full border-none bg-transparent font-sans cursor-pointer"
        >
          <span>📐</span> Subir planos
        </button>
        <button
          onClick={generateDoc}
          className="px-3.5 py-2 flex items-center gap-2.5 text-xs text-pv-gray hover:text-pv-white hover:bg-white/[0.04] transition-all text-left w-full border-none bg-transparent font-sans cursor-pointer"
        >
          <span>📄</span> Generar memoria
        </button>
        <button
          onClick={() => {}}
          className="px-3.5 py-2 flex items-center gap-2.5 text-xs text-pv-gray hover:text-pv-white hover:bg-white/[0.04] transition-all text-left w-full border-none bg-transparent font-sans cursor-pointer"
        >
          <span>📊</span> Reporte de avance
        </button>
      </aside>

      <MinutaModal
        open={minutaOpen}
        onClose={() => setMinutaOpen(false)}
        projectId={projectId}
      />
    </>
  )
}
