'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DBDeliverable } from '@/lib/db-types'
import { toLocalDate } from '@/lib/dates'
import { EmptyState } from '@/components/ui/EmptyState'

interface Props {
  deliverables: DBDeliverable[]
  range?: number
  centerOffset?: number
  onOpenTask: (d: DBDeliverable) => void
}

const WEEKDAY = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDotColor(d: DBDeliverable, colDate: Date): string {
  if (d.status === 'ok') return '#2A9B6F'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  if (colDate < today) return '#D94F4F'
  if (d.status === 'danger') return '#E09B3D'
  return '#2E8FC0'
}

export default function ProjectTimelineWidget({
  deliverables,
  range = 14,
  centerOffset = 7,
  onOpenTask,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [centerDate, setCenterDate] = useState<Date>(() => {
    const param = searchParams.get('center')
    if (param) {
      const d = new Date(param + 'T00:00:00')
      if (!isNaN(d.getTime())) return d
    }
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  })

  const actualToday = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const columns = useMemo(
    () => Array.from({ length: range }, (_, i) => addDays(centerDate, i - centerOffset)),
    [centerDate, range, centerOffset],
  )

  const byDate = useMemo(() => {
    const map: Record<string, DBDeliverable[]> = {}
    for (const col of columns) map[toKey(col)] = []
    for (const d of deliverables) {
      const date = toLocalDate(d.dueDate)
      if (!date) continue
      const key = toKey(date)
      if (key in map) map[key].push(d)
    }
    return map
  }, [deliverables, columns])

  const hasAny = useMemo(
    () => Object.values(byDate).some(arr => arr.length > 0),
    [byDate],
  )

  function navigate(delta: number) {
    const next = addDays(centerDate, delta)
    setCenterDate(next)
    const params = new URLSearchParams(searchParams.toString())
    params.set('center', toKey(next))
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  function goToday() {
    const t = new Date(); t.setHours(0, 0, 0, 0)
    setCenterDate(t)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('center')
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center justify-between">
        <h3 className="text-xs font-semibold">Próximos 14 días</h3>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => navigate(-7)}
            className="px-2 py-1 text-[14px] leading-none text-pv-gray hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-pv-accent rounded"
            aria-label="Semana anterior"
          >
            ‹
          </button>
          <button
            onClick={goToday}
            className="px-2 py-0.5 text-[9px] font-semibold text-pv-accent hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-pv-accent rounded"
          >
            Hoy
          </button>
          <button
            onClick={() => navigate(7)}
            className="px-2 py-1 text-[14px] leading-none text-pv-gray hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-pv-accent rounded"
            aria-label="Semana siguiente"
          >
            ›
          </button>
        </div>
      </div>

      {!hasAny ? (
        <EmptyState compact title="Sin entregables en este rango" />
      ) : (
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${range}, minmax(0, 1fr))`, minHeight: '100px' }}
        >
          {columns.map(col => {
            const key = toKey(col)
            const isToday = isSameDay(col, actualToday)
            const dots = byDate[key] ?? []
            const visible = dots.slice(0, 4)
            const overflow = dots.length - 4

            return (
              <div
                key={key}
                className="relative border-r border-white/[0.04] last:border-r-0 flex flex-col"
              >
                {isToday && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-pv-accent z-10 pointer-events-none" />
                )}
                <div className={`px-0.5 pt-1.5 pb-1 text-center border-b border-white/[0.04] ${
                  isToday ? 'bg-pv-accent/10' : ''
                }`}>
                  <div className={`text-[8px] font-bold uppercase ${
                    isToday ? 'text-pv-accent' : 'text-pv-gray/50'
                  }`}>
                    {WEEKDAY[col.getDay()]}
                  </div>
                  <div className={`text-[11px] font-bold ${
                    isToday ? 'text-pv-accent' : 'text-white/70'
                  }`}>
                    {col.getDate()}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 p-1">
                  {visible.map(d => {
                    const color = getDotColor(d, col)
                    const isOk = d.status === 'ok'
                    const tipLabel = [
                      d.name,
                      col.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
                      d.ownerName,
                    ].filter(Boolean).join(' · ')

                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => onOpenTask(d)}
                        title={tipLabel}
                        aria-label={tipLabel}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-transform hover:scale-125 focus-visible:ring-2 focus-visible:ring-pv-accent focus-visible:outline-none"
                        style={{ background: color, color: 'white' }}
                      >
                        {isOk ? '✓' : ''}
                      </button>
                    )
                  })}
                  {overflow > 0 && (
                    <span className="text-[8px] text-pv-gray/60 font-bold leading-none">
                      +{overflow}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
