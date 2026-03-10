'use client'

import type { Project } from '@/lib/types'
import { ALL_MEMBERS } from '@/lib/data/members'

interface AdminOverviewProps {
  projects: Project[]
  activeProjectId: string
}

const STATUS_META = {
  ok:     { dot: 'bg-[#2A9B6F]', text: 'text-[#2A9B6F]', badgeBg: 'bg-[#2A9B6F]/10', badgeBorder: 'border-[#2A9B6F]/30', label: '✓ Al corriente',    bar: 'bg-[#2A9B6F]' },
  warn:   { dot: 'bg-[#E09B3D]', text: 'text-[#E09B3D]', badgeBg: 'bg-[#E09B3D]/10', badgeBorder: 'border-[#E09B3D]/30', label: '⚠ En riesgo',       bar: 'bg-[#E09B3D]' },
  danger: { dot: 'bg-[#D94F4F]', text: 'text-[#D94F4F]', badgeBg: 'bg-[#D94F4F]/10', badgeBorder: 'border-[#D94F4F]/30', label: '● Cobro vencido',   bar: 'bg-[#D94F4F]' },
}

export default function AdminOverview({ projects, activeProjectId }: AdminOverviewProps) {
  const total  = projects.length
  const okCnt  = projects.filter(p => p.dotStatus === 'ok').length
  const warnCnt   = projects.filter(p => p.dotStatus === 'warn').length
  const dangerCnt = projects.filter(p => p.dotStatus === 'danger').length

  const stats = [
    { label: 'Total proyectos', value: total,    color: 'text-pv-accent',    dot: 'bg-pv-accent' },
    { label: 'Al corriente',    value: okCnt,     color: 'text-[#2A9B6F]',   dot: 'bg-[#2A9B6F]' },
    { label: 'En seguimiento',  value: warnCnt,   color: 'text-[#E09B3D]',   dot: 'bg-[#E09B3D]' },
    { label: 'Cobro vencido',   value: dangerCnt, color: 'text-[#D94F4F]',   dot: 'bg-[#D94F4F]' },
  ]

  return (
    <section className="flex flex-col gap-3">
      {/* Header */}
      <div>
        <h2 className="font-display text-[15px] font-bold text-white">Vista del despacho</h2>
        <p className="text-[11px] text-pv-gray mt-px">{total} proyectos · Resumen general</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="relative bg-white/5 border border-white/[0.08] rounded-xl p-4">
            <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${s.dot}`} />
            <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-pv-gray mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Projects table */}
      <div className="bg-white/5 border border-white/[0.08] rounded-xl overflow-hidden">
        {projects.map((p, i) => {
          const isActive = p.id === activeProjectId
          const sm = STATUS_META[p.dotStatus]
          const pct = parseInt(p.kpis.k3v) || 0
          const k1pColor = p.dotStatus === 'danger' ? 'text-[#D94F4F]' : p.dotStatus === 'warn' ? 'text-[#E09B3D]' : 'text-pv-gray'

          return (
            <div
              key={p.id}
              className={[
                'flex items-center gap-4 px-4 py-3',
                i < projects.length - 1 ? 'border-b border-white/[0.06]' : '',
                isActive ? 'bg-[#2E8FC0]/5 border-l-2 border-l-[#2E8FC0]' : '',
              ].join(' ')}
            >
              {/* Status dot */}
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sm.dot}`} />

              {/* Name + type */}
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-white truncate">{p.title}</div>
                <div className="text-[10px] text-pv-gray">{p.type}</div>
              </div>

              {/* Progress bar */}
              <div className="w-28 flex-shrink-0">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-pv-gray">Avance</span>
                  <span className="text-[10px] text-white font-medium">{pct}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${sm.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Next payment */}
              <div className="w-28 flex-shrink-0 text-right">
                <div className="text-[12px] font-semibold text-white">{p.kpis.k1v}</div>
                <div className={`text-[10px] ${k1pColor}`}>{p.kpis.k1p}</div>
              </div>

              {/* Members avatars */}
              <div className="flex -space-x-1.5 flex-shrink-0">
                {p.members.slice(0, 3).map(mid => {
                  const m = ALL_MEMBERS[mid]
                  if (!m) return null
                  return (
                    <div
                      key={mid}
                      title={m.name}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-[#0C1F35] flex-shrink-0"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.initials}
                    </div>
                  )
                })}
              </div>

              {/* Status badge */}
              <div className={`flex-shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${sm.badgeBg} ${sm.badgeBorder} ${sm.text}`}>
                {sm.label}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
