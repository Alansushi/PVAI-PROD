'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/lib/context/ToastContext'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const PROJECT_TYPES = [
  'Proyecto ejecutivo',
  'Anteproyecto',
  'Remodelación',
  'Construcción',
  'Otro',
]

export default function NewProjectModal({ open, onClose, onCreated }: Props) {
  const { showToast } = useToast()
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

  useEffect(() => { setError(null) }, [open])

  if (!open) return null

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    setError(null)
    try {
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
        }),
      })
      if (res.ok) {
        onCreated()
        onClose()
        showToast('Proyecto creado')
        setForm({ title: '', type: 'Proyecto ejecutivo', status: 'ok', startDate: '', endDate: '', nextPaymentAmount: '', nextPaymentStatus: '' })
      } else {
        setError('No se pudo crear el proyecto. Intenta de nuevo.')
      }
    } catch {
      setError('No se pudo crear el proyecto. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-[#0C1F35] border border-white/[0.10] rounded-2xl p-6 w-[420px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-[17px] font-bold text-white mb-5">Nuevo proyecto</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Nombre */}
          <div>
            <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
              Nombre del proyecto *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Casa Monterrey 2025"
              className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
            />
          </div>

          {/* Tipo + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-pv-accent/50 transition-colors appearance-none"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#0C1F35]">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Estado</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-pv-accent/50 transition-colors appearance-none"
              >
                <option value="ok" className="bg-[#0C1F35]">Al corriente</option>
                <option value="warn" className="bg-[#0C1F35]">En riesgo</option>
                <option value="danger" className="bg-[#0C1F35]">Cobro vencido</option>
              </select>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Fecha inicio</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-pv-accent/50 transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Fecha fin</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-pv-accent/50 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Próximo cobro */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Próximo cobro</label>
              <input
                type="text"
                value={form.nextPaymentAmount}
                onChange={(e) => set('nextPaymentAmount', e.target.value)}
                placeholder="$120,000"
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Estado cobro</label>
              <input
                type="text"
                value={form.nextPaymentStatus}
                onChange={(e) => set('nextPaymentStatus', e.target.value)}
                placeholder="Pendiente"
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-[11px] text-pv-red bg-pv-red/10 border border-pv-red/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-[11px] font-semibold text-pv-gray border border-white/[0.10] rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !form.title.trim()}
              className="flex-1 px-3 py-2 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                  Creando...
                </>
              ) : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
