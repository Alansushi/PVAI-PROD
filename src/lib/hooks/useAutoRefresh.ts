'use client'

import { useEffect, useRef } from 'react'

const LS_ENABLED = 'pvai_autorefresh_enabled'
const LS_INTERVAL = 'pvai_autorefresh_interval'

export const AUTO_REFRESH_OPTIONS = [5, 15, 30, 60] as const
export type AutoRefreshInterval = (typeof AUTO_REFRESH_OPTIONS)[number]

export function loadAutoRefreshConfig(): { enabled: boolean; intervalMin: AutoRefreshInterval } {
  if (typeof window === 'undefined') return { enabled: false, intervalMin: 15 }
  const enabled = localStorage.getItem(LS_ENABLED) === 'true'
  const raw = Number(localStorage.getItem(LS_INTERVAL))
  const intervalMin = (AUTO_REFRESH_OPTIONS.includes(raw as AutoRefreshInterval) ? raw : 15) as AutoRefreshInterval
  return { enabled, intervalMin }
}

export function saveAutoRefreshConfig(enabled: boolean, intervalMin: AutoRefreshInterval) {
  localStorage.setItem(LS_ENABLED, String(enabled))
  localStorage.setItem(LS_INTERVAL, String(intervalMin))
}

export function useAutoRefresh(onRefresh: () => void, enabled: boolean, intervalMin: AutoRefreshInterval) {
  const callbackRef = useRef(onRefresh)
  callbackRef.current = onRefresh

  useEffect(() => {
    if (!enabled) return
    const ms = intervalMin * 60 * 1000
    const id = setInterval(() => callbackRef.current(), ms)
    return () => clearInterval(id)
  }, [enabled, intervalMin])
}
