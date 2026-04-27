'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  token: string
  orgName: string
  inviterName: string | null
}

export default function OnboardingInvitation({ token, orgName, inviterName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function accept() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/invitations/${token}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'No se pudo aceptar la invitación')
        return
      }
      router.push(data.projectId ? `/dashboard/${data.projectId}` : '/dashboard/inicio')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#2E8FC0]/10 border border-[#2E8FC0]/30 rounded-2xl p-5">
      <p className="text-[13px] text-white font-semibold mb-1">
        {inviterName ?? 'Tu equipo'} te invitó a{' '}
        <span className="text-[#2E8FC0]">{orgName}</span>
      </p>
      <p className="text-[11px] text-[#8BA3B8] mb-3">
        Únete directamente sin crear un despacho nuevo.
      </p>
      {error && (
        <p className="text-[11px] text-[#D94F4F] mb-2">{error}</p>
      )}
      <button
        onClick={accept}
        disabled={loading}
        className="w-full py-2.5 bg-[#2E8FC0] hover:bg-[#2680AD] disabled:opacity-60 text-white font-semibold text-[13px] rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Uniéndome...
          </>
        ) : `Unirme a ${orgName} →`}
      </button>
    </div>
  )
}
