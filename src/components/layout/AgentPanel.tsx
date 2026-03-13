'use client'

import { useParams } from 'next/navigation'
import { useAgentContext } from '@/lib/context/AgentContext'
import { useAgent } from '@/lib/hooks/useAgent'
import AgentMessages from '@/components/agent/AgentMessages'
import TypingIndicator from '@/components/agent/TypingIndicator'
import QuickChips from '@/components/agent/QuickChips'
import { useState, useEffect } from 'react'
import DBMinutaModal from '@/components/dashboard/DBMinutaModal'

function formatRelativeTime(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return `hace ${Math.floor(diff / 86400)} días`
}

export default function AgentPanel() {
  const params = useParams()
  const projectId = (params?.projectId as string) ?? 'pedregal'
  const { messages, isTyping, isProcessing, processingText, initMessages } = useAgentContext()
  const { askAgent } = useAgent(projectId)
  const [minutaOpen, setMinutaOpen] = useState(false)

  useEffect(() => {
    if (messages.length > 0) return // don't overwrite active session
    fetch(`/api/projects/${projectId}/agent-messages`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.messages?.length) return
        const formatted = data.messages.map((m: { id: string; role: string; content: string; createdAt: string }) => ({
          id: m.id,
          role: m.role as 'agent' | 'user',
          html: m.content,
          time: formatRelativeTime(m.createdAt),
        }))
        initMessages(formatted)
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  return (
    <div
      className="border-l border-white/[0.06] flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(180deg,rgba(15,45,74,0.5),rgba(12,31,53,0.8))', position: 'fixed', right: 0, top: 68, bottom: 0, width: 295 }}
    >
      {/* Header */}
      <div className="px-3.5 py-3 border-b border-pv-accent/15 flex items-center gap-1.5 flex-shrink-0">
        <div className="w-[7px] h-[7px] bg-pv-teal rounded-full animate-pulse" />
        <h3 className="text-xs font-bold text-pv-accent flex-1">Agente IA · Proyecto Vivo</h3>
        <div className="text-[9px] text-pv-teal font-semibold bg-pv-teal/10 px-1.5 py-0.5 rounded-lg">En línea</div>
      </div>

      {/* Messages */}
      <AgentMessages />

      {/* Typing */}
      {isTyping && <TypingIndicator />}

      {/* Processing */}
      {isProcessing && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-pv-purple/10 border-t border-pv-purple/20 text-[10px] text-[#B89EE8] font-semibold flex-shrink-0">
          <div className="w-3 h-3 border-2 border-pv-purple/30 border-t-[#B89EE8] rounded-full animate-spin flex-shrink-0" />
          {processingText}
        </div>
      )}

      {/* Chips */}
      <div className="flex-shrink-0 border-t border-white/[0.07]">
        <div className="text-[9px] font-bold uppercase tracking-[0.5px] text-pv-purple px-3.5 pt-2.5 pb-1">
          ✦ Elige una acción
        </div>
        <QuickChips onAsk={askAgent} onMinuta={() => setMinutaOpen(true)} />
      </div>

      {/* Minuta Modal */}
      <DBMinutaModal
        open={minutaOpen}
        onClose={() => setMinutaOpen(false)}
        projectId={projectId}
      />
    </div>
  )
}
