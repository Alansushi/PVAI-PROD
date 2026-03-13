'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useAgent } from '@/lib/hooks/useAgent'
import { MinutaAction, MinutaPlan } from '@/lib/agent-prompts'
import type { DBProjectMember } from '@/lib/db-types'

interface DeliverableStub {
  id: string
  name: string
  status: string
}

interface DBMinutaModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  members?: DBProjectMember[]
  deliverables?: DeliverableStub[]
  onApplied?: () => void
}

type Step = 'input' | 'review' | 'empty' | 'done'

const MAX_CHARS = 5500

function safeDate(val?: string): string | null {
  if (!val) return null
  const d = new Date(val)
  if (isNaN(d.getTime())) return null
  const now = Date.now()
  if (d.getTime() < now - 30 * 86400000 || d.getTime() > now + 5 * 365 * 86400000) return null
  return val
}

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
  if (action.type === 'reassign') {
    return `${action.name} → responsable: ${action.ownerName}`
  }
  return `${action.name} (${action.status} · ${action.priority})`
}

export default function DBMinutaModal({
  open,
  onClose,
  projectId,
  members = [],
  deliverables = [],
  onApplied,
}: DBMinutaModalProps) {
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState<Step>('input')
  const [plan, setPlan] = useState<MinutaPlan | null>(null)
  const [checked, setChecked] = useState<boolean[]>([])
  const [applying, setApplying] = useState(false)
  const [doneMessage, setDoneMessage] = useState('')
  const [inputError, setInputError] = useState('')
  const [inputWarning, setInputWarning] = useState('')
  const { processMinuta } = useAgent(projectId)

  async function handleProcess() {
    setInputError('')
    setInputWarning('')

    // F1: Too short
    if (text.trim().length < 80) {
      setInputError('La minuta es muy corta para analizar. Incluye los acuerdos tomados (mín. 80 caracteres).')
      return
    }
    // F3: No deliverables
    if (deliverables.length === 0) {
      setInputError('Este proyecto no tiene entregables. Crea entregables primero para que la IA pueda mapear acciones.')
      return
    }

    // F2: Too long — truncate with warning
    let processText = text
    if (text.length > MAX_CHARS) {
      processText = text.slice(0, MAX_CHARS)
      setInputWarning(`El texto fue truncado a ${MAX_CHARS} caracteres para el análisis.`)
    }

    setProcessing(true)
    await processMinuta(processText, (receivedPlan) => {
      setProcessing(false)

      if (!receivedPlan) {
        setPlan(null)
        setDoneMessage('No se pudo procesar la minuta.')
        setStep('done')
        return
      }

      // F9: Validate IDs post-response
      const validIds = new Set(deliverables.map(d => d.id))
      const validatedActions = receivedPlan.actions.map(action => {
        if (
          (action.type === 'update' || action.type === 'note' || action.type === 'reassign') &&
          !validIds.has(action.id)
        ) {
          return { ...action, _invalid: true, _reason: 'ID no encontrado en el proyecto' }
        }
        return action
      })

      const validatedPlan: MinutaPlan = { ...receivedPlan, actions: validatedActions }
      setPlan(validatedPlan)
      setChecked(validatedActions.map(() => true))

      if (validatedActions.filter(a => !('_invalid' in a && a._invalid)).length === 0) {
        setStep('empty')
      } else {
        setStep('review')
      }
    })
  }

  async function handleSaveOnlyAudit() {
    if (!plan) return
    const title = (plan.summary.split('.')[0] || 'Minuta sin título').slice(0, 80)
    try {
      await fetch(`/api/projects/${projectId}/minutas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          inputText: text,
          summary: plan.summary,
          actionsJson: '[]',
        }),
      })
    } catch {
      // non-blocking
    }
    setDoneMessage('✦ Minuta guardada como registro. No se aplicaron cambios.')
    setStep('done')
    onApplied?.()
  }

  async function handleApply() {
    if (!plan) return
    setApplying(true)
    const selectedActions = plan.actions.filter((a, i) => checked[i] && !('_invalid' in a && a._invalid))
    let applied = 0
    let created = 0

    for (const action of selectedActions) {
      try {
        if (action.type === 'update') {
          const body: Record<string, string | null> = {}
          if (action.changes.status) body.status = action.changes.status
          if (action.changes.priority) body.priority = action.changes.priority
          const safeD = safeDate(action.changes.dueDate)
          if (safeD !== undefined) body.dueDate = safeD
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
        } else if (action.type === 'reassign') {
          const matchedMember = members.find(
            m => m.name.toLowerCase() === action.ownerName.toLowerCase()
          )
          await fetch(`/api/projects/${projectId}/deliverables/${action.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ownerName: action.ownerName,
              ownerId: matchedMember?.userId ?? null,
            }),
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
              dueDate: safeDate(action.dueDate) ?? null,
              startDate: safeDate(action.startDate) ?? null,
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

    // Persist audit trail
    try {
      const title = (plan.summary.split('.')[0] || 'Minuta sin título').slice(0, 80)
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
      // non-blocking
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
    setInputError('')
    setInputWarning('')
    onClose()
  }

  const validActions = plan?.actions.filter(a => !('_invalid' in a && a._invalid)) ?? []
  const selectedCount = checked.filter((c, i) => c && plan?.actions[i] && !('_invalid' in plan.actions[i] && (plan.actions[i] as MinutaAction & { _invalid?: boolean })._invalid)).length

  const updateActions = plan?.actions.filter(a => a.type === 'update') ?? []
  const noteActions = plan?.actions.filter(a => a.type === 'note') ?? []
  const createActions = plan?.actions.filter(a => a.type === 'create') ?? []
  const reassignActions = plan?.actions.filter(a => a.type === 'reassign') ?? []

  function getGlobalIndex(type: 'update' | 'note' | 'create' | 'reassign', localIndex: number): number {
    if (!plan) return 0
    let count = 0
    for (let i = 0; i < plan.actions.length; i++) {
      if (plan.actions[i].type === type) {
        if (count === localIndex) return i
        count++
      }
    }
    return 0
  }

  // Coverage indicator
  const coveredIds = new Set(validActions.filter(a => 'id' in a).map(a => (a as { id: string }).id))
  const coveragePct = deliverables.length > 0
    ? Math.round((coveredIds.size / deliverables.length) * 100)
    : 0

  const charCount = text.length
  const charColor = charCount > MAX_CHARS ? 'text-pv-red' : charCount > 4000 ? 'text-pv-amber' : 'text-pv-gray'

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
                  {inputError && (
                    <div className="text-[11px] px-3 py-2 rounded-lg border bg-pv-red/10 border-pv-red/30 text-pv-red">
                      {inputError}
                    </div>
                  )}
                  {inputWarning && (
                    <div className="text-[11px] px-3 py-2 rounded-lg border bg-pv-amber/10 border-pv-amber/30 text-pv-amber">
                      {inputWarning}
                    </div>
                  )}
                  <div className="relative">
                    <Textarea
                      value={text}
                      onChange={(e) => { setText(e.target.value); setInputError(''); setInputWarning('') }}
                      placeholder="Ej: Se aprobó el cambio de fachada. Juan revisará los planos antes del viernes. El cliente solicitó agregar un baño en planta baja..."
                      className="min-h-[180px] bg-white/[0.05] border-white/[0.12] text-[12px] text-white placeholder:text-pv-gray resize-none focus:border-[#2E8FC0]/50"
                    />
                    <span className={`absolute bottom-2 right-3 text-[10px] ${charColor}`}>
                      {charCount}/{MAX_CHARS}
                    </span>
                  </div>
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

          {/* Step 1b: Empty — no actions found */}
          {step === 'empty' && plan && (
            <>
              <div className="text-[11px] px-3 py-2 rounded-lg border bg-pv-amber/10 border-pv-amber/30 text-pv-amber">
                <p className="font-semibold mb-1">⚠ Sin acciones detectadas</p>
                <p>{plan.summary}</p>
              </div>
              <div className="text-[11px] text-pv-gray space-y-1">
                <p className="font-semibold text-white/60">Sugerencias:</p>
                <p>• Incluye acuerdos concretos: "Se aprobó...", "Queda pendiente..."</p>
                <p>• Menciona nombres de entregables o fechas específicas</p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setStep('input')}
                  className="px-3 py-1.5 text-[11px] text-pv-gray hover:text-white border border-white/[0.10] rounded-lg transition-colors"
                >
                  Volver a editar
                </button>
                <button
                  onClick={handleSaveOnlyAudit}
                  className="px-4 py-1.5 text-[11px] font-semibold text-white/70 hover:text-white border border-white/[0.15] rounded-lg transition-colors"
                >
                  Guardar solo como registro
                </button>
              </div>
            </>
          )}

          {/* Step 2: Review */}
          {step === 'review' && plan && (
            <>
              <div className="text-[11px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-pv-gray">
                {plan.summary}
                {deliverables.length > 0 && (
                  <span className="ml-2 text-[10px] text-white/30">
                    · {coveredIds.size}/{deliverables.length} entregables ({coveragePct}%)
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1">
                {updateActions.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-pv-accent uppercase tracking-wider">✏ Actualizar</p>
                    {updateActions.map((action, li) => {
                      const gi = getGlobalIndex('update', li)
                      const isInvalid = '_invalid' in action && action._invalid
                      const deliverable = deliverables.find(d => d.id === action.id)
                      const isConflict = deliverable &&
                        action.changes?.status &&
                        deliverable.status === 'ok' &&
                        action.changes.status !== 'ok'
                      return (
                        <label
                          key={gi}
                          className={`flex items-start gap-2 cursor-pointer group ${isInvalid ? 'opacity-40 pointer-events-none' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={!isInvalid && (checked[gi] ?? true)}
                            disabled={!!isInvalid}
                            onChange={(e) => {
                              const next = [...checked]
                              next[gi] = e.target.checked
                              setChecked(next)
                            }}
                            className="mt-0.5 accent-[#2E8FC0] cursor-pointer"
                          />
                          <span className="text-[11px] text-white group-hover:text-pv-accent transition-colors flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5 flex-wrap">
                              {actionLabel(action)}
                              {isConflict && (
                                <span className="text-[9px] bg-pv-amber/20 text-pv-amber px-1.5 py-0.5 rounded-full">
                                  ⚠ Actualmente completado
                                </span>
                              )}
                              {isInvalid && (
                                <span className="text-[9px] text-pv-red">✕ Entregable no encontrado</span>
                              )}
                            </span>
                            <span className="text-[10px] text-pv-gray">{action.reason}</span>
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
                      const isInvalid = '_invalid' in action && action._invalid
                      return (
                        <label
                          key={gi}
                          className={`flex items-start gap-2 cursor-pointer group ${isInvalid ? 'opacity-40 pointer-events-none' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={!isInvalid && (checked[gi] ?? true)}
                            disabled={!!isInvalid}
                            onChange={(e) => {
                              const next = [...checked]
                              next[gi] = e.target.checked
                              setChecked(next)
                            }}
                            className="mt-0.5 accent-[#2E8FC0] cursor-pointer"
                          />
                          <span className="text-[11px] text-white group-hover:text-pv-accent transition-colors flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5">
                              {action.name}
                              {isInvalid && (
                                <span className="text-[9px] text-pv-red">✕ Entregable no encontrado</span>
                              )}
                            </span>
                            <span className="block text-[10px] text-pv-gray">{action.note}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {reassignActions.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-pv-accent uppercase tracking-wider">👤 Reasignar</p>
                    {reassignActions.map((action, li) => {
                      const gi = getGlobalIndex('reassign', li)
                      const isInvalid = '_invalid' in action && action._invalid
                      return (
                        <label
                          key={gi}
                          className={`flex items-start gap-2 cursor-pointer group ${isInvalid ? 'opacity-40 pointer-events-none' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={!isInvalid && (checked[gi] ?? true)}
                            disabled={!!isInvalid}
                            onChange={(e) => {
                              const next = [...checked]
                              next[gi] = e.target.checked
                              setChecked(next)
                            }}
                            className="mt-0.5 accent-[#2E8FC0] cursor-pointer"
                          />
                          <span className="text-[11px] text-white group-hover:text-pv-accent transition-colors flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5">
                              {actionLabel(action)}
                              {isInvalid && (
                                <span className="text-[9px] text-pv-red">✕ Entregable no encontrado</span>
                              )}
                            </span>
                            <span className="text-[10px] text-pv-gray">{action.reason}</span>
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

              <div className="flex justify-between gap-2">
                <button
                  onClick={handleSaveOnlyAudit}
                  className="px-3 py-1.5 text-[11px] text-pv-gray hover:text-white border border-white/[0.10] rounded-lg transition-colors"
                >
                  Solo registro
                </button>
                <div className="flex gap-2">
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
