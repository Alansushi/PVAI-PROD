'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ALL_MEMBERS } from '@/lib/data/members'
import { useProjectContext } from '@/lib/context/ProjectContext'
import { useAgentContext } from '@/lib/context/AgentContext'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
}

export default function AddMemberModal({ open, onClose, projectId }: Props) {
  const { getProject, addMember } = useProjectContext()
  const { addMessage } = useAgentContext()
  const project = getProject(projectId)
  const current = project?.members ?? []

  function handleAdd(id: string) {
    if (current.includes(id)) return
    addMember(projectId, id)
    addMessage(`<strong>Equipo actualizado:</strong> <span class="nl">${ALL_MEMBERS[id].name}</span> se unió como ${ALL_MEMBERS[id].role}.`)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#0F2A45] border border-pv-accent/30 rounded-xl w-[500px] max-w-[92vw] p-0 gap-0">
        <DialogHeader className="px-4 py-3.5 border-b border-white/[0.08]">
          <DialogTitle className="text-sm font-bold text-pv-white">👥 Agregar persona al proyecto</DialogTitle>
        </DialogHeader>
        <div className="px-4 py-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-pv-gray mb-2">Miembros del despacho</div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(ALL_MEMBERS).map(m => {
              const added = current.includes(m.id)
              return (
                <div
                  key={m.id}
                  onClick={() => handleAdd(m.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all
                    ${added
                      ? 'border-pv-green bg-pv-green/10 pointer-events-none'
                      : 'border-white/[0.09] bg-white/[0.04] cursor-pointer hover:border-pv-accent hover:bg-pv-accent/8'
                    }`}
                >
                  <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: m.color }}>
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate">{m.name}</div>
                    <div className="text-[9px] text-pv-gray truncate">{m.role}</div>
                  </div>
                  {added && <span className="text-pv-green text-sm ml-auto">✓</span>}
                </div>
              )
            })}
          </div>
        </div>
        <div className="px-4 py-3 border-t border-white/[0.07] flex justify-end">
          <button
            onClick={onClose}
            className="bg-white/[0.07] border border-white/10 text-pv-white rounded-lg px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-white/12 transition-all"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
