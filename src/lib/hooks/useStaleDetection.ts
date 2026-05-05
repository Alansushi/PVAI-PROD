import { useEffect, useRef } from 'react'

type AgentMode = 'solo_cuando_lo_pida' | 'equilibrado' | 'proactivo'

const THRESHOLDS_MS: Record<AgentMode, number> = {
  solo_cuando_lo_pida: 24 * 60 * 60 * 1000,  // 24 h
  equilibrado:          4 * 60 * 60 * 1000,   // 4 h
  proactivo:           30 * 60 * 1000,         // 30 min
}

/** Calls onStale when lastRefreshed is older than the mode threshold.
 *  Checks every 60 s. Resets automatically when lastRefreshed changes. */
export function useStaleDetection(
  lastRefreshed: Date | null,
  agentMode: AgentMode,
  onStale: () => void
): void {
  const onStaleRef = useRef(onStale)
  onStaleRef.current = onStale

  useEffect(() => {
    let fired = false
    const id = setInterval(() => {
      if (!lastRefreshed || fired) return
      const elapsed = Date.now() - lastRefreshed.getTime()
      if (elapsed > THRESHOLDS_MS[agentMode]) {
        fired = true
        onStaleRef.current()
      }
    }, 60_000)
    return () => clearInterval(id)
  }, [agentMode, lastRefreshed])
}
