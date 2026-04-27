'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'

const PROFESSIONS = [
  { value: 'arquitecto', label: 'Arquitecto/a' },
  { value: 'ingeniero', label: 'Ingeniero/a' },
  { value: 'contratista', label: 'Contratista' },
  { value: 'oficio', label: 'Trabajador/a de oficio' },
  { value: 'otro', label: 'Otro' },
]

const PROF_DETAILS = [
  { value: 'carpintero', label: 'Carpintero/a' },
  { value: 'electricista', label: 'Electricista' },
  { value: 'plomero', label: 'Plomero/a' },
  { value: 'pintor', label: 'Pintor/a' },
  { value: 'soldador', label: 'Soldador/a' },
  { value: 'otro', label: 'Otro' },
]

interface Props {
  invitationToken?: string
}

export default function RegisterForm({ invitationToken }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    profession: '',
    profDetail: '',
    phone: '',
    firmName: '',
    firmUrl: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [domainOrgs, setDomainOrgs] = useState<{ name: string }[]>([])
  const domainTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'email') {
      if (domainTimer.current) clearTimeout(domainTimer.current)
      const domain = value.split('@')[1]
      if (domain && domain.includes('.')) {
        domainTimer.current = setTimeout(async () => {
          try {
            const res = await fetch(`/api/auth/check-domain?domain=${encodeURIComponent(domain)}`)
            if (res.ok) {
              const data = await res.json()
              setDomainOrgs(data.orgs ?? [])
            }
          } catch { /* silent */ }
        }, 600)
      } else {
        setDomainOrgs([])
      }
    }
  }

  // Clean up timer on unmount
  useEffect(() => () => { if (domainTimer.current) clearTimeout(domainTimer.current) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          profession: form.profession,
          profDetail: form.profDetail || undefined,
          firmName: form.firmName,
          firmUrl: form.firmUrl || undefined,
          phone: form.phone || undefined,
          invitationToken: invitationToken || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear la cuenta')
        setLoading(false)
        return
      }

      // Auto sign-in after registration
      await signIn('credentials', {
        email: form.email,
        password: form.password,
        callbackUrl: '/dashboard/inicio',
      })
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-2.5 text-[14px] text-white placeholder:text-[#4A6070] focus:outline-none focus:border-[#2E8FC0] transition-colors'
  const labelClass = 'block text-[12px] font-medium text-[#8BA3B8] mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: Account */}
      <div>
        <p className="text-[11px] font-semibold text-[#2E8FC0] uppercase tracking-wider mb-4">
          Tu cuenta
        </p>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nombre completo *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Juan García"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="juan@despacho.com"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Contraseña *</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Mín. 8 caracteres"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Confirmar contraseña *</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                placeholder="Repetir contraseña"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Professional profile */}
      <div>
        <p className="text-[11px] font-semibold text-[#2E8FC0] uppercase tracking-wider mb-4">
          Tu perfil profesional
        </p>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Profesión *</label>
            <select
              required
              value={form.profession}
              onChange={(e) => set('profession', e.target.value)}
              className={inputClass + ' cursor-pointer'}
            >
              <option value="" disabled>
                Selecciona tu profesión
              </option>
              {PROFESSIONS.map((p) => (
                <option key={p.value} value={p.value} className="bg-[#0C1F35]">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {form.profession === 'oficio' && (
            <div>
              <label className={labelClass}>Especialidad *</label>
              <select
                required
                value={form.profDetail}
                onChange={(e) => set('profDetail', e.target.value)}
                className={inputClass + ' cursor-pointer'}
              >
                <option value="" disabled>
                  Selecciona tu especialidad
                </option>
                {PROF_DETAILS.map((p) => (
                  <option key={p.value} value={p.value} className="bg-[#0C1F35]">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+52 55 1234 5678"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Firm */}
      <div>
        <p className="text-[11px] font-semibold text-[#2E8FC0] uppercase tracking-wider mb-4">
          Tu despacho
        </p>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nombre del despacho *</label>
            <input
              type="text"
              required
              value={form.firmName}
              onChange={(e) => set('firmName', e.target.value)}
              placeholder="Despacho García & Asociados"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Sitio web del despacho</label>
            <input
              type="url"
              value={form.firmUrl}
              onChange={(e) => set('firmUrl', e.target.value)}
              placeholder="https://despacho.com"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Domain match banner */}
      {domainOrgs.length > 0 && !invitationToken && (
        <div className="text-[12px] text-[#E09B3D] bg-[#E09B3D]/10 border border-[#E09B3D]/20 rounded-xl px-4 py-3 leading-relaxed">
          <strong>Nota:</strong> Ya hay miembros con ese dominio en{' '}
          {domainOrgs.map((o) => o.name).join(', ')}. Pídeles que te inviten
          directamente para unirte a su espacio de trabajo.
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-[13px] text-[#D94F4F] bg-[#D94F4F]/10 border border-[#D94F4F]/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Legal disclaimer */}
      <p className="text-center text-[11px] text-[#8BA3B8]">
        Al crear tu cuenta, aceptas nuestros{' '}
        <a href="/terminos" target="_blank" className="text-[#2E8FC0] hover:underline">
          Términos y Condiciones
        </a>{' '}
        y nuestro{' '}
        <a href="/aviso-privacidad" target="_blank" className="text-[#2E8FC0] hover:underline">
          Aviso de Privacidad
        </a>
        , conforme a la LFPDPPP.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#2E8FC0] hover:bg-[#2680AD] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[14px] py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creando cuenta...
          </>
        ) : (
          'Crear cuenta →'
        )}
      </button>
    </form>
  )
}
