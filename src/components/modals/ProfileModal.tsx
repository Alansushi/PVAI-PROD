'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ALL_MEMBERS } from '@/lib/data/members'

interface Props {
  memberId: string
  projectTitle: string
  onClose: () => void
}

export default function ProfileModal({ memberId, projectTitle, onClose }: Props) {
  const m = ALL_MEMBERS[memberId]
  if (!m) return null

  const statusLabel = m.done === m.tasks ? '✓ Al corriente' : m.done > 0 ? 'En proceso' : '⚠ Sin avance'
  const statusCls   = m.done === m.tasks ? 'text-pv-green' : m.done > 0 ? 'text-pv-amber' : 'text-pv-red'

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#0F2A45] border border-pv-accent/30 rounded-xl w-[360px] max-w-[92vw] p-0 gap-0">
        <div className="modal-head px-3.5 py-2.5 border-b border-white/[0.08] flex justify-between items-center">
          <span className="text-xs font-bold">Perfil del colaborador</span>
          <button onClick={onClose} className="bg-none border-none text-pv-gray text-xl cursor-pointer px-1 hover:text-pv-white">×</button>
        </div>
        <div
          className="px-4 py-5 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,rgba(26,79,122,0.8),rgba(46,143,192,0.2))' }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white border-[3px] border-white/20" style={{ background: m.color }}>
            {m.initials}
          </div>
          <div>
            <div className="text-[15px] font-bold">{m.name}</div>
            <div className="text-[10px] text-white/70 mt-0.5">{m.role}</div>
          </div>
        </div>
        <div className="px-4 py-3.5">
          {[
            { label: 'Tareas asignadas', value: String(m.tasks), cls: '' },
            { label: 'Completadas',      value: `${m.done} de ${m.tasks}`, cls: 'text-pv-green' },
            { label: 'Estado',           value: statusLabel, cls: statusCls },
          ].map(stat => (
            <div key={stat.label} className="flex justify-between items-center py-1.5 border-b border-white/[0.06] last:border-b-0">
              <span className="text-[11px] text-pv-gray">{stat.label}</span>
              <span className={`text-[11px] font-semibold ${stat.cls}`}>{stat.value}</span>
            </div>
          ))}
          <div className="mt-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.7px] text-pv-gray mb-1.5">Entregables activos</div>
            {m.active.map((t, i) => (
              <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 mb-1 text-[11px]">
                <div className="font-semibold">{t}</div>
                <div className="text-[10px] text-pv-gray mt-0.5">En curso · {projectTitle || 'Proyecto actual'}</div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
