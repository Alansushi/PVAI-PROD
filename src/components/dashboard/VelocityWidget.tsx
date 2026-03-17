'use client'

import type { DBVelocityWeek } from '@/lib/db-types'

interface Props {
  weeks: DBVelocityWeek[]
  requiredPerWeek: number
  loading: boolean
}

export default function VelocityWidget({ weeks, requiredPerWeek, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.07]">
          <div className="h-3 w-40 bg-white/[0.06] rounded animate-pulse" />
        </div>
        <div className="p-3 h-[120px] bg-white/[0.02] animate-pulse" />
      </div>
    )
  }

  const maxCompleted = Math.max(...weeks.map(w => w.completed), requiredPerWeek, 1)
  const totalCompleted = weeks.reduce((s, w) => s + w.completed, 0)
  const lastWeek = weeks[weeks.length - 2]?.completed ?? 0
  const thisWeek = weeks[weeks.length - 1]?.completed ?? 0
  const trend = thisWeek > lastWeek ? 'up' : thisWeek < lastWeek ? 'down' : 'flat'
  const avgVelocity = weeks.length > 0 ? (totalCompleted / weeks.length).toFixed(1) : '0'

  const isInsufficient = requiredPerWeek > 0 && parseFloat(avgVelocity) < requiredPerWeek

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold">Velocidad del equipo</h3>
          {isInsufficient && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pv-amber/20 text-pv-amber">
              ⚠ Velocidad insuficiente
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-pv-gray">
          <span className={trend === 'up' ? 'text-pv-green' : trend === 'down' ? 'text-pv-red' : 'text-pv-gray'}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} Esta semana: {thisWeek}
          </span>
        </div>
      </div>

      <div className="px-4 py-3">
        {/* Stats row */}
        <div className="flex gap-4 mb-3 text-[10px]">
          <div>
            <span className="text-pv-gray">Promedio/semana </span>
            <span className="font-bold text-pv-accent">{avgVelocity}</span>
          </div>
          {requiredPerWeek > 0 && (
            <div>
              <span className="text-pv-gray">Necesario/semana </span>
              <span className={`font-bold ${isInsufficient ? 'text-pv-amber' : 'text-pv-green'}`}>{requiredPerWeek}</span>
            </div>
          )}
          <div>
            <span className="text-pv-gray">Total 6 sem. </span>
            <span className="font-bold text-white">{totalCompleted}</span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-1.5 h-[72px]">
          {weeks.map((week, i) => {
            const heightPct = maxCompleted > 0 ? (week.completed / maxCompleted) * 100 : 0
            const isLast = i === weeks.length - 1
            return (
              <div key={week.startDate} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[9px] text-pv-gray/60">{week.completed > 0 ? week.completed : ''}</span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-[3px] transition-all ${isLast ? 'bg-pv-accent/80' : 'bg-white/20'}`}
                    style={{ height: week.completed === 0 ? '2px' : `${Math.max(heightPct, 8)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Required/week dotted line overlay (text below) */}
        {requiredPerWeek > 0 && (
          <div className="mt-1 flex items-center gap-1.5 text-[9px] text-pv-amber/70">
            <div className="flex-1 border-t border-dashed border-pv-amber/40" />
            <span>meta: {requiredPerWeek}/sem</span>
          </div>
        )}

        {/* Week labels */}
        <div className="flex gap-1.5 mt-1">
          {weeks.map(week => (
            <div key={week.startDate} className="flex-1 text-center text-[8px] text-pv-gray/50 truncate">
              {week.weekLabel}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
