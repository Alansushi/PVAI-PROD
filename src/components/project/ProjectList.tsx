'use client'

import Link from 'next/link'
import type { Project } from '@/lib/types'

interface Props {
  projects: Project[]
  activeProjectId: string
}

const BADGE = {
  ok:     { cls: 'bg-pv-green/18 text-pv-green',  label: '✓ Al corriente' },
  warn:   { cls: 'bg-pv-amber/18 text-pv-amber',  label: '⚠️ En riesgo' },
  danger: { cls: 'bg-pv-red/18 text-pv-red',      label: '🔴 Cobro vencido' },
}

const BAR_COLOR = { ok: 'bg-pv-green', warn: 'bg-pv-amber', danger: 'bg-pv-red' }

export default function ProjectList({ projects, activeProjectId }: Props) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.07] flex justify-between items-center">
        <h3 className="text-xs font-semibold">Proyectos del despacho</h3>
        <span className="text-[10px] text-pv-gray cursor-pointer hover:text-pv-accent">Ver todos →</span>
      </div>
      {projects.map(p => {
        const progress = parseInt(p.kpis.k3v)
        const badge = BADGE[p.dotStatus]
        return (
          <Link
            key={p.id}
            href={`/demo/${p.id}`}
            className={`px-4 py-2.5 border-b border-white/[0.05] last:border-b-0 cursor-pointer transition-all no-underline text-pv-white
              grid items-center gap-2.5 hover:bg-pv-accent/7
              ${p.id === activeProjectId ? 'bg-pv-accent/10 border-l-2 border-pv-accent' : ''}
            `}
            style={{ gridTemplateColumns: '1fr 75px auto' }}
          >
            <div>
              <div className="text-xs font-semibold">{p.title}</div>
              <div className="text-[10px] text-pv-gray mt-0.5">{p.type}</div>
            </div>
            <div>
              <div className="text-[10px] text-pv-gray text-right mb-1">{p.kpis.k3v}</div>
              <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${BAR_COLOR[p.dotStatus]}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg whitespace-nowrap ${badge.cls}`}>
              {badge.label}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
