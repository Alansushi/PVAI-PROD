export const STATUS_COLORS = {
  ok:     { bg: 'bg-[#2A9B6F]/10', border: 'border-[#2A9B6F]/30', text: 'text-[#2A9B6F]' },
  warn:   { bg: 'bg-[#E09B3D]/10', border: 'border-[#E09B3D]/30', text: 'text-[#E09B3D]' },
  danger: { bg: 'bg-[#D94F4F]/10', border: 'border-[#D94F4F]/30', text: 'text-[#D94F4F]' },
} as const

export const PRIORITY_COLORS: Record<string, string> = {
  alta:  '#D94F4F',
  media: '#E09B3D',
  baja:  '#2A9B6F',
}

export const WA_URL = 'https://wa.me/525587662865?text=Hola%2C%20vi%20el%20demo%20de%20Proyecto%20Vivo%20y%20me%20interesa%20saber%20m%C3%A1s.'

export const TEAM_LOAD_THRESHOLDS = {
  MEDIUM: 4,
  HIGH: 7,
} as const

export const TEAM_LOAD_CONFIG = {
  idle:      { label: 'Disponible', cls: 'bg-pv-accent/15 text-pv-accent border-pv-accent/30' },
  available: { label: 'Disponible', cls: 'bg-pv-green/15 text-pv-green border-pv-green/30' },
  busy:      { label: 'Ocupado',    cls: 'bg-pv-amber/15 text-pv-amber border-pv-amber/30' },
  saturated: { label: 'Saturado',   cls: 'bg-pv-red/15 text-pv-red border-pv-red/30' },
} as const

export type TeamLoadKey = keyof typeof TEAM_LOAD_CONFIG

export function getTeamLoad(active: number): TeamLoadKey {
  if (active === 0) return 'idle'
  if (active < TEAM_LOAD_THRESHOLDS.MEDIUM) return 'available'
  if (active < TEAM_LOAD_THRESHOLDS.HIGH) return 'busy'
  return 'saturated'
}
