'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAgentContext } from '@/lib/context/AgentContext'
import { useAgent } from '@/lib/hooks/useAgent'
import type { AgentCardAction } from '@/lib/types'
import AgentCard from './AgentCard'
import DryRunModal from './DryRunModal'

interface DryRunState {
  action: AgentCardAction
  cardId: string
  isDbCard: boolean
}

export default function AgentMessages() {
  const { cards } = useAgentContext()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [dryRunState, setDryRunState] = useState<DryRunState | null>(null)

  const params = useParams()
  const projectId = (params?.projectId as string) ?? ''
  const { executeCardAction, dismissCardServer } = useAgent(projectId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [cards])

  const visible = cards.filter(c => !c.dismissed)
  const dismissed = cards.filter(c => c.dismissed)

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
      {visible.map(card => (
        <AgentCard
          key={card.id}
          card={card}
          onDismiss={dismissCardServer}
          onAction={(action) => setDryRunState({
            action,
            cardId: card.id,
            isDbCard: !!card.isDbCard,
          })}
        />
      ))}
      <div ref={bottomRef} />
      {dismissed.length > 0 && (
        <details className="mt-2">
          <summary className="text-[10px] text-pv-gray/50 cursor-pointer select-none hover:text-pv-gray transition-colors">
            {dismissed.length} descartadas
          </summary>
          <div className="mt-1.5 flex flex-col gap-1.5 opacity-50">
            {dismissed.map(card => (
              <div key={card.id} className="text-[10px] text-pv-gray px-2 py-1 border border-white/[0.04] rounded">
                <span className="capitalize">{card.cardType}</span>
                {card.dismissReason && <span className="ml-1 text-pv-gray/60">· {card.dismissReason}</span>}
              </div>
            ))}
          </div>
        </details>
      )}
      <DryRunModal
        open={!!dryRunState}
        action={dryRunState?.action ?? null}
        projectId={projectId}
        onConfirm={async () => {
          if (dryRunState) {
            const ok = await executeCardAction(dryRunState.action, dryRunState.cardId, dryRunState.isDbCard)
            if (ok) {
              try {
                const CHECKED_KEY = 'pvai_onboarding_done_checked'
                const checked = JSON.parse(localStorage.getItem(CHECKED_KEY) ?? '{}') as Record<string, boolean>
                if (!checked['agent_cta']) {
                  checked['agent_cta'] = true
                  localStorage.setItem(CHECKED_KEY, JSON.stringify(checked))
                  window.dispatchEvent(new StorageEvent('storage', {
                    key: CHECKED_KEY,
                    newValue: JSON.stringify(checked),
                  }))
                }
              } catch { /* ignore */ }
            }
          }
        }}
        onClose={() => setDryRunState(null)}
      />
    </div>
  )
}
