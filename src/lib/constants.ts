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
