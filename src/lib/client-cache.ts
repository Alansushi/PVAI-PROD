/**
 * Simple in-memory cache for client-side data.
 * Lives at module level → survives component unmount/remount during navigation.
 * Reset on hard refresh (which is expected behavior).
 */
const store = new Map<string, unknown>()

export function getCached<T>(key: string): T | null {
  return (store.get(key) as T) ?? null
}

export function setCached<T>(key: string, data: T): void {
  store.set(key, data)
}

export function invalidateCache(key: string): void {
  store.delete(key)
}
