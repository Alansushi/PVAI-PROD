'use client'

import { useMemo } from 'react'
import type { DBProjectMember, DBDeliverable } from '@/lib/db-types'

interface Props {
  members: DBProjectMember[]
  deliverables: DBDeliverable[]
  loading: boolean
}

const LOAD_CLS = {
  low:    { bar: 'bg-pv-green',  badge: 'bg-pv-green/15 text-pv-green',  label: 'Libre',        width: 'w-1/4'  },
  medium: { bar: 'bg-pv-amber',  badge: 'bg-pv-amber/15 text-pv-amber',  label: 'Cargado',      width: 'w-3/5'  },
  high:   { bar: 'bg-pv-red',    badge: 'bg-pv-red/15 text-pv-red',      label: 'Sobrecargado', width: 'w-full' },
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}`
}

export default function CapacityWidget({ members, deliverables, loading }: Props) {
  const capacityData = useMemo(() => {
    return members.map(member => {
      const active = deliverables.filter(
        d => d.status !== 'ok' && (d.ownerName === member.name || (d.ownerId && d.ownerId === member.userId)),
      )
      const nextDue = active
        .filter(d => d.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]?.dueDate ?? null
      const load: 'low' | 'medium' | 'high' =
        active.length === 0 ? 'low' : active.length <= 3 ? 'medium' : 'high'
      return { member, activeCount: active.length, nextDue, load }
    })
  }, [members, deliverables])

  const totalActive = capacityData.reduce((s, d) => s + d.activeCount, 0)

  if (loading) {
    return (
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.07]">
          <div className="h-3 w-48 bg-white/[0.06] rounded animate-pulse" />
        </div>
        <div className="flex flex-col gap-2 p-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-white/[0.04] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center justify-between">
        <h3 className="text-xs font-semibold">Capacidad del Equipo</h3>
        {totalActive > 0 && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.08] text-pv-gray">
            {totalActive} activas en total
          </span>
        )}
      </div>

      {members.length === 0 ? (
        <div className="px-4 py-6 text-center text-[11px] text-pv-gray/60">
          Sin miembros asignados
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.04]">
          {capacityData.map(({ member, activeCount, nextDue, load }) => {
            const cls = LOAD_CLS[load]
            return (
              <div key={member.id} className="px-4 py-2.5 flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                  style={{ background: member.color }}
                >
                  {member.initials}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-white truncate">{member.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cls.badge}`}>
                      {cls.label}
                    </span>
                    {nextDue && (
                      <span className="text-[9px] text-pv-gray/60 ml-auto flex-shrink-0">
                        vence {fmtDate(nextDue)}
                      </span>
                    )}
                  </div>
                  {/* Load bar */}
                  <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${cls.bar} ${cls.width}`} />
                  </div>
                </div>

                {/* Count */}
                <span className="text-[11px] font-bold text-white/80 flex-shrink-0 w-5 text-right">
                  {activeCount}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
