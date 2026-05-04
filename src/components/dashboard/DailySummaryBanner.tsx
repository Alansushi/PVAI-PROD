'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import parse from 'html-react-parser'
import type { DBUserDailySummary, DailySummaryAction } from '@/lib/db-types'
import { useToast } from '@/lib/context/ToastContext'
import ShareSummaryDialog from '@/components/share/ShareSummaryDialog'

const ALLOWED_TAGS = ['br', 'strong', 'span', 'em', 'ul', 'li', 'p']
const ALLOWED_ATTR = ['class']

function signalTour() {
  try {
    const CHECKED_KEY = 'pvai_onboarding_done_checked'
    const checked = JSON.parse(localStorage.getItem(CHECKED_KEY) ?? '{}') as Record<string, boolean>
    if (!checked['daily_banner']) {
      checked['daily_banner'] = true
      localStorage.setItem(CHECKED_KEY, JSON.stringify(checked))
      window.dispatchEvent(new StorageEvent('storage', {
        key: CHECKED_KEY,
        newValue: JSON.stringify(checked),
      }))
    }
  } catch { /* ignore */ }
}

function ActionChip({ action }: { action: DailySummaryAction }) {
  const { showToast } = useToast()
  const [running, setRunning] = useState(false)

  async function handleExecute() {
    if (running) return
    setRunning(true)
    try {
      await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: action.label, type: action.target, view: 'inicio' }),
      })
      showToast('Análisis generado. Ábrelo en el panel del agente.')
    } catch {
      showToast('No se pudo generar el análisis. Intenta desde el panel del agente.', 'error')
    } finally {
      setRunning(false)
    }
  }

  const chipClass =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border border-pv-accent/30 text-pv-accent hover:bg-pv-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  if (action.type === 'navigate') {
    return (
      <Link href={action.target} className={chipClass}>
        <span className="text-[10px]">→</span>
        {action.label}
      </Link>
    )
  }

  return (
    <button onClick={handleExecute} disabled={running} className={chipClass}>
      {running ? (
        <span className="w-2.5 h-2.5 border border-pv-accent/40 border-t-pv-accent rounded-full animate-spin flex-shrink-0" />
      ) : (
        <span className="text-[10px]">✦</span>
      )}
      {action.label}
    </button>
  )
}

export default function DailySummaryBanner() {
  const [summary, setSummary] = useState<DBUserDailySummary | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [ready, setReady] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const clientDate = new Date().toISOString().split('T')[0]

      const getRes = await fetch(`/api/dashboard/daily-summary?date=${clientDate}`)
      if (!getRes.ok) { setReady(true); return }

      const { summary: data }: { summary: DBUserDailySummary | null } = await getRes.json()

      if (data?.dismissed) { setReady(true); return }

      if (data) {
        setSummary(data)
        setReady(true)
        signalTour()
        return
      }

      const postRes = await fetch('/api/dashboard/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientDate }),
      })
      if (!postRes.ok) { setReady(true); return }

      const { summary: created }: { summary: DBUserDailySummary | null } = await postRes.json()
      if (created) {
        setSummary(created)
        signalTour()
      }
    } catch {
      /* non-critical — fail silently */
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDismiss() {
    setDismissed(true)
    try {
      await fetch('/api/dashboard/daily-summary', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissed: true }),
      })
    } catch { /* ignore */ }
  }

  if (!ready || !summary || dismissed) return null

  const safeHtml = DOMPurify.sanitize(summary.content, { ALLOWED_TAGS, ALLOWED_ATTR })
  const actions = summary.actionsJson?.actions ?? []

  return (
    <>
      <div className="bg-pv-accent/[0.07] border border-pv-accent/25 rounded-xl p-4 flex items-start gap-3">
        <span className="text-pv-accent text-sm mt-0.5 shrink-0">☀</span>

        <div className="flex-1 min-w-0">
          <div className="msg-content text-[13px] text-white/90 leading-relaxed">
            {parse(safeHtml)}
          </div>

          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {actions.map((action) => (
                <ActionChip key={action.label} action={action} />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShareOpen(true)}
            className="text-pv-gray hover:text-pv-accent text-[11px] transition-colors whitespace-nowrap"
            title="Compartir resumen"
          >
            ↗ Compartir
          </button>
          <button
            onClick={handleDismiss}
            className="text-pv-gray hover:text-white/70 text-[11px] transition-colors whitespace-nowrap"
          >
            Ya lo leí
          </button>
        </div>
      </div>

      <ShareSummaryDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        scope="portfolio"
      />
    </>
  )
}
