'use client'

function fmtRelative(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'recién'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return `hace ${Math.floor(diff / 86400)} d`
}

interface Props {
  status: 'idle' | 'thinking' | 'stale'
  lastRefreshed: Date | null
  onRefresh: () => void
}

export default function AgentStatusBar({ status, lastRefreshed, onRefresh }: Props) {
  if (status === 'thinking') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-pv-teal">
        <span className="w-1.5 h-1.5 rounded-full bg-pv-teal animate-pulse" />
        <span className="animate-pulse">Pensando…</span>
      </span>
    )
  }

  if (status === 'stale') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-pv-amber">
        <span className="w-1.5 h-1.5 rounded-full bg-pv-amber" />
        <span>Desactualizado</span>
        <button
          onClick={onRefresh}
          aria-label="Actualizar"
          className="text-pv-amber hover:text-white/80 transition-colors ml-0.5 leading-none"
        >
          ↻
        </button>
      </span>
    )
  }

  // idle
  const timeLabel = lastRefreshed ? fmtRelative(lastRefreshed) : 'recién'
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-pv-teal">
      <span className="w-1.5 h-1.5 rounded-full bg-pv-teal" />
      <span>
        Listo · {timeLabel}
      </span>
    </span>
  )
}
