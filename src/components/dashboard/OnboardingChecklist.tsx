'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'pvai_onboarding_done'

const STEPS = [
  {
    id: 'project',
    icon: '🏗',
    title: 'Crea tu primer proyecto',
    description: 'Define nombre, tipo y fechas del proyecto.',
  },
  {
    id: 'member',
    icon: '👥',
    title: 'Agrega un miembro al equipo',
    description: 'Invita a un colaborador desde la vista del proyecto.',
  },
  {
    id: 'deliverable',
    icon: '✓',
    title: 'Crea un entregable',
    description: 'Agrega tareas con fecha de entrega y responsable.',
  },
  {
    id: 'ai',
    icon: '✦',
    title: 'Usa el Agente IA',
    description: 'Abre el panel de IA y elige una acción rápida.',
  },
  {
    id: 'agent_composer',
    icon: '⚡',
    title: 'Copiloto accionable',
    description: 'Usa el composer del panel IA — escribe una pregunta o elige un chip para obtener análisis con acciones ejecutables.',
  },
]

export default function OnboardingChecklist({ hasProjects }: { hasProjects: boolean }) {
  const [done, setDone] = useState(false)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY)
      if (val === 'true') { setDone(true); return }
      const checkedVal = localStorage.getItem(STORAGE_KEY + '_checked')
      if (checkedVal) setChecked(JSON.parse(checkedVal))
    } catch { /* ignore */ }
  }, [])

  // Auto-check "project" step if there are projects
  useEffect(() => {
    if (hasProjects && !checked['project']) {
      const next = { ...checked, project: true }
      setChecked(next)
      try { localStorage.setItem(STORAGE_KEY + '_checked', JSON.stringify(next)) } catch { /* ignore */ }
    }
  }, [hasProjects, checked])

  function toggle(id: string) {
    const next = { ...checked, [id]: !checked[id] }
    setChecked(next)
    try { localStorage.setItem(STORAGE_KEY + '_checked', JSON.stringify(next)) } catch { /* ignore */ }
    // If all steps done, mark complete after a short delay
    if (STEPS.every(s => next[s.id])) {
      setTimeout(() => {
        setDone(true)
        try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
      }, 600)
    }
  }

  function dismiss() {
    setDismissed(true)
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
  }

  if (done || dismissed) return null

  const completedCount = STEPS.filter(s => checked[s.id]).length

  return (
    <div className="bg-pv-accent/[0.07] border border-pv-accent/25 rounded-xl p-4 relative">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg text-pv-gray hover:text-white hover:bg-white/10 transition-colors text-base"
        aria-label="Cerrar"
      >
        ×
      </button>

      <div className="flex items-center gap-2 mb-3">
        <div className="text-[9px] font-bold uppercase tracking-[0.6px] text-pv-accent">Primeros pasos</div>
        <div className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pv-accent/20 text-pv-accent">
          {completedCount}/{STEPS.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-pv-accent rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {STEPS.map(step => (
          <button
            key={step.id}
            onClick={() => toggle(step.id)}
            className={`flex items-start gap-3 p-2.5 rounded-lg border text-left transition-all ${
              checked[step.id]
                ? 'bg-pv-green/10 border-pv-green/25 opacity-60'
                : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/15'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
              checked[step.id] ? 'bg-pv-green border-pv-green' : 'border-white/30'
            }`}>
              {checked[step.id] && (
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div>
              <div className={`text-[11px] font-semibold ${checked[step.id] ? 'text-pv-gray line-through' : 'text-white'}`}>
                {step.icon} {step.title}
              </div>
              <div className="text-[10px] text-pv-gray mt-0.5">{step.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
