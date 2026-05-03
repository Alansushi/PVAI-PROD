export type KpiKind = 'total' | 'risk' | 'pct' | 'members'

export function getKpiTone(value: number, kind: KpiKind): string {
  switch (kind) {
    case 'total':
      return value === 0 ? 'text-pv-gray/60' : 'text-white'
    case 'risk':
      if (value === 0) return 'text-pv-green'
      if (value === 1) return 'text-pv-amber'
      return 'text-pv-red'
    case 'pct':
      if (value < 50) return 'text-pv-red'
      if (value < 80) return 'text-pv-amber'
      return 'text-pv-green'
    case 'members':
      return value === 1 ? 'text-pv-amber' : 'text-white'
  }
}
