'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useProjectContext } from '@/lib/context/ProjectContext'
import { useAgentContext } from '@/lib/context/AgentContext'
import { ALL_MEMBERS } from '@/lib/data/members'
import type { Deliverable } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  editingId: string | null
  defaultStatus: Deliverable['status']
}

const STATUS_OPTIONS: { value: Deliverable['status']; label: string; active: string; inactive: string }[] = [
  { value: 'ok',     label: '✓ Completada', active: 'bg-pv-green/20 border border-pv-green text-pv-green',   inactive: 'bg-white/[0.04] border border-transparent text-pv-gray' },
  { value: 'warn',   label: '⏳ En proceso', active: 'bg-pv-amber/20 border border-pv-amber text-pv-amber',   inactive: 'bg-white/[0.04] border border-transparent text-pv-gray' },
  { value: 'danger', label: '🔴 En riesgo',  active: 'bg-pv-red/20 border border-pv-red text-pv-red',         inactive: 'bg-white/[0.04] border border-transparent text-pv-gray' },
]

export default function TaskModal({ open, onClose, projectId, editingId, defaultStatus }: Props) {
  const { getProject, updateDeliverable, addDeliverable, deleteDeliverable } = useProjectContext()
  const { addMessage } = useAgentContext()

  const [name, setName] = useState('')
  const [status, setStatus] = useState<Deliverable['status']>(defaultStatus)
  const [owner, setOwner] = useState('jorge')
  const [priority, setPriority] = useState<Deliverable['priority']>('media')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (editingId) {
      const task = getProject(projectId)?.deliverables.find(d => d.id === editingId)
      if (task) {
        setName(task.name)
        setStatus(task.status)
        setOwner(task.owner)
        setPriority(task.priority)
        setStartDate(task.startDate)
        setDueDate(task.dueDate)
        setNotes(task.notes)
      }
    } else {
      setName(''); setStatus(defaultStatus); setOwner('jorge')
      setPriority('media'); setStartDate(''); setDueDate(''); setNotes('')
    }
  }, [open, editingId, defaultStatus, projectId, getProject])

  function save() {
    if (!name.trim()) return
    if (editingId) {
      const task = getProject(projectId)?.deliverables.find(d => d.id === editingId)
      if (task) updateDeliverable(projectId, { ...task, name, status, owner, priority, startDate, dueDate, notes })
    } else {
      const newTask: Deliverable = { id: `t${Date.now()}`, name, status, meta: '', owner, priority, startDate, dueDate, notes }
      addDeliverable(projectId, newTask)
      addMessage(`<strong>✦ Tarea creada:</strong> "<span class="nl">${name}</span>" asignada a ${ALL_MEMBERS[owner]?.name ?? owner}.`)
    }
    onClose()
  }

  function remove() {
    if (editingId) { deleteDeliverable(projectId, editingId); onClose() }
  }

  const inputCls = "w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-3 py-2 text-xs text-pv-white font-sans outline-none transition-colors focus:border-pv-accent/50 mb-2.5"
  const selectCls = "w-full bg-pv-navy border border-white/[0.12] rounded-lg px-3 py-2 text-xs text-pv-white font-sans outline-none mb-2.5 cursor-pointer"

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#0F2A45] border border-pv-accent/30 rounded-xl w-[520px] max-w-[92vw] p-0 gap-0">
        <DialogHeader className="px-4 py-3.5 border-b border-white/[0.08]">
          <DialogTitle className="text-sm font-bold text-pv-white">
            {editingId ? 'Detalle de tarea' : 'Nueva tarea'}
          </DialogTitle>
        </DialogHeader>
        <div className="px-4 py-4 flex flex-col gap-0">
          <label className="text-[10px] font-bold uppercase tracking-[0.7px] text-pv-gray mb-1.5">Nombre de la tarea</label>
          <input
            className={inputCls}
            placeholder="Ej: Planta arquitectónica nivel 2"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <label className="text-[10px] font-bold uppercase tracking-[0.7px] text-pv-gray mb-2">Estado</label>
          <div className="flex gap-1.5 mb-3">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${status === opt.value ? opt.active : opt.inactive}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.7px] text-pv-gray mb-1.5 block">Responsable</label>
              <select className={selectCls} value={owner} onChange={e => setOwner(e.target.value)}>
                {Object.values(ALL_MEMBERS).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.7px] text-pv-gray mb-1.5 block">Prioridad</label>
              <select className={selectCls} value={priority} onChange={e => setPriority(e.target.value as Deliverable['priority'])}>
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Media</option>
                <option value="baja">🟢 Baja</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.7px] text-pv-gray mb-1.5 block">Fecha de inicio</label>
              <input type="date" className={inputCls + ' mb-0'} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.7px] text-pv-gray mb-1.5 block">Fecha de vencimiento</label>
              <input type="date" className={inputCls + ' mb-0'} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <label className="text-[10px] font-bold uppercase tracking-[0.7px] text-pv-gray mb-1.5 mt-2.5 block">Notas</label>
          <textarea
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-3 py-2 text-xs text-pv-white font-mono outline-none transition-colors focus:border-pv-purple/50 focus:bg-pv-purple/6 resize-none leading-relaxed"
            rows={2}
            placeholder="Contexto adicional, dependencias, links..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        <div className="px-4 py-3 border-t border-white/[0.07] flex justify-end gap-1.5">
          {editingId && (
            <button
              onClick={remove}
              className="bg-pv-red/20 border border-pv-red/40 text-pv-red rounded-lg px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-pv-red/35 transition-all mr-auto"
            >
              Eliminar
            </button>
          )}
          <button onClick={onClose} className="bg-white/[0.07] border border-white/10 text-pv-white rounded-lg px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-white/12 transition-all">
            Cancelar
          </button>
          <button
            onClick={save}
            className="bg-gradient-to-br from-pv-purple to-[#5A3F9E] border-none text-white rounded-lg px-4 py-2 text-xs font-bold cursor-pointer hover:brightness-115 hover:-translate-y-px transition-all flex items-center gap-1.5"
          >
            <span>✓</span> Guardar tarea
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
