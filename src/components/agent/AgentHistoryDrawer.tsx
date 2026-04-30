'use client'

import { useEffect, useState } from 'react'

interface AgentMessage {
  id: string
  role: string
  content: string
  createdAt: string
  cardType: string
  dismissed: boolean
  actions: unknown
}

interface Props {
  open: boolean
  projectId: string
  onClose: () => void
}

type CardType = 'alerta' | 'recomendacion' | 'insight' | 'pregunta'

const TYPE_CONFIG: Record<CardType, { label: string; icon: string; text: string }> = {
  alerta:       { label: 'Alerta',         icon: '⚠',  text: 'text-pv-red' },
  recomendacion:{ label: 'Recomendación',  icon: '✓',  text: 'text-pv-green' },
  insight:      { label: 'Insight',        icon: '💡', text: 'text-pv-accent' },
  pregunta:     { label: 'Pregunta',       icon: '💬', text: 'text-pv-gray' },
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim().slice(0, 80)
}

function fmtRelative(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return `hace ${Math.floor(diff / 86400)} d`
}

export default function AgentHistoryDrawer({ open, projectId, onClose }: Props) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMessages = () => {
    setLoading(true)
    fetch(`/api/projects/${projectId}/agent-messages`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.messages) {
          // Show agent messages only, newest-first
          const agentOnly = (data.messages as AgentMessage[]).filter(m => m.role === 'agent')
          setMessages([...agentOnly].reverse())
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (open) fetchMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId])

  const handleDismiss = async (messageId: string) => {
    await fetch(`/api/projects/${projectId}/agent-messages`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId }),
    })
    fetchMessages()
  }

  if (!open) return null

  const drawerStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, #071829 0%, #0A1A2E 100%)',
    position: 'fixed',
    right: 295,
    top: 68,
    bottom: 49,
    width: 300,
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
  }

  return (
    <>
      {/* Backdrop for closing */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div style={drawerStyle}>
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-pv-accent/30 bg-pv-accent/[0.08] flex items-center gap-1.5 flex-shrink-0">
          <h3 className="text-xs font-bold text-pv-accent flex-1 truncate">Historial del Agente</h3>
          <button
            onClick={onClose}
            className="text-pv-gray hover:text-white transition-colors p-0.5"
            title="Cerrar historial"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-16">
              <div className="w-4 h-4 border-2 border-pv-accent/30 border-t-pv-accent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-[11px] text-pv-gray text-center mt-6">Sin mensajes registrados.</p>
          ) : (
            messages.map(msg => {
              const cfg = TYPE_CONFIG[(msg.cardType as CardType) ?? 'insight'] ?? TYPE_CONFIG.insight
              const preview = stripHtml(msg.content)
              return (
                <div
                  key={msg.id}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-2 text-[11px]"
                >
                  {/* Type label row */}
                  <div className={`flex items-center justify-between mb-1 ${cfg.text}`}>
                    <span className="font-semibold tracking-wide text-[10px] flex items-center gap-1">
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </span>
                    <span className="text-[9px] text-pv-gray">{fmtRelative(msg.createdAt)}</span>
                  </div>

                  {/* Content preview */}
                  <p className="text-[#C0D0E0] leading-relaxed mb-1.5">
                    {preview}{preview.length === 80 ? '…' : ''}
                  </p>

                  {/* Dismiss action */}
                  {msg.dismissed ? (
                    <span className="text-[9px] text-pv-gray">(descartada)</span>
                  ) : (
                    <button
                      onClick={() => handleDismiss(msg.id)}
                      className="text-[9px] text-pv-gray hover:text-pv-red transition-colors border border-white/10 rounded px-1.5 py-0.5"
                    >
                      Descartar
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
