'use client'

import { useRelativeTime } from '@/lib/hooks/useRelativeTime'

interface Props {
  status: 'idle' | 'thinking' | 'stale'
  lastRefreshed: Date | null
  onRefresh: () => void
}

export default function AgentStatusBar({ status, lastRefreshed, onRefresh }: Props) {
  const refreshedLabel = useRelativeTime(lastRefreshed)

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
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-pv-teal">
      <span className="w-1.5 h-1.5 rounded-full bg-pv-teal" />
      <span>
        Listo · {refreshedLabel || 'recién'}
      </span>
    </span>
  )
}
