'use client'

import { useEffect, useRef, useState } from 'react'
import { useAgentContext } from '@/lib/context/AgentContext'
import { useAgent } from '@/lib/hooks/useAgent'
import type { AgentCardAction } from '@/lib/types'
import AgentCard from './AgentCard'
import AgentComposer from './AgentComposer'
import DryRunModal from './DryRunModal'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
}

export default function AgentChatModal({ open, onClose, projectId }: Props) {
  const { cards } = useAgentContext()
  const { sendFree, askAgent, executeCardAction, dismissCardServer } = useAgent(projectId)
  const [dryRunState, setDryRunState] = useState<{ action: AgentCardAction; cardId: string; isDbCard: boolean } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const visible = cards.filter(c => !c.dismissed)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [open, cards])

  // Close on ESC
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative flex flex-col rounded-2xl border border-pv-accent/30 shadow-2xl w-full max-w-lg"
        style={{
          background: 'linear-gradient(180deg, #0D2035 0%, #091625 100%)',
          maxHeight: 'calc(100vh - 80px)',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-pv-accent/20 flex items-center gap-2 flex-shrink-0">
          <span className="text-pv-accent text-xs">💬</span>
          <h2 className="text-[13px] font-bold text-white flex-1">Chat con Agente IA</h2>
          <span className="text-[9px] text-pv-gray/50 mr-2">ESC para cerrar</span>
          <button
            onClick={onClose}
            className="text-pv-gray hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-0">
          {visible.length === 0 && (
            <p className="text-[12px] text-pv-gray text-center mt-8">
              Todavía no hay mensajes. Escribe algo abajo para empezar.
            </p>
          )}
          {visible.map(card => (
            <AgentCard
              key={card.id}
              card={card}
              onDismiss={dismissCardServer}
              onAction={(action) => setDryRunState({ action, cardId: card.id, isDbCard: !!card.isDbCard })}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <AgentComposer
          onSend={(text) => sendFree(text, [])}
          onChip={askAgent}
        />
      </div>

      <DryRunModal
        open={!!dryRunState}
        action={dryRunState?.action ?? null}
        projectId={projectId}
        onConfirm={async () => {
          if (dryRunState) {
            await executeCardAction(dryRunState.action, dryRunState.cardId, dryRunState.isDbCard)
          }
        }}
        onClose={() => setDryRunState(null)}
      />
    </div>
  )
}
