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
