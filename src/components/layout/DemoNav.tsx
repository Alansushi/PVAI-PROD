'use client'

import { useState, useEffect, useRef } from 'react'
import { WA_URL } from '@/lib/constants'

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'warn' as const,
    title: 'Nueva tarea asignada',
    desc: 'Ampliación cocina a 14m²',
    project: 'Casa Pedregal',
    time: 'Hace 2 min',
  },
  {
    id: 2,
    type: 'ok' as const,
    title: 'Tarea completada',
    desc: 'Especificaciones técnicas v2',
    project: 'Casa Pedregal',
    time: 'Hace 5 min',
  },
  {
    id: 3,
    type: 'danger' as const,
    title: 'Cobro vencido',
    desc: 'Remodelación Coyoacán · $36K bloqueado 18 días',
    project: '',
    time: 'Hace 1 hora',
  },
]

const notifIcon = {
  warn:   { icon: '⚠', color: 'text-[#E09B3D]', dot: 'bg-[#E09B3D]' },
  ok:     { icon: '✓', color: 'text-[#2A9B6F]', dot: 'bg-[#2A9B6F]' },
  danger: { icon: '●', color: 'text-[#D94F4F]', dot: 'bg-[#D94F4F]' },
}

export default function DemoNav() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(NOTIFICATIONS.length)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function toggle() {
    if (!open) setUnread(0)
    setOpen(v => !v)
  }

  return (
    <nav className="flex justify-between items-center px-8 py-3.5 border-b border-white/[0.06] bg-[rgba(12,31,53,0.97)] backdrop-blur-xl sticky top-0 z-[200]">
      <div>
        <div className="font-display text-xl font-black">
          Proyecto<span className="text-pv-accent">.</span>Vivo
        </div>
        <div className="text-[10px] text-pv-gray mt-px">Tu agente IA de proyectos</div>
      </div>
      <div className="flex items-center gap-2.5">
        {/* Bell icon */}
        <div className="relative" ref={ref}>
          <button
            onClick={toggle}
            className="relative p-2 rounded-lg text-pv-gray hover:text-white hover:bg-white/8 transition-all"
            aria-label="Notificaciones"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#D94F4F] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#0F2A45] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <span className="text-[12px] font-semibold text-white">Notificaciones</span>
                <button onClick={() => setOpen(false)} className="text-pv-gray hover:text-white text-[16px] leading-none transition-colors">×</button>
              </div>
              <div className="flex flex-col">
                {NOTIFICATIONS.map((n, i) => {
                  const s = notifIcon[n.type]
                  return (
                    <div key={n.id} className={`px-4 py-3 ${i < NOTIFICATIONS.length - 1 ? 'border-b border-white/[0.06]' : ''} hover:bg-white/4 transition-colors`}>
                      <div className="flex items-start gap-2.5">
                        <span className={`${s.color} text-[13px] mt-px flex-shrink-0`}>{s.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-white">{n.title}</div>
                          <div className="text-[10px] text-pv-gray mt-0.5 truncate">{n.desc}{n.project ? ` · ${n.project}` : ''}</div>
                          <div className="text-[10px] text-pv-gray/60 mt-0.5">{n.time}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-[#25D366] text-white px-3.5 py-1.5 pl-2.5 rounded-full text-[11px] font-bold transition-all hover:bg-[#20c05a] hover:-translate-y-px"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.532 5.854L.057 23.882l6.186-1.452A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.003-1.37l-.36-.214-3.722.873.937-3.62-.234-.373A9.798 9.798 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
          </svg>
          Hablar con el equipo
        </a>
        <div className="bg-[rgba(224,155,61,0.2)] border border-[rgba(224,155,61,0.4)] text-pv-amber text-[11px] font-bold px-3.5 py-1.5 rounded-full">
          🎬 Modo demo
        </div>
      </div>
    </nav>
  )
}
