'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

interface Props {
  open: boolean
  onClose: () => void
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  orgName: string
}

export default function UserProfileModal({ open, onClose, user, orgName }: Props) {
  const [signingOut, setSigningOut] = useState(false)

  if (!open) return null

  async function handleSignOut() {
    setSigningOut(true)
    await signOut({ callbackUrl: '/login' })
  }

  const initials = user.name
    ? user.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 bg-[#0C1F35] border border-white/[0.10] rounded-2xl p-6 w-[320px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Avatar */}
        <div className="flex flex-col items-center mb-5">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? 'Avatar'}
              className="w-16 h-16 rounded-full border-2 border-white/20 mb-3"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#2E8FC0] flex items-center justify-center text-xl font-bold text-white border-2 border-white/20 mb-3">
              {initials}
            </div>
          )}
          <div className="text-[15px] font-semibold text-white">{user.name ?? '—'}</div>
          <div className="text-[11px] text-pv-gray mt-0.5">{user.email}</div>
        </div>

        {/* Info rows */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden mb-4">
          <div className="px-4 py-2.5 border-b border-white/[0.07] flex justify-between items-center">
            <span className="text-[10px] text-pv-gray uppercase tracking-[0.5px]">Organización</span>
            <span className="text-[11px] font-semibold text-white">{orgName}</span>
          </div>
          <div className="px-4 py-2.5 flex justify-between items-center">
            <span className="text-[10px] text-pv-gray uppercase tracking-[0.5px]">Rol</span>
            <span className="text-[11px] font-semibold text-white">Director</span>
          </div>
        </div>

        {/* Edit profile link */}
        <Link
          href="/dashboard/perfil"
          onClick={onClose}
          className="block w-full px-3 py-2 text-[11px] font-semibold text-center text-pv-accent border border-pv-accent/30 rounded-lg hover:bg-pv-accent/10 transition-colors mb-2"
        >
          Editar mi perfil
        </Link>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-[11px] font-semibold text-pv-gray border border-white/[0.10] rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex-1 px-3 py-2 text-[11px] font-semibold text-white bg-pv-red/80 hover:bg-pv-red rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {signingOut ? (
              <>
                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                Saliendo...
              </>
            ) : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
