import type { AgentCard, AgentCardAction, AgentCardType } from '@/lib/types'

const DEFAULT_ACTIONS: Record<AgentCardType, AgentCardAction[]> = {
  alerta: [
    { id: 'default-apply', label: 'Marcar como tratado', variant: 'primary', actionType: 'note' },
    { id: 'default-detail', label: 'Ver detalle', variant: 'secondary', actionType: 'navigate' },
    { id: 'default-dismiss', label: 'Descartar', variant: 'ghost', actionType: 'dismiss' },
  ],
  recomendacion: [
    { id: 'default-apply', label: 'Marcar como tratado', variant: 'primary', actionType: 'note' },
    { id: 'default-detail', label: 'Ver detalle', variant: 'secondary', actionType: 'navigate' },
    { id: 'default-dismiss', label: 'Descartar', variant: 'ghost', actionType: 'dismiss' },
  ],
  insight: [
    { id: 'default-detail', label: 'Ver detalle', variant: 'secondary', actionType: 'navigate' },
    { id: 'default-dismiss', label: 'Descartar', variant: 'ghost', actionType: 'dismiss' },
  ],
  pregunta: [
    { id: 'default-reply', label: 'Responder', variant: 'primary', actionType: 'note' },
    { id: 'default-dismiss', label: 'Descartar', variant: 'ghost', actionType: 'dismiss' },
  ],
}

/** Ensures every agent card has at least the baseline CTAs for its type.
 *  AI-generated actions take priority; defaults fill gaps up to 3 total. */
export function ensureCardActions(card: AgentCard): AgentCard {
  if (card.role === 'user') return card
  const existing = card.actions ?? []
  if (existing.length >= 3) return card
  const defaults = DEFAULT_ACTIONS[card.cardType] ?? []
  const existingTypes = new Set(existing.map(a => a.actionType))
  const toAdd = defaults.filter(d => !existingTypes.has(d.actionType))
  return { ...card, actions: [...existing, ...toAdd].slice(0, 3) }
}
