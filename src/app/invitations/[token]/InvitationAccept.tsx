'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  token: string
  projectId: string | null
}

export default function InvitationAccept({ token, projectId }: Props) {
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
        setError(data.error ?? 'Error al aceptar la invitación')
        return
      }
      router.push(projectId ? `/dashboard/${projectId}` : '/dashboard/inicio')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {error && (
        <p className="text-[12px] text-[#D94F4F] bg-[#D94F4F]/10 border border-[#D94F4F]/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}
      <button
        onClick={accept}
        disabled={loading}
        className="w-full py-3 bg-[#2E8FC0] hover:bg-[#2680AD] disabled:opacity-60 text-white font-semibold text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Aceptando...
          </>
        ) : 'Aceptar invitación →'}
      </button>
    </div>
  )
}
