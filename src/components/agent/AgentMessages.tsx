'use client'

import { useEffect, useRef } from 'react'
import { useAgentContext } from '@/lib/context/AgentContext'
import AgentMessage from './AgentMessage'

export default function AgentMessages() {
  const { messages } = useAgentContext()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
      {messages.map(msg => (
        <AgentMessage key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
