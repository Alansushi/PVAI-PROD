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
  const [chipsOpen, setChipsOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

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

  const panelStyle = { background: 'linear-gradient(180deg,rgba(15,45,74,0.5),rgba(12,31,53,0.8))' }

  const panelContent = (
    <>
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
        <button
          onClick={() => setChipsOpen(o => !o)}
          className="w-full text-left text-[9px] font-bold uppercase tracking-[0.5px] text-pv-purple px-3.5 pt-2.5 pb-1 flex items-center justify-between hover:text-pv-accent transition-colors"
        >
          ✦ Elige una acción
          <span className={`transition-transform duration-200 ${chipsOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {chipsOpen && <QuickChips onAsk={askAgent} />}
      </div>
    </>
  )

  return (
    <>
      {/* Desktop panel — hidden on mobile */}
      <div
        className="hidden lg:flex flex-col overflow-hidden border-l border-white/[0.06]"
        style={{ ...panelStyle, position: 'fixed', right: 0, top: 68, bottom: 0, width: 295 }}
      >
        {panelContent}
      </div>

      {/* Mobile floating button */}
      <button
        className="fixed bottom-4 right-4 z-[100] lg:hidden w-12 h-12 rounded-full bg-pv-accent flex items-center justify-center shadow-xl hover:bg-pv-accent/90 transition-colors"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir agente IA"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z" />
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
        </svg>
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[350] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div
            className="relative flex flex-col rounded-t-2xl overflow-hidden border-t border-white/[0.06]"
            style={{ ...panelStyle, height: '85vh' }}
          >
            {/* Close button */}
            <button
              className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-pv-gray hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar agente"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {panelContent}
          </div>
        </div>
      )}

      {/* Minuta Modal */}
      <DBMinutaModal
        open={minutaOpen}
        onClose={() => setMinutaOpen(false)}
        projectId={projectId}
      />
    </>
  )
}
