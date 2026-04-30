'use client'

import { useParams } from 'next/navigation'
import { useAgentContext } from '@/lib/context/AgentContext'
import { useAgent } from '@/lib/hooks/useAgent'
import AgentMessages from '@/components/agent/AgentMessages'
import TypingIndicator from '@/components/agent/TypingIndicator'
import QuickChips from '@/components/agent/QuickChips'
import AgentStatusBar from '@/components/agent/AgentStatusBar'
import { useState, useEffect } from 'react'
import DBMinutaModal from '@/components/dashboard/DBMinutaModal'

export default function AgentPanel() {
  const params = useParams()
  const projectId = (params?.projectId as string) ?? 'pedregal'
  const {
    cards,
    isTyping,
    isProcessing,
    processingText,
    initCards,
    collapsed,
    setCollapsed,
    lastRefreshed,
    setLastRefreshed,
    agentStatus,
  } = useAgentContext()
  const { askAgent, refreshHistory } = useAgent(projectId)
  const [minutaOpen, setMinutaOpen] = useState(false)
  const [chipsOpen, setChipsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pvai_agent_panel_collapsed')
    if (saved === 'true') setCollapsed(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('pvai_agent_panel_collapsed', String(collapsed))
  }, [collapsed])

  // Load history from API on mount
  useEffect(() => {
    if (cards.length > 0) return
    fetch(`/api/projects/${projectId}/agent-messages`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.messages?.length) return
        initCards(data.messages)
        setLastRefreshed(new Date())
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const panelStyle = { background: 'linear-gradient(180deg, #071829 0%, #0A1A2E 100%)' }

  const alertCount = cards.filter(c => c.cardType === 'alerta' && !c.dismissed).length

  const panelContent = (
    <>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-pv-accent/30 bg-pv-accent/[0.08] flex items-center gap-1.5 flex-shrink-0">
        <h3 className="text-xs font-bold text-pv-accent flex-1 truncate">Agente IA</h3>
        <AgentStatusBar
          status={agentStatus}
          lastRefreshed={lastRefreshed}
          onRefresh={() => { refreshHistory(); setLastRefreshed(new Date()) }}
        />
        {/* Refresh button */}
        <button
          onClick={() => { refreshHistory(); setLastRefreshed(new Date()) }}
          className="text-pv-gray hover:text-pv-accent transition-colors p-0.5"
          title="Actualizar análisis"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-pv-gray hover:text-pv-accent transition-colors p-0.5"
          title={collapsed ? 'Expandir panel' : 'Colapsar panel'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {collapsed
              ? <polyline points="15 18 9 12 15 6" />
              : <polyline points="9 18 15 12 9 6" />}
          </svg>
        </button>
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
      <div className="flex-shrink-0 border-t border-pv-accent/20" style={{ background: 'rgba(46,143,192,0.07)' }}>
        <button
          onClick={() => setChipsOpen(o => !o)}
          className="w-full text-left text-[9px] font-bold uppercase tracking-[0.5px] text-pv-accent/80 px-3.5 pt-2.5 pb-2 flex items-center justify-between hover:text-pv-accent transition-colors"
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
        className="hidden lg:flex flex-col overflow-hidden border-l border-white/[0.06] transition-all duration-200"
        style={{ ...panelStyle, position: 'fixed', right: 0, top: 68, bottom: 49, width: collapsed ? 64 : 295 }}
      >
        {collapsed ? (
          <div className="flex flex-col items-center pt-4 gap-3">
            {/* Expand button */}
            <button
              onClick={() => setCollapsed(false)}
              className="text-pv-accent hover:text-white transition-colors"
              title="Expandir"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z" />
              </svg>
            </button>
            {/* Alert count badge */}
            {alertCount > 0 && (
              <div className="w-5 h-5 rounded-full bg-pv-red flex items-center justify-center text-[9px] font-bold text-white">
                {alertCount}
              </div>
            )}
          </div>
        ) : panelContent}
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
