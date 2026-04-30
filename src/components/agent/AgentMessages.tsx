'use client'
import { useEffect, useRef } from 'react'
import { useAgentContext } from '@/lib/context/AgentContext'
import AgentCard from './AgentCard'

export default function AgentMessages() {
  const { cards, dismissCard } = useAgentContext()
  const bottomRef = useRef<HTMLDivElement>(null)

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
          onDismiss={dismissCard}
          onAction={() => {}}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
