'use client'

import { useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import parse from 'html-react-parser'
import type { AgentCard as AgentCardType, AgentCardAction, AgentCardType as CardType } from '@/lib/types'
import { useRelativeTime } from '@/lib/hooks/useRelativeTime'

const ALLOWED_TAGS = ['br', 'strong', 'span', 'em', 'ul', 'li', 'p']
const ALLOWED_ATTR = ['class']

const TYPE_CONFIG: Record<CardType, { label: string; icon: string; border: string; bg: string; text: string }> = {
  alerta: {
    label: 'ALERTA',
    icon: '⚠',
    border: 'border-pv-red',
    bg: 'bg-pv-red/[0.07]',
    text: 'text-pv-red',
  },
  recomendacion: {
    label: 'RECOMENDACIÓN',
    icon: '✓',
    border: 'border-pv-green',
    bg: 'bg-pv-green/[0.07]',
    text: 'text-pv-green',
  },
  insight: {
    label: 'INSIGHT',
    icon: '💡',
    border: 'border-pv-accent',
    bg: 'bg-pv-accent/[0.07]',
    text: 'text-pv-accent',
  },
  pregunta: {
    label: 'PREGUNTA',
    icon: '💬',
    border: 'border-white/20',
    bg: 'bg-white/[0.04]',
    text: 'text-pv-gray',
  },
}

const ACTION_VARIANT_CLASSES: Record<AgentCardAction['variant'], (accentText: string, accentBorder: string) => string> = {
  primary: (accentText, accentBorder) =>
    `${accentText} ${accentBorder} border bg-white/[0.08] hover:bg-white/[0.14] transition-colors`,
  secondary: (accentText, accentBorder) =>
    `${accentText} ${accentBorder} border bg-transparent hover:bg-white/[0.06] transition-colors`,
  ghost: (accentText) =>
    `${accentText} border border-transparent hover:bg-white/[0.06] transition-colors`,
}

interface Props {
  card: AgentCardType
  onAction?: (action: AgentCardAction) => void
  onDismiss?: (id: string) => void
}

export default function AgentCard({ card, onAction, onDismiss }: Props) {
  const timeLabel = useRelativeTime(card.timestamp)
  const safeHtml = DOMPurify.sanitize(card.html, { ALLOWED_TAGS, ALLOWED_ATTR })
  const [showReasoning, setShowReasoning] = useState(false)

  // User messages: render exactly like AgentMessage.tsx
  if (card.role === 'user') {
    return (
      <div className="border-l-2 rounded-r-lg rounded-br-lg px-2.5 py-2 text-[11px] leading-relaxed text-[#C0D0E0] animate-msgIn border-pv-purple/80 bg-pv-purple/[0.12]">
        <div className="msg-content system">
          {parse(safeHtml)}
        </div>
        <div className="text-[9px] text-pv-gray mt-1">{timeLabel}</div>
      </div>
    )
  }

  // Agent messages: typed card
  const cfg = TYPE_CONFIG[card.cardType]
  const visibleActions = (card.actions ?? []).slice(0, 3)

  return (
    <div
      className={`border-l-2 rounded-r-lg rounded-br-lg text-[11px] leading-relaxed animate-msgIn
        ${cfg.border} ${cfg.bg}`}
    >
      {/* Header row */}
      <div className={`flex items-center justify-between px-2.5 pt-2 pb-1 ${cfg.text}`}>
        <span className="font-semibold tracking-wide text-[10px] flex items-center gap-1">
          <span>{cfg.icon}</span>
          <span>{cfg.label}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-pv-gray">{timeLabel}</span>
          {onDismiss && (
            <button
              onClick={() => onDismiss(card.id)}
              aria-label="Descartar"
              className="text-pv-gray hover:text-white/70 transition-colors leading-none text-[11px] px-0.5"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* HTML content */}
      <div className="px-2.5 pb-2 text-[#C0D0E0]">
        <div className="msg-content">
          {parse(safeHtml)}
        </div>
      </div>

      {/* Action buttons */}
      {visibleActions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2.5 pb-2.5">
          {visibleActions.map((action) => {
            const variantFn = ACTION_VARIANT_CLASSES[action.variant]
            const classes = variantFn(cfg.text, cfg.border)
            return (
              <button
                key={action.id}
                onClick={() => onAction?.(action)}
                className={`text-[10px] px-2 py-0.5 rounded ${classes}`}
              >
                {action.label}
              </button>
            )
          })}
        </div>
      )}

      {/* ¿Por qué? reasoning section */}
      {card.reasoning && (
        <div className="border-t border-white/[0.06] px-2.5 pb-2">
          <button
            onClick={() => setShowReasoning(v => !v)}
            className="text-[11px] text-pv-gray/70 hover:text-pv-gray mt-1.5 w-full text-left"
          >
            {showReasoning ? '▲ Ocultar justificación' : '▾ ¿Por qué esta sugerencia?'}
          </button>
          {showReasoning && (
            <p className="text-[12px] text-pv-gray/80 mt-1.5 leading-relaxed">
              {card.reasoning}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
