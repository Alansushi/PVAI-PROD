'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAgentContext } from '@/lib/context/AgentContext'
import { useAgent } from '@/lib/hooks/useAgent'
import type { AgentCardAction } from '@/lib/types'
import AgentCard from './AgentCard'
import DryRunModal from './DryRunModal'

export default function AgentMessages() {
  const { cards } = useAgentContext()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [dryRunAction, setDryRunAction] = useState<AgentCardAction | null>(null)

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
          onAction={setDryRunAction}
        />
      ))}
      <div ref={bottomRef} />
      <DryRunModal
        open={!!dryRunAction}
        action={dryRunAction}
        projectId={projectId}
        onConfirm={async () => {
          if (dryRunAction) await executeCardAction(dryRunAction)
        }}
        onClose={() => setDryRunAction(null)}
      />
    </div>
  )
}
