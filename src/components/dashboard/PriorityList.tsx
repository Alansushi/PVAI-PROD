'use client'

import { DBDeliverable } from '@/lib/db-types'
import { toLocalDate } from '@/lib/dates'
import { EmptyState } from '@/components/ui/EmptyState'

interface Props {
  deliverables: DBDeliverable[]
  onOpenTask: (d: DBDeliverable) => void
}

const STATUS_CONFIG = {
  ok:     { color: '#2A9B6F', bar: 100 },
  warn:   { color: '#E09B3D', bar: 50  },
  danger: { color: '#D94F4F', bar: 25  },
} as const

export default function PriorityList({ deliverables, onOpenTask }: Props) {
  if (deliverables.length === 0) {
    return <EmptyState title="Sin entregables" hint="Agrega tareas para comenzar." />
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sorted = [...deliverables].sort((a, b) => {
    const aDate = toLocalDate(a.dueDate)
    const bDate = toLocalDate(b.dueDate)
    if (!aDate && !bDate) return 0
    if (!aDate) return 1
    if (!bDate) return -1
    return aDate.getTime() - bDate.getTime()
  })

  return (
    <div className="flex flex-col divide-y divide-white/[0.06]">
      {sorted.map(d => {
        const dateVal = toLocalDate(d.dueDate)
        const isPast = dateVal ? dateVal < today : false
        const dateStr = dateVal
          ? dateVal.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
          : '—'
        const cfg = STATUS_CONFIG[d.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.warn

        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onOpenTask(d)}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] cursor-pointer transition-colors text-left w-full"
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: cfg.color }}
            />
            <span className="flex-1 text-[11px] font-medium text-white truncate min-w-0">
              {d.name}
            </span>
            <span className="text-[10px] text-pv-gray w-24 truncate text-right flex-shrink-0">
              {d.ownerName ?? '—'}
            </span>
            <span className={`text-[10px] font-semibold w-16 text-right flex-shrink-0 ${
              isPast && d.status !== 'ok' ? 'text-pv-red' : 'text-pv-gray'
            }`}>
              {dateStr}
            </span>
            <div className="w-16 h-1.5 bg-white/[0.08] rounded-full overflow-hidden flex-shrink-0">
              <div
                className="h-full rounded-full"
                style={{ width: `${cfg.bar}%`, background: cfg.color }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
