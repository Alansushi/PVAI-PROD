'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/lib/context/ToastContext'
import { TEMPLATES } from '@/lib/templates'
import type { ProjectTemplate } from '@/lib/types'

const PROJECT_TYPES = [
  'Proyecto ejecutivo',
  'Anteproyecto',
  'Remodelación',
  'Construcción',
  'Otro',
]

const INPUT_CLASS =
  'w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors'

type Step = 1 | 2 | 3

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export default function NewProjectModal({ open, onClose, onCreated }: Props) {
  const { showToast } = useToast()
  const [step, setStep] = useState<Step>(1)
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    type: 'Proyecto ejecutivo',
    status: 'ok',
    startDate: '',
    endDate: '',
    nextPaymentAmount: '',
    nextPaymentStatus: '',
  })

  useEffect(() => {
    if (!open) {
      setStep(1)
      setSelectedTemplate(null)
      setCheckedIndices(new Set())
      setError(null)
      setForm({ title: '', type: 'Proyecto ejecutivo', status: 'ok', startDate: '', endDate: '', nextPaymentAmount: '', nextPaymentStatus: '' })
    }
  }, [open])

  if (!open) return null

  function setField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function pickTemplate(tmpl: ProjectTemplate) {
    setSelectedTemplate(tmpl)
    setField('type', PROJECT_TYPES.includes(tmpl.projectType) ? tmpl.projectType : 'Proyecto ejecutivo')
    setCheckedIndices(new Set(tmpl.defaultDeliverables.map((_, i) => i)))
    setStep(2)
  }

  function pickBlank() {
    setSelectedTemplate(null)
    setField('type', 'Proyecto ejecutivo')
    setCheckedIndices(new Set())
    setStep(2)
  }

  function toggleIndex(i: number) {
    setCheckedIndices(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const checkedCount = checkedIndices.size

  async function handleCreate() {
    if (!form.title.trim()) return
    setLoading(true)
    setError(null)
    try {
      const selectedDeliverables = selectedTemplate
        ? selectedTemplate.defaultDeliverables.filter((_, i) => checkedIndices.has(i))
        : []
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          type: form.type,
          status: form.status,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          nextPaymentAmount: form.nextPaymentAmount || null,
          nextPaymentStatus: form.nextPaymentStatus || null,
          templateId: selectedTemplate?.id ?? 'vacio',
          selectedDeliverables,
        }),
      })
      if (res.ok) {
        onCreated()
        onClose()
        showToast('Proyecto creado')
      } else {
        setError('No se pudo crear el proyecto. Intenta de nuevo.')
      }
    } catch {
      setError('No se pudo crear el proyecto. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1: Gallery ────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative z-10 bg-[#0C1F35] border border-white/[0.10] rounded-2xl p-6 w-[660px] shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="font-display text-[17px] font-bold text-white mb-1">Elige una plantilla</h2>
          <p className="text-[11px] text-pv-gray mb-5">
            Selecciona la que mejor describe tu proyecto para empezar con tareas pre-definidas.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                onClick={() => pickTemplate(tmpl)}
                className="text-left p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-pv-accent/50 hover:bg-pv-accent/[0.06] transition-all group"
              >
                <span className="text-[26px] mb-2 block">{tmpl.icon}</span>
                <p className="font-display text-[12px] font-bold text-white mb-0.5 group-hover:text-pv-accent transition-colors">
                  {tmpl.label}
                </p>
                <p className="text-[10px] text-pv-gray leading-tight mb-2.5">{tmpl.description}</p>
                <p className="text-[10px] text-pv-accent/70 font-medium">
                  {tmpl.defaultDeliverables.length} tareas · {tmpl.estimatedDuration} días
                </p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={pickBlank}
              className="text-[11px] text-pv-gray hover:text-white transition-colors flex items-center gap-1"
            >
              <span>→</span> Empezar en blanco
            </button>
            <button
              onClick={onClose}
              className="text-[11px] text-pv-gray hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2: Form ──────────────────────────────────────────────────────────────
  if (step === 2) {
    const hasPreview = selectedTemplate !== null && selectedTemplate.defaultDeliverables.length > 0
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative z-10 bg-[#0C1F35] border border-white/[0.10] rounded-2xl p-6 w-[460px] shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-5">
            {selectedTemplate && <span className="text-[20px]">{selectedTemplate.icon}</span>}
            <h2 className="font-display text-[17px] font-bold text-white">
              {selectedTemplate ? selectedTemplate.label : 'Nuevo proyecto'}
            </h2>
          </div>

          <div className="flex flex-col gap-3.5">
            <div>
              <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
                Nombre del proyecto *
              </label>
              <input
                type="text"
                autoFocus
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                placeholder="Casa Monterrey 2025"
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Tipo</label>
                <select value={form.type} onChange={e => setField('type', e.target.value)} className={INPUT_CLASS + ' appearance-none'}>
                  {PROJECT_TYPES.map(t => (
                    <option key={t} value={t} className="bg-[#0C1F35]">{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Estado</label>
                <select value={form.status} onChange={e => setField('status', e.target.value)} className={INPUT_CLASS + ' appearance-none'}>
                  <option value="ok" className="bg-[#0C1F35]">Al corriente</option>
                  <option value="warn" className="bg-[#0C1F35]">En riesgo</option>
                  <option value="danger" className="bg-[#0C1F35]">Cobro vencido</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Fecha inicio</label>
                <input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} className={INPUT_CLASS + ' [color-scheme:dark]'} />
              </div>
              <div>
                <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Fecha fin</label>
                <input type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)} className={INPUT_CLASS + ' [color-scheme:dark]'} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Próximo cobro</label>
                <input type="text" value={form.nextPaymentAmount} onChange={e => setField('nextPaymentAmount', e.target.value)} placeholder="$120,000" className={INPUT_CLASS} />
              </div>
              <div>
                <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Estado cobro</label>
                <input type="text" value={form.nextPaymentStatus} onChange={e => setField('nextPaymentStatus', e.target.value)} placeholder="Pendiente" className={INPUT_CLASS} />
              </div>
            </div>

            {error && (
              <p className="text-[11px] text-pv-red bg-pv-red/10 border border-pv-red/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-[11px] font-semibold text-pv-gray border border-white/[0.10] rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                ← Atrás
              </button>
              {hasPreview ? (
                <button
                  type="button"
                  disabled={!form.title.trim()}
                  onClick={() => setStep(3)}
                  className="flex-1 px-3 py-2 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading || !form.title.trim()}
                  onClick={handleCreate}
                  className="flex-1 px-3 py-2 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />Creando...</>
                  ) : 'Crear proyecto'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 3: Deliverable preview ───────────────────────────────────────────────
  if (!selectedTemplate) return null
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-[#0C1F35] border border-white/[0.10] rounded-2xl p-6 w-[500px] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[20px]">{selectedTemplate.icon}</span>
          <h2 className="font-display text-[17px] font-bold text-white">Tareas a crear</h2>
        </div>
        <p className="text-[11px] text-pv-gray mb-4">
          {checkedCount} de {selectedTemplate.defaultDeliverables.length} tareas seleccionadas
          {selectedTemplate.estimatedDuration > 0 && ` · ${selectedTemplate.estimatedDuration} días estimados`}
        </p>

        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 mb-5">
          {selectedTemplate.defaultDeliverables.map((d, i) => (
            <label
              key={i}
              className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              <input
                type="checkbox"
                checked={checkedIndices.has(i)}
                onChange={() => toggleIndex(i)}
                className="mt-0.5 accent-pv-accent flex-shrink-0"
              />
              <div className="min-w-0">
                <p className={`text-[12px] leading-tight transition-colors ${checkedIndices.has(i) ? 'text-white' : 'text-pv-gray/50 line-through'}`}>
                  {d.title}
                </p>
                {d.phase && (
                  <p className="text-[10px] text-pv-gray/50 mt-0.5">{d.phase} · día {d.daysOffset}</p>
                )}
              </div>
            </label>
          ))}
        </div>

        {error && (
          <p className="text-[11px] text-pv-red bg-pv-red/10 border border-pv-red/20 rounded-lg px-3 py-2 mb-3">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="px-4 py-2 text-[11px] font-semibold text-pv-gray border border-white/[0.10] rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            ← Atrás
          </button>
          <button
            type="button"
            disabled={loading || !form.title.trim()}
            onClick={handleCreate}
            className="flex-1 px-3 py-2 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />Creando...</>
            ) : checkedCount > 0 ? (
              `Crear proyecto con ${checkedCount} tarea${checkedCount !== 1 ? 's' : ''}`
            ) : (
              'Crear proyecto en blanco'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
