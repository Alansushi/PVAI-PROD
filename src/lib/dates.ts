/** Convierte una Date de UTC midnight a una Date local con el mismo año/mes/día */
export function utcToLocalDate(d: Date): Date {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/** Convierte un Date (o string ISO) al formato YYYY-MM-DD para inputs type="date" */
export function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Normaliza Date o string a Date local (evita off-by-one de timezone) */
export function toLocalDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null
  if (d instanceof Date) return utcToLocalDate(d)
  const parts = (d as string).split('T')[0].split('-')
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  }
  return new Date(d as string)
}
