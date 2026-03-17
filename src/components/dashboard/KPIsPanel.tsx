'use client'

import type { DBProjectKPI } from '@/lib/db-types'

interface Props {
  kpis: DBProjectKPI[]
  loading: boolean
  onNew: () => void
  onEdit: (kpi: DBProjectKPI) => void
}

function pct(kpi: DBProjectKPI) {
  return kpi.target > 0 ? Math.min(Math.round((kpi.current / kpi.target) * 100), 100) : 0
}

function barCls(p: number) {
  if (p >= 80) return 'bg-pv-green'
  if (p >= 40) return 'bg-pv-accent'
  return 'bg-pv-amber'
}

function textCls(p: number) {
  if (p >= 80) return 'text-pv-green'
  if (p >= 40) return 'text-pv-accent'
  return 'text-pv-amber'
}

export default function KPIsPanel({ kpis, loading, onNew, onEdit }: Props) {
  const avgPct = kpis.length > 0
    ? Math.round(kpis.reduce((sum, k) => sum + pct(k), 0) / kpis.length)
    : 0

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold">KPIs del proyecto</h3>
          {kpis.length > 0 && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${textCls(avgPct)} bg-white/[0.06]`}>
              Promedio {avgPct}%
            </span>
          )}
        </div>
        <button onClick={onNew}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors">
          <span className="text-[12px] leading-none">+</span>
          Nuevo KPI
        </button>
      </div>

      {loading ? (
        <div className="p-3 flex flex-col gap-3">
          {[1, 2].map(i => <div key={i} className="h-12 bg-white/[0.04] rounded-lg animate-pulse" />)}
        </div>
      ) : kpis.length === 0 ? (
        <div className="px-4 py-6 text-center text-[11px] text-pv-gray/50 italic">
          Sin KPIs registrados. Agrega indicadores para medir el éxito del proyecto.
        </div>
      ) : (
        <div className="p-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {kpis.map(kpi => {
            const p = pct(kpi)
            return (
              <div key={kpi.id} onClick={() => onEdit(kpi)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 cursor-pointer hover:bg-white/[0.07] hover:border-white/15 transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[12px] font-bold text-white leading-snug">{kpi.title}</span>
                  <span className={`text-[13px] font-black flex-shrink-0 leading-none ${textCls(p)}`}>{p}%</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-1.5">
                  <div className={`h-full rounded-full transition-all ${barCls(p)}`} style={{ width: `${p}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-pv-gray/60">
                  <span>{kpi.current}{kpi.unit ? ` ${kpi.unit}` : ''}</span>
                  <span>Meta: {kpi.target}{kpi.unit ? ` ${kpi.unit}` : ''}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
