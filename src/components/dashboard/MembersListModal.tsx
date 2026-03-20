'use client'

import type { DBProjectMember } from '@/lib/db-types'

interface Props {
  open: boolean
  onClose: () => void
  members: DBProjectMember[]
  onSelectMember: (m: DBProjectMember) => void
  onInvite: () => void
}

export default function MembersListModal({
  open,
  onClose,
  members,
  onSelectMember,
  onInvite,
}: Props) {
  if (!open) return null

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
            members.map(m => (
              <button
                key={m.id}
                onClick={() => { onSelectMember(m); onClose() }}
                className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.05] transition-colors text-left"
              >
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: m.color }}
                >
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-white truncate">{m.name}</div>
                  {m.role && (
                    <div className="text-[10px] text-pv-gray truncate">{m.role}</div>
                  )}
                </div>
              </button>
            ))
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
