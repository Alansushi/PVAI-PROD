'use client'

import { useState } from 'react'
import type { DBProjectMember } from '@/lib/db-types'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  members: DBProjectMember[]
  onSelectMember: (m: DBProjectMember) => void
  onInvite: () => void
}

type ResendState = 'sending' | 'sent' | 'error'

export default function MembersListModal({
  open,
  onClose,
  projectId,
  members,
  onSelectMember,
  onInvite,
}: Props) {
  const [resend, setResend] = useState<Record<string, ResendState>>({})

  if (!open) return null

  async function handleResend(memberId: string) {
    setResend(prev => ({ ...prev, [memberId]: 'sending' }))
    try {
      const res = await fetch(
        `/api/projects/${projectId}/members/${memberId}/resend-invitation`,
        { method: 'POST' }
      )
      setResend(prev => ({ ...prev, [memberId]: res.ok ? 'sent' : 'error' }))
    } catch {
      setResend(prev => ({ ...prev, [memberId]: 'error' }))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#0C1F35] border border-white/[0.12] rounded-2xl w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <h2 className="text-sm font-semibold text-white">
            Equipo del proyecto
            <span className="ml-2 text-[11px] font-normal text-pv-gray">
              {members.length} persona{members.length !== 1 ? 's' : ''}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-pv-gray hover:bg-white/10 hover:text-white transition-colors text-sm"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Members list */}
        <div className="py-2 max-h-72 overflow-y-auto">
          {members.length === 0 ? (
            <p className="text-[12px] text-pv-gray text-center py-6">Sin colaboradores</p>
          ) : (
            members.map(m => {
              const status = !m.userId ? m.invitationStatus : null
              const resendState = resend[m.id]
              return (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { onSelectMember(m); onClose() }}
                  onKeyDown={e => { if (e.key === 'Enter') { onSelectMember(m); onClose() } }}
                  className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: m.color }}
                  >
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-white truncate">{m.name}</span>
                      {status === 'pending' && (
                        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-pv-amber/15 text-pv-amber flex-shrink-0">
                          Pendiente
                        </span>
                      )}
                      {status === 'expired' && (
                        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-pv-red/15 text-pv-red flex-shrink-0">
                          Expirada
                        </span>
                      )}
                    </div>
                    {m.role && (
                      <div className="text-[10px] text-pv-gray truncate">{m.role}</div>
                    )}
                  </div>
                  {status && (
                    <button
                      onClick={e => { e.stopPropagation(); if (resendState !== 'sending' && resendState !== 'sent') handleResend(m.id) }}
                      disabled={resendState === 'sending' || resendState === 'sent'}
                      className="flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-md border border-pv-accent/40 text-pv-accent hover:bg-pv-accent/10 disabled:opacity-60 disabled:cursor-default transition-colors"
                    >
                      {resendState === 'sending' ? 'Enviando…'
                        : resendState === 'sent' ? 'Reenviada ✓'
                        : resendState === 'error' ? 'Reintentar'
                        : 'Reenviar'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/[0.08]">
          <button
            onClick={() => { onInvite(); onClose() }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-pv-accent/40 text-[12px] font-semibold text-pv-accent hover:bg-pv-accent/10 transition-colors"
          >
            + Invitar colaborador
          </button>
        </div>
      </div>
    </div>
  )
}
