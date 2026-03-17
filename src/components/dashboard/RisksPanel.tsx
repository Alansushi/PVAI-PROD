'use client'

import type { DBProjectRisk } from '@/lib/db-types'

const PROB_CLS: Record<string, string> = {
  low:    'bg-pv-green/15 text-pv-green',
  medium: 'bg-pv-amber/15 text-pv-amber',
  high:   'bg-pv-red/15 text-pv-red',
}
const PROB_LABEL: Record<string, string> = { low: 'Baja', medium: 'Media', high: 'Alta' }

const STATUS_CLS: Record<string, string> = {
  open:      'bg-pv-red/15 text-pv-red',
  mitigated: 'bg-pv-amber/15 text-pv-amber',
  closed:    'bg-pv-green/15 text-pv-green',
}
const STATUS_LABEL: Record<string, string> = { open: 'Abierto', mitigated: 'Mitigado', closed: 'Cerrado' }

// Risk score heatmap: probability × impact
const SCORE: Record<string, number> = { low: 1, medium: 2, high: 3 }
function riskScore(r: DBProjectRisk) { return SCORE[r.probability] * SCORE[r.impact] }

interface Props {
  risks: DBProjectRisk[]
  loading: boolean
  onNew: () => void
  onEdit: (risk: DBProjectRisk) => void
}

export default function RisksPanel({ risks, loading, onNew, onEdit }: Props) {
  const sorted = [...risks].sort((a, b) => riskScore(b) - riskScore(a))
  const openRisks = risks.filter(r => r.status === 'open').length
  const highRisks = risks.filter(r => r.probability === 'high' || r.impact === 'high').length

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold">Risk Register</h3>
          {openRisks > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pv-red/15 text-pv-red">
              {openRisks} abierto{openRisks !== 1 ? 's' : ''}
            </span>
          )}
          {highRisks > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pv-red/20 text-pv-red border border-pv-red/20">
              ⚠ {highRisks} crítico{highRisks !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button onClick={onNew}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors">
          <span className="text-[12px] leading-none">+</span>
          Nuevo riesgo
        </button>
      </div>

      {loading ? (
        <div className="p-3 flex flex-col gap-2">
          {[1, 2].map(i => <div key={i} className="h-10 bg-white/[0.04] rounded-lg animate-pulse" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="px-4 py-6 text-center text-[11px] text-pv-gray/50 italic">
          Sin riesgos registrados. Agrega riesgos para hacer seguimiento proactivo del proyecto.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {sorted.map(risk => {
            const score = riskScore(risk)
            const scoreCls = score >= 6 ? 'text-pv-red' : score >= 3 ? 'text-pv-amber' : 'text-pv-green'
            return (
              <div key={risk.id} onClick={() => onEdit(risk)}
                className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-white/[0.03] transition-colors">
                {/* Score */}
                <div className={`text-[11px] font-black w-5 flex-shrink-0 mt-0.5 ${scoreCls}`}>{score}</div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-white leading-snug mb-1">{risk.title}</div>
                  {risk.description && (
                    <div className="text-[10px] text-pv-gray/70 leading-relaxed mb-1.5 line-clamp-2">{risk.description}</div>
                  )}
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${PROB_CLS[risk.probability]}`}>
                      Prob: {PROB_LABEL[risk.probability]}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${PROB_CLS[risk.impact]}`}>
                      Imp: {PROB_LABEL[risk.impact]}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_CLS[risk.status]}`}>
                      {STATUS_LABEL[risk.status]}
                    </span>
                    {risk.ownerName && (
                      <span className="text-[9px] text-pv-gray/60 ml-auto">{risk.ownerName}</span>
                    )}
                  </div>
                  {risk.mitigation && risk.status !== 'closed' && (
                    <div className="text-[10px] text-pv-accent/70 mt-1.5 flex items-start gap-1">
                      <span className="flex-shrink-0">→</span>
                      <span className="line-clamp-1">{risk.mitigation}</span>
                    </div>
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
