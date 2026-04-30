'use client'
import { useState, useEffect } from 'react'

export function useRelativeTime(date: Date | string | null | undefined): string {
  const toStr = (d: Date | string | null | undefined): string => {
    if (!d) return ''
    const target = d instanceof Date ? d : new Date(d)
    if (isNaN(target.getTime())) return ''
    const diff = Math.floor((Date.now() - target.getTime()) / 1000)
    if (diff < 5) return 'ahora mismo'
    if (diff < 60) return `hace ${diff}s`
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
    return `hace ${Math.floor(diff / 86400)} d`
  }

  const [label, setLabel] = useState(() => toStr(date))

  useEffect(() => {
    setLabel(toStr(date))
    const id = setInterval(() => setLabel(toStr(date)), 30_000)
    return () => clearInterval(id)
  }, [date])

  return label
}
