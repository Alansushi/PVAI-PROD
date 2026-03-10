import type { GanttRow, GanttDeadline } from '@/lib/types'

const TOTAL_DAYS = 35
const TODAY_PCT = (9 / TOTAL_DAYS * 100).toFixed(1)
const LABELS = ['9 Mar', '16 Mar', '23 Mar', '30 Mar', '6 Abr']

const BAR_CLS: Record<string, string> = {
  ok:     'bg-pv-green/85 text-white',
  prog:   'bg-pv-accent/85 text-white',
  warn:   'bg-pv-amber/90 text-black',
  danger: 'bg-pv-red/90 text-white',
}

interface Props {
  title: string
  range: string
  rows: GanttRow[]
  deadline: GanttDeadline
}

export default function GanttChart({ title, range, rows, deadline }: Props) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.07] flex justify-between items-center">
        <h3 className="text-xs font-semibold">{title}</h3>
        <span className="text-[10px] text-pv-gray">{range}</span>
      </div>
      <div className="max-h-[220px] overflow-y-auto">
        {/* Header row */}
        <div className="grid sticky top-0 z-[5] bg-black/10 border-b border-white/[0.07]" style={{ gridTemplateColumns: '155px 1fr' }}>
          <div className="px-4 py-2 text-[9px] font-bold uppercase tracking-[0.8px] text-pv-gray">Entregable</div>
          <div className="flex">
            {LABELS.map(l => (
              <div key={l} className="flex-1 text-[8px] font-bold uppercase text-pv-gray text-center py-2">{l}</div>
            ))}
          </div>
        </div>
        {rows.map((r, i) => {
          const left = (r.start / TOTAL_DAYS * 100).toFixed(1)
          const width = Math.max(r.dur / TOTAL_DAYS * 100, 3).toFixed(1)
          return (
            <div
              key={i}
              className="grid border-b border-white/[0.04] last:border-b-0 items-center min-h-[34px] hover:bg-white/[0.02]"
              style={{ gridTemplateColumns: '155px 1fr' }}
            >
              <div className="px-4 py-1.5 text-[11px] font-medium text-pv-white overflow-hidden text-ellipsis whitespace-nowrap">
                {r.label}
                <small className="block text-[9px] text-pv-gray mt-px">{r.owner}</small>
              </div>
              <div className="relative h-[34px]">
                {/* Today line */}
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-pv-accent/70 z-[3]"
                  style={{ left: `${TODAY_PCT}%` }}
                >
                  <span className="absolute top-0.5 left-0.5 text-[7px] font-bold text-pv-accent whitespace-nowrap">HOY</span>
                </div>
                {/* Deadline line */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-pv-red/85 z-[3]"
                  style={{ left: `${deadline.pct}%` }}
                >
                  <span className="absolute top-0.5 right-0.5 text-[7px] font-bold text-pv-red whitespace-nowrap">{deadline.label}</span>
                </div>
                {/* Bar */}
                <div
                  className={`absolute h-[15px] top-1/2 -translate-y-1/2 rounded-[4px] text-[8px] font-bold flex items-center px-1.5 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer transition-all hover:brightness-125 hover:h-[17px] ${BAR_CLS[r.status]}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={r.label}
                >
                  {parseFloat(width) > 7 ? r.label : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
