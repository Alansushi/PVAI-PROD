'use client'

import { useState } from 'react'
import type { Deliverable } from '@/lib/types'
import { useProjectContext } from '@/lib/context/ProjectContext'
import { ALL_MEMBERS } from '@/lib/data/members'
import { PRIORITY_COLORS } from '@/lib/constants'
import TaskModal from '@/components/modals/TaskModal'
import ProfileModal from '@/components/modals/ProfileModal'

interface Props {
  projectId: string
  delTitle: string
  delCount: string
  deliverables: Deliverable[]
}

const COL_CONFIG = [
  { key: 'ok' as const,     label: '✓ Completadas', cls: 'text-pv-green',  countCls: 'bg-pv-green/20 text-pv-green',  headCls: 'bg-pv-green/8',   borderCls: 'border-l-2 border-pv-green/50' },
  { key: 'warn' as const,   label: '⏳ En proceso',  cls: 'text-pv-amber',  countCls: 'bg-pv-amber/20 text-pv-amber',  headCls: 'bg-pv-amber/8',   borderCls: 'border-l-2 border-pv-amber/50' },
  { key: 'danger' as const, label: '🔴 En riesgo',   cls: 'text-pv-red',    countCls: 'bg-pv-red/20 text-pv-red',      headCls: 'bg-pv-red/8',     borderCls: 'border-l-2 border-pv-red/50' },
]

const DATE_CLS = {
  ok:     'text-pv-green bg-pv-green/15',
  warn:   'text-pv-amber bg-pv-amber/15',
  danger: 'text-pv-red bg-pv-red/15',
}

export default function KanbanBoard({ projectId, delTitle, delCount, deliverables }: Props) {
  const { getProject } = useProjectContext()
  const currentProject = getProject(projectId)
  const dels = currentProject?.deliverables ?? deliverables

  const [taskOpen, setTaskOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<Deliverable['status']>('warn')
  const [profileId, setProfileId] = useState<string | null>(null)

  function openNew(status: Deliverable['status']) {
    setEditingId(null)
    setDefaultStatus(status)
    setTaskOpen(true)
  }

  function openEdit(id: string) {
    setEditingId(id)
    setTaskOpen(true)
  }

  const byStatus = {
    ok:     dels.filter(d => d.status === 'ok'),
    warn:   dels.filter(d => d.status === 'warn'),
    danger: dels.filter(d => d.status === 'danger'),
  }

  return (
    <>
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.07] flex justify-between items-center">
          <h3 className="text-xs font-semibold">{delTitle}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-pv-gray">{delCount}</span>
            <button
              onClick={() => openNew('warn')}
              className="bg-pv-green/15 border border-pv-green/30 text-pv-green rounded-md px-2.5 py-1 text-[10px] font-bold cursor-pointer hover:bg-pv-green/25 transition-all"
            >
              + Nueva tarea
            </button>
          </div>
        </div>
        <div className="grid border-t border-white/[0.07]" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          {COL_CONFIG.map(col => (
            <div key={col.key} className={`border-r border-white/[0.06] last:border-r-0 flex flex-col min-h-[180px]`}>
              {/* Column header */}
              <div className={`px-3 py-2 flex items-center justify-between border-b border-white/[0.06] sticky top-0 z-[2] ${col.headCls}`}>
                <span className={`text-[10px] font-bold uppercase tracking-[0.6px] flex items-center gap-1.5 ${col.cls}`}>
                  {col.label}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${col.countCls}`}>
                    {byStatus[col.key].length}
                  </span>
                </span>
                <button
                  onClick={() => openNew(col.key)}
                  className="bg-none border-none text-pv-gray text-base cursor-pointer leading-none px-0.5 hover:text-pv-white transition-colors"
                >
                  +
                </button>
              </div>
              {/* Cards */}
              <div className="p-2 flex flex-col gap-1.5 flex-1">
                {byStatus[col.key].map(d => {
                  const m = ALL_MEMBERS[d.owner]
                  const dateStr = d.dueDate ? d.dueDate.slice(5).replace('-', '/') : '-'
                  return (
                    <div
                      key={d.id}
                      onClick={() => openEdit(d.id)}
                      className={`bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-2.5 cursor-pointer transition-all hover:bg-white/[0.07] hover:-translate-y-px hover:border-white/15 ${col.borderCls}`}
                    >
                      <div className="text-[11px] font-semibold mb-1 leading-snug">
                        {d.name}
                        {d.meta === 'minuta' && (
                          <span className="ml-1 text-[8px] font-bold bg-pv-purple/20 text-[#B89EE8] px-1 py-0.5 rounded">✦ minuta</span>
                        )}
                        {d.meta === 'agente' && (
                          <span className="ml-1 text-[8px] font-bold bg-pv-purple/20 text-[#B89EE8] px-1 py-0.5 rounded">✦ agente</span>
                        )}
                      </div>
                      <div className="text-[9px] text-pv-gray flex items-center gap-1 flex-wrap">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: PRIORITY_COLORS[d.priority] ?? '#8A9BB0' }}
                        />
                        {m ? (
                          <button
                            onClick={e => { e.stopPropagation(); setProfileId(d.owner) }}
                            className="text-pv-accent font-semibold no-underline text-[9px] border-none bg-none cursor-pointer hover:underline"
                          >
                            {m.name}
                          </button>
                        ) : '—'}
                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded ml-auto ${DATE_CLS[col.key]}`}>
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <TaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        projectId={projectId}
        editingId={editingId}
        defaultStatus={defaultStatus}
      />
      {profileId && (
        <ProfileModal memberId={profileId} projectTitle="" onClose={() => setProfileId(null)} />
      )}
    </>
  )
}
