'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useAgent } from '@/lib/hooks/useAgent'
import { MinutaAction, MinutaPlan } from '@/lib/agent-prompts'
import type { DBProjectMember } from '@/lib/db-types'

interface DBMinutaModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  members?: DBProjectMember[]
  onApplied?: () => void
}

type Step = 'input' | 'review' | 'done'

function actionLabel(action: MinutaAction): string {
  if (action.type === 'update') {
    const changes = Object.entries(action.changes)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
    return `${action.name} → ${changes}`
  }
  if (action.type === 'note') {
    return action.name
  }
  return `${action.name} (${action.status} · ${action.priority})`
}

export default function DBMinutaModal({ open, onClose, projectId, members = [], onApplied }: DBMinutaModalProps) {
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState<Step>('input')
  const [plan, setPlan] = useState<MinutaPlan | null>(null)
  const [checked, setChecked] = useState<boolean[]>([])
  const [applying, setApplying] = useState(false)
  const [doneMessage, setDoneMessage] = useState('')
  const { processMinuta } = useAgent(projectId)

  async function handleProcess() {
    if (!text.trim()) return
    setProcessing(true)
    await processMinuta(text, (receivedPlan) => {
      setProcessing(false)
      if (receivedPlan && receivedPlan.actions.length > 0) {
        setPlan(receivedPlan)
        setChecked(receivedPlan.actions.map(() => true))
        setStep('review')
      } else {
        setPlan(receivedPlan ?? null)
        setDoneMessage(receivedPlan?.summary ?? 'No se detectaron acciones en la minuta.')
        setStep('done')
      }
    })
  }

  async function handleApply() {
    if (!plan) return
    setApplying(true)
    const selectedActions = plan.actions.filter((_, i) => checked[i])
    let applied = 0
    let created = 0

    for (const action of selectedActions) {
      try {
        if (action.type === 'update') {
          const body: Record<string, string> = {}
          if (action.changes.status) body.status = action.changes.status
          if (action.changes.priority) body.priority = action.changes.priority
          if (action.changes.dueDate) body.dueDate = action.changes.dueDate
          await fetch(`/api/projects/${projectId}/deliverables/${action.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          applied++
        } else if (action.type === 'note') {
          await fetch(`/api/projects/${projectId}/deliverables/${action.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: action.note }),
          })
          applied++
        } else if (action.type === 'create') {
          const validStatuses = ['ok', 'warn', 'danger']
          const safeStatus = validStatuses.includes(action.status) ? action.status : 'warn'
          const validPriorities = ['alta', 'media', 'baja']
          const safePriority = validPriorities.includes(action.priority) ? action.priority : 'media'
          const matchedMember = action.ownerName
            ? members.find(m => m.name.toLowerCase() === action.ownerName!.toLowerCase())
            : undefined
          await fetch(`/api/projects/${projectId}/deliverables`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: action.name,
              status: safeStatus,
              priority: safePriority,
              meta: 'minuta',
              ownerName: action.ownerName ?? null,
              ownerId: matchedMember?.userId ?? null,
              dueDate: action.dueDate ?? null,
              startDate: action.startDate ?? null,
            }),
          })
          applied++
          created++
        }
      } catch {
        // continue with remaining actions
      }
    }

    setApplying(false)

    // Persist audit trail for this minuta
    try {
      const title = plan.summary.split('.')[0].slice(0, 80) || 'Minuta sin título'
      await fetch(`/api/projects/${projectId}/minutas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          inputText: text,
          summary: plan.summary,
          actionsJson: JSON.stringify(selectedActions),
        }),
      })
    } catch {
      // non-blocking — don't fail the flow if saving audit fails
    }

    setDoneMessage(`✦ ${applied} acción(es) aplicada(s).${created > 0 ? ` ${created} entregable(s) creado(s).` : ''}`)
    setStep('done')
    onApplied?.()
  }

  function handleClose() {
    setText('')
    setProcessing(false)
    setStep('input')
    setPlan(null)
    setChecked([])
    setApplying(false)
    setDoneMessage('')
    onClose()
  }

  const selectedCount = checked.filter(Boolean).length

  const updateActions = plan?.actions.filter(a => a.type === 'update') ?? []
  const noteActions = plan?.actions.filter(a => a.type === 'note') ?? []
  const createActions = plan?.actions.filter(a => a.type === 'create') ?? []

  function getGlobalIndex(type: 'update' | 'note' | 'create', localIndex: number): number {
    if (!plan) return 0
    if (type === 'update') return plan.actions.findIndex((a, i) => a.type === 'update' && plan.actions.slice(0, i + 1).filter(x => x.type === 'update').length === localIndex + 1)
    if (type === 'note') return plan.actions.findIndex((a, i) => a.type === 'note' && plan.actions.slice(0, i + 1).filter(x => x.type === 'note').length === localIndex + 1)
    return plan.actions.findIndex((a, i) => a.type === 'create' && plan.actions.slice(0, i + 1).filter(x => x.type === 'create').length === localIndex + 1)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="bg-[#0C1F35] border border-white/[0.10] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-[16px] font-bold text-white">
            ✦ Procesar minuta
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-1">

          {/* Step 1: Input */}
          {step === 'input' && (
            <>
              {processing ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <span className="w-6 h-6 border-2 border-white/20 border-t-[#2E8FC0] rounded-full animate-spin" />
                  <p className="text-[12px] text-pv-gray">Analizando minuta con IA...</p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-pv-gray">
                    Pega el texto de la minuta. El agente IA identificará los pendientes y acuerdos para revisión antes de aplicar.
                  </p>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ej: Se aprobó el cambio de fachada. Juan revisará los planos antes del viernes. El cliente solicitó agregar un baño en planta baja..."
                    className="min-h-[180px] bg-white/[0.05] border-white/[0.12] text-[12px] text-white placeholder:text-pv-gray resize-none focus:border-[#2E8FC0]/50"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleClose}
                      className="px-3 py-1.5 text-[11px] text-pv-gray hover:text-white border border-white/[0.10] rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleProcess}
                      disabled={!text.trim()}
                      className="px-4 py-1.5 text-[11px] font-semibold text-white bg-[#2E8FC0] hover:bg-[#2E8FC0]/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      ✦ Analizar minuta
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Step 2: Review */}
          {step === 'review' && plan && (
            <>
              <div className="text-[11px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-pv-gray">
                {plan.summary}
              </div>

              <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1">
                {updateActions.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-pv-accent uppercase tracking-wider">✏ Actualizar</p>
                    {updateActions.map((action, li) => {
                      const gi = getGlobalIndex('update', li)
                      return (
                        <label key={gi} className="flex items-start gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={checked[gi] ?? true}
                            onChange={(e) => {
                              const next = [...checked]
                              next[gi] = e.target.checked
                              setChecked(next)
                            }}
                            className="mt-0.5 accent-[#2E8FC0] cursor-pointer"
                          />
                          <span className="text-[11px] text-white group-hover:text-pv-accent transition-colors">
                            {actionLabel(action)}
                            {action.type === 'update' && (
                              <span className="ml-1 text-[10px] text-pv-gray">— {action.reason}</span>
                            )}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {noteActions.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-pv-amber uppercase tracking-wider">📝 Agregar nota</p>
                    {noteActions.map((action, li) => {
                      const gi = getGlobalIndex('note', li)
                      return (
                        <label key={gi} className="flex items-start gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={checked[gi] ?? true}
                            onChange={(e) => {
                              const next = [...checked]
                              next[gi] = e.target.checked
                              setChecked(next)
                            }}
                            className="mt-0.5 accent-[#2E8FC0] cursor-pointer"
                          />
                          <span className="text-[11px] text-white group-hover:text-pv-accent transition-colors">
                            {action.name}
                            <span className="block text-[10px] text-pv-gray mt-0.5">{action.type === 'note' ? action.note : ''}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {createActions.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-pv-green uppercase tracking-wider">＋ Crear nuevo</p>
                    {createActions.map((action, li) => {
                      const gi = getGlobalIndex('create', li)
                      return (
                        <label key={gi} className="flex items-start gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={checked[gi] ?? true}
                            onChange={(e) => {
                              const next = [...checked]
                              next[gi] = e.target.checked
                              setChecked(next)
                            }}
                            className="mt-0.5 accent-[#2E8FC0] cursor-pointer"
                          />
                          <span className="text-[11px] text-white group-hover:text-pv-accent transition-colors">
                            {actionLabel(action)}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 text-[11px] text-pv-gray hover:text-white border border-white/[0.10] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApply}
                  disabled={selectedCount === 0 || applying}
                  className="px-4 py-1.5 text-[11px] font-semibold text-white bg-[#2E8FC0] hover:bg-[#2E8FC0]/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {applying ? (
                    <>
                      <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    `Aplicar ${selectedCount} cambio${selectedCount !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <>
              <div className="text-[11px] px-3 py-2 rounded-lg border bg-[#2A9B6F]/10 border-[#2A9B6F]/30 text-[#2A9B6F]">
                {doneMessage}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 text-[11px] text-pv-gray hover:text-white border border-white/[0.10] rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
