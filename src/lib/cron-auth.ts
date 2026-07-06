import { timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * Valida el CRON_SECRET únicamente vía header `Authorization: Bearer <secret>`.
 * No se acepta por query string (quedaría en logs de acceso/proxies).
 */
export function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return false

  const provided = Buffer.from(header.slice('Bearer '.length))
  const expected = Buffer.from(secret)
  if (provided.length !== expected.length) return false
  return timingSafeEqual(provided, expected)
}
