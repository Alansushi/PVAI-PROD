'use client'

import { useState, useEffect, useRef } from 'react'
import type { DBProcessedReport } from '@/lib/db-types'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  projectTitle: string
}

export default function ReportModal({ open, onClose, projectId, projectTitle }: Props) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')
  const [html, setHtml] = useState<string>('')
  const [history, setHistory] = useState<DBProcessedReport[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setStatus('idle'); setHtml(''); setHistoryOpen(false); setCopied(false)
    }
  }, [open])

  async function generate() {
    setStatus('generating')
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          message: 'Genera el reporte semanal del proyecto.',
          type: 'reporte_semanal',
        }),
      })
      const data = await res.json()
      if (data.html) {
        setHtml(data.html)
        setStatus('done')
      } else {
        setHtml('No se pudo generar el reporte.')
        setStatus('error')
      }
    } catch {
      setHtml('Error al conectar con el agente IA.')
      setStatus('error')
    }
  }

  async function loadHistory() {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/reports`)
      if (res.ok) setHistory(await res.json())
    } finally {
      setHistoryLoading(false)
    }
  }

  function toggleHistory() {
    if (!historyOpen && history.length === 0) loadHistory()
    setHistoryOpen(p => !p)
  }

  function copyText() {
    if (!contentRef.current) return
    const text = contentRef.current.innerText
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function loadFromHistory(report: DBProcessedReport) {
    setHtml(report.content)
    setStatus('done')
    setHistoryOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1C3448] border border-white/[0.12] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-display text-[16px] font-black text-white">Reporte Semanal IA</h2>
            <p className="text-[10px] text-pv-gray mt-0.5">{projectTitle}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-pv-gray hover:text-white hover:bg-white/10 transition-colors text-lg">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {status === 'idle' && (
            <div className="px-5 py-8 flex flex-col items-center gap-4 text-center">
              <div className="text-4xl">📄</div>
              <div>
                <p className="text-[13px] font-semibold text-white mb-1">Genera tu reporte ejecutivo</p>
                <p className="text-[11px] text-pv-gray/70 max-w-xs">El agente IA analizará el estado actual, riesgos, KPIs y entregables para crear un reporte completo.</p>
              </div>
              <button onClick={generate}
                className="px-5 py-2 text-[12px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-xl transition-colors">
                ✦ Generar reporte
              </button>
              <button onClick={toggleHistory} className="text-[10px] text-pv-gray/60 hover:text-pv-gray transition-colors">
                Ver reportes anteriores
              </button>
            </div>
          )}

          {status === 'generating' && (
            <div className="px-5 py-12 flex flex-col items-center gap-4 text-center">
              <div className="w-8 h-8 border-2 border-pv-accent/30 border-t-pv-accent rounded-full animate-spin" />
              <p className="text-[12px] text-pv-gray">Analizando proyecto y generando reporte...</p>
              <p className="text-[10px] text-pv-gray/50">Esto puede tomar hasta 15 segundos</p>
            </div>
          )}

          {(status === 'done' || status === 'error') && (
            <div className="px-5 py-4">
              <div
                ref={contentRef}
                className="agent-response text-[12px] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          )}

          {/* History section */}
          {(status === 'idle' || status === 'done') && historyOpen && (
            <div className="border-t border-white/[0.08] px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray mb-2">Reportes anteriores</p>
              {historyLoading ? (
                <div className="flex flex-col gap-1.5">
                  {[1, 2].map(i => <div key={i} className="h-8 bg-white/[0.04] rounded-lg animate-pulse" />)}
                </div>
              ) : history.length === 0 ? (
                <p className="text-[11px] text-pv-gray/50 italic">Sin reportes anteriores.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {history.map(r => (
                    <button key={r.id} onClick={() => loadFromHistory(r)}
                      className="flex items-center justify-between px-3 py-2 text-left bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.07] transition-colors">
                      <span className="text-[11px] text-white/80">
                        {new Date(r.generatedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-[9px] text-pv-accent">Ver →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] flex items-center gap-2 flex-shrink-0">
          {status === 'done' && (
            <>
              <button onClick={toggleHistory}
                className="px-3 py-1.5 text-[11px] font-semibold text-pv-gray border border-white/[0.1] rounded-lg hover:bg-white/[0.06] transition-colors">
                {historyOpen ? 'Ocultar historial' : 'Historial'}
              </button>
              <button onClick={generate}
                className="px-3 py-1.5 text-[11px] font-semibold text-pv-accent border border-pv-accent/30 rounded-lg hover:bg-pv-accent/10 transition-colors">
                ↺ Regenerar
              </button>
              <button onClick={copyText}
                className="px-3 py-1.5 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors ml-auto">
                {copied ? '✓ Copiado' : 'Copiar texto'}
              </button>
            </>
          )}
          {status === 'idle' && (
            <button onClick={onClose}
              className="px-3 py-1.5 text-[11px] font-semibold text-pv-gray border border-white/[0.1] rounded-lg hover:bg-white/[0.06] transition-colors ml-auto">
              Cerrar
            </button>
          )}
          {(status === 'error') && (
            <>
              <button onClick={generate}
                className="px-3 py-1.5 text-[11px] font-semibold text-pv-accent border border-pv-accent/30 rounded-lg hover:bg-pv-accent/10 transition-colors">
                ↺ Reintentar
              </button>
              <button onClick={onClose}
                className="px-3 py-1.5 text-[11px] font-semibold text-pv-gray border border-white/[0.1] rounded-lg hover:bg-white/[0.06] transition-colors ml-auto">
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
