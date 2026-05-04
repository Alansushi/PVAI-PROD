'use client'

import { useState, useCallback } from 'react'
import AgentCard from '@/components/agent/AgentCard'
import DryRunModal from '@/components/agent/DryRunModal'
import type { AgentCard as AgentCardType, AgentCardAction } from '@/lib/types'

export default function PortfolioInsights() {
  const [cards, setCards] = useState<AgentCardType[]>([])
  const [loading, setLoading] = useState(false)
  const [dryRun, setDryRun] = useState<{ action: AgentCardAction; cardId: string } | null>(null)

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Dame un análisis del portafolio: proyectos críticos, capacidad del equipo y próximas prioridades.',
          type: 'resumen_ejecutivo',
          view: 'inicio',
        }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.card) {
        setCards(prev =>
          [{ ...data.card, id: crypto.randomUUID() } as AgentCardType, ...prev].slice(0, 3)
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDismiss = (id: string) => setCards(prev => prev.filter(c => c.id !== id))

  const handleAction = (action: AgentCardAction, cardId: string) => {
    if (action.actionType === 'dismiss') {
      handleDismiss(cardId)
      return
    }
    setDryRun({ action, cardId })
  }

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-pv-gray uppercase tracking-wide">
          Análisis del portafolio
        </h2>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1 text-xs text-pv-accent border border-pv-accent/30 rounded-md hover:bg-pv-accent/10 transition-colors disabled:opacity-50"
        >
          <span className={loading ? 'animate-spin' : ''}>↻</span>
          {loading ? 'Analizando…' : 'Actualizar análisis'}
        </button>
      </div>

      {cards.length === 0 && !loading && (
        <p className="text-xs text-pv-gray/60 italic">
          Pulsa &quot;Actualizar análisis&quot; para obtener insights del portafolio.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {cards.map(card => (
          <AgentCard
            key={card.id}
            card={card}
            onAction={action => handleAction(action, card.id)}
            onDismiss={handleDismiss}
          />
        ))}
      </div>

      <DryRunModal
        open={dryRun !== null}
        action={dryRun?.action ?? null}
        projectId=""
        onConfirm={() => {
          if (dryRun) handleDismiss(dryRun.cardId)
          setDryRun(null)
        }}
        onClose={() => setDryRun(null)}
      />
    </section>
  )
}
