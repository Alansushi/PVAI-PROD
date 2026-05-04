'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/lib/context/ToastContext'

interface Props {
  open: boolean
  onClose: () => void
  scope: 'portfolio' | 'project'
  projectId?: string
}

export default function ShareSummaryDialog({ open, onClose, scope, projectId }: Props) {
  const { showToast } = useToast()
  const [content, setContent] = useState('')
  const [includeBranding, setIncludeBranding] = useState(true)
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)

  const BRANDING_SUFFIX = '\n\n— Generado con Proyecto Vivo'

  useEffect(() => {
    if (!open) {
      setContent('')
      setLoading(false)
      setCopying(false)
      return
    }
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/share/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, projectId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast(err.error ?? 'No se pudo generar el resumen.', 'error')
        onClose()
        return
      }
      const data = await res.json()
      setContent(data.content)
    } catch {
      showToast('No se pudo generar el resumen.', 'error')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  function getFinalText() {
    return includeBranding ? content + BRANDING_SUFFIX : content
  }

  async function handleCopy() {
    const text = getFinalText()
    setCopying(true)
    try {
      await navigator.clipboard.writeText(text)
      showToast('Resumen copiado al portapapeles')
    } catch {
      showToast('No se pudo copiar. Selecciona el texto manualmente.', 'error')
    } finally {
      setTimeout(() => setCopying(false), 1500)
    }
  }

  function handleEmail() {
    const text = getFinalText()
    const subject = scope === 'project' ? 'Estado del proyecto' : 'Estado del portafolio'
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-[#0C1F35] border border-white/[0.10] rounded-2xl p-6 w-[520px] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[17px] font-bold text-white">Compartir resumen</h2>
          <button
            onClick={onClose}
            className="text-pv-gray hover:text-white transition-colors text-[18px] leading-none"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <span className="w-5 h-5 border-2 border-pv-accent/30 border-t-pv-accent rounded-full animate-spin" />
            <span className="text-[12px] text-pv-gray">Generando resumen con IA...</span>
          </div>
        ) : (
          <>
            <textarea
              value={content + (includeBranding ? BRANDING_SUFFIX : '')}
              onChange={e => {
                const val = e.target.value
                if (includeBranding && val.endsWith(BRANDING_SUFFIX)) {
                  setContent(val.slice(0, -BRANDING_SUFFIX.length))
                } else {
                  setContent(includeBranding ? val.replace(BRANDING_SUFFIX, '') : val)
                }
              }}
              rows={8}
              className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-4 py-3 text-[12px] text-white/90 leading-relaxed outline-none focus:border-pv-accent/40 resize-none transition-colors mb-3"
            />

            <label className="flex items-center gap-2 cursor-pointer mb-4 select-none">
              <input
                type="checkbox"
                checked={includeBranding}
                onChange={e => setIncludeBranding(e.target.checked)}
                className="accent-pv-accent"
              />
              <span className="text-[11px] text-pv-gray">
                Incluir firma <em className="not-italic text-white/40">— Generado con Proyecto Vivo</em>
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={copying || !content}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copying ? (
                  <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />Copiando...</>
                ) : (
                  <>📋 Copiar al portapapeles</>
                )}
              </button>
              <button
                onClick={handleEmail}
                disabled={!content}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold text-pv-gray border border-white/[0.10] rounded-lg hover:bg-white/[0.05] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✉ Enviar por email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
