'use client'

import { useState, useEffect } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import parse from 'html-react-parser'
import type { DBUserDailySummary } from '@/lib/db-types'

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

export default function DailySummaryBanner() {
  const [summary, setSummary] = useState<DBUserDailySummary | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const clientDate = new Date().toISOString().split('T')[0]

    async function load() {
      try {
        // 1. Try to fetch an existing summary for today
        const getRes = await fetch(`/api/dashboard/daily-summary?date=${clientDate}`)
        if (!getRes.ok) { setReady(true); return }

        const { summary: data }: { summary: DBUserDailySummary | null } = await getRes.json()

        // 2. Already dismissed — stay hidden
        if (data?.dismissed) { setReady(true); return }

        // 3. Summary exists — display it
        if (data) {
          setSummary(data)
          setReady(true)
          signalTour()
          return
        }

        // 4. No summary yet — generate one
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
    }

    load()
  }, [])

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

  // While loading or nothing to show, render nothing
  if (!ready || !summary || dismissed) return null

  const safeHtml = DOMPurify.sanitize(summary.content, { ALLOWED_TAGS, ALLOWED_ATTR })

  return (
    <div className="bg-pv-accent/[0.07] border border-pv-accent/25 rounded-xl p-4 flex items-start gap-3">
      {/* Sun icon */}
      <span className="text-pv-accent text-sm mt-0.5 shrink-0">☀</span>

      {/* AI content */}
      <div className="flex-1 text-[13px] text-white/90 leading-relaxed">
        <div className="msg-content">
          {parse(safeHtml)}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="text-pv-gray hover:text-white/70 text-[11px] shrink-0 transition-colors whitespace-nowrap"
      >
        Ya lo leí
      </button>
    </div>
  )
}
