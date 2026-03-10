'use client'

import Link from 'next/link'
import { getAllProjects } from '@/lib/data/projects'
import { ALL_MEMBERS } from '@/lib/data/members'

const STATUS_DOT: Record<string, string> = {
  ok:     'bg-[#2A9B6F]',
  warn:   'bg-[#E09B3D]',
  danger: 'bg-[#D94F4F]',
}
const STATUS_BAR: Record<string, string> = {
  ok:     'bg-[#2A9B6F]',
  warn:   'bg-[#E09B3D]',
  danger: 'bg-[#D94F4F]',
}
const STATUS_BADGE: Record<string, { bg: string; border: string; text: string; label: string }> = {
  ok:     { bg: 'bg-[#2A9B6F]/10', border: 'border-[#2A9B6F]/30', text: 'text-[#2A9B6F]',   label: '✓ Al corriente' },
  warn:   { bg: 'bg-[#E09B3D]/10', border: 'border-[#E09B3D]/30', text: 'text-[#E09B3D]',   label: '⚠ En riesgo' },
  danger: { bg: 'bg-[#D94F4F]/10', border: 'border-[#D94F4F]/30', text: 'text-[#D94F4F]',   label: '● Cobro vencido' },
}

// Upcoming critical deadlines hardcoded from project data
const UPCOMING = [
  { date: '16 mar', label: 'Ampliación cocina a 14m²',        project: 'Casa Pedregal',        owner: 'JV', ownerColor: '#2E8FC0', status: 'warn'   as const },
  { date: '18 mar', label: 'Memoria de cálculo estructural',   project: 'Casa Pedregal',        owner: 'ES', ownerColor: '#D94F4F', status: 'danger' as const },
  { date: '20 mar', label: 'Planta arquitectónica N1',         project: 'Oficinas Polanco',     owner: 'MT', ownerColor: '#E09B3D', status: 'warn'   as const },
  { date: '21 mar', label: 'Planos eléctricos',                project: 'Casa Pedregal',        owner: 'CI', ownerColor: '#7C5CBF', status: 'warn'   as const },
]

// Alerts for director attention
const ALERTS = [
  {
    type: 'danger' as const,
    title: 'Cobro vencido 18 días',
    desc: 'Remodelación Coyoacán — $36,000 MXN bloqueados. Falta bitácora firmada y acta de entrega.',
    action: 'Ver proyecto',
    href: '/demo/coyoacan',
  },
  {
    type: 'warn' as const,
    title: 'Riesgo de cobro — 2ª exhibición',
    desc: 'Casa Pedregal — $45,000 MXN dependen de la memoria estructural. El externo lleva 6 días sin avance.',
    action: 'Ver proyecto',
    href: '/demo/pedregal',
  },
]

const ALERT_STYLE = {
  danger: { bg: 'bg-[#D94F4F]/8', border: 'border-[#D94F4F]/25', icon: '🔴', text: 'text-[#D94F4F]' },
  warn:   { bg: 'bg-[#E09B3D]/8', border: 'border-[#E09B3D]/25', icon: '⚠️', text: 'text-[#E09B3D]' },
}

export default function DirectorDashboard() {
  const projects = getAllProjects()

  const totalCobro  = 45 + 28 + 36  // MXN K, from project data
  const vencido     = 36
  const enRiesgo    = projects.filter(p => p.dotStatus === 'warn' || p.dotStatus === 'danger').length
  const miembros    = Object.keys(ALL_MEMBERS).length

  return (
    <div className="p-5 flex flex-col gap-5">

      {/* ── Header ── */}
      <div>
        <h1 className="font-display text-[18px] font-bold text-white">Vista del despacho</h1>
        <p className="text-[11px] text-pv-gray mt-0.5">10 de marzo, 2026 · Director / Socios</p>
      </div>

      {/* ── KPIs globales ── */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
          <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-2">Total por cobrar</div>
          <div className="font-display text-[26px] font-black leading-none text-[#2E8FC0]">${totalCobro}K</div>
          <div className="text-[10px] text-pv-gray mt-1">en 3 proyectos activos</div>
        </div>
        <div className="bg-[#D94F4F]/[0.06] border border-[#D94F4F]/20 rounded-xl p-4">
          <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-2">Cobro vencido</div>
          <div className="font-display text-[26px] font-black leading-none text-[#D94F4F]">${vencido}K</div>
          <div className="text-[10px] text-[#D94F4F]/70 mt-1">18 días sin cobrar · Coyoacán</div>
        </div>
        <div className="bg-[#E09B3D]/[0.06] border border-[#E09B3D]/20 rounded-xl p-4">
          <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-2">Proyectos en riesgo</div>
          <div className="font-display text-[26px] font-black leading-none text-[#E09B3D]">{enRiesgo}</div>
          <div className="text-[10px] text-pv-gray mt-1">de {projects.length} proyectos totales</div>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
          <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-2">Equipo activo</div>
          <div className="font-display text-[26px] font-black leading-none text-white">{miembros}</div>
          <div className="text-[10px] text-pv-gray mt-1">colaboradores en proyectos</div>
        </div>
      </div>

      {/* ── Alertas críticas ── */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.8px] text-pv-gray">Alertas que requieren acción</h2>
        <div className="flex flex-col gap-2">
          {ALERTS.map((a, i) => {
            const s = ALERT_STYLE[a.type]
            return (
              <div key={i} className={`${s.bg} border ${s.border} rounded-xl px-4 py-3 flex items-center gap-3`}>
                <span className="text-[18px] flex-shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-[12px] font-semibold ${s.text}`}>{a.title}</div>
                  <div className="text-[11px] text-pv-gray mt-0.5">{a.desc}</div>
                </div>
                <Link
                  href={a.href}
                  className="flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white/8 border border-white/12 text-pv-white hover:bg-white/12 transition-colors no-underline"
                >
                  {a.action} →
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Proyectos y Próximos vencimientos (2 columnas) ── */}
      <div className="grid grid-cols-[1fr_260px] gap-4 items-start">

        {/* Tabla de proyectos */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.8px] text-pv-gray">Proyectos activos</h2>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="grid text-[9px] font-bold uppercase tracking-[0.5px] text-pv-gray px-4 py-2 border-b border-white/[0.07]"
              style={{ gridTemplateColumns: '1fr 80px 120px 110px 32px' }}>
              <span>Proyecto</span>
              <span className="text-right">Avance</span>
              <span className="text-right">Próximo cobro</span>
              <span className="text-right">Estado</span>
              <span />
            </div>
            {projects.map((p, i) => {
              const pct    = parseInt(p.kpis.k3v) || 0
              const badge  = STATUS_BADGE[p.dotStatus]
              const isLast = i === projects.length - 1
              const isDanger = p.dotStatus === 'danger'
              return (
                <Link
                  key={p.id}
                  href={`/demo/${p.id}`}
                  className={`grid items-center gap-2.5 px-4 py-3 no-underline text-pv-white transition-colors hover:bg-white/[0.03]
                    ${!isLast ? 'border-b border-white/[0.05]' : ''}
                  `}
                  style={{ gridTemplateColumns: '1fr 80px 120px 110px 32px' }}
                >
                  {/* Nombre */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[p.dotStatus]}`} />
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold truncate">{p.title}</div>
                      <div className="text-[10px] text-pv-gray">{p.type}</div>
                    </div>
                  </div>
                  {/* Avance */}
                  <div className="text-right">
                    <div className="text-[11px] font-medium text-white mb-1">{pct}%</div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${STATUS_BAR[p.dotStatus]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {/* Cobro */}
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-white">{p.kpis.k1v}</div>
                    <div className={`text-[10px] mt-0.5 ${isDanger ? 'text-[#D94F4F]' : 'text-pv-gray'}`}>{p.kpis.k1p}</div>
                  </div>
                  {/* Badge */}
                  <div className={`text-right`}>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${badge.bg} ${badge.border} ${badge.text} whitespace-nowrap`}>
                      {badge.label}
                    </span>
                  </div>
                  {/* Arrow */}
                  <span className="text-pv-gray text-[12px] text-right">→</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Próximos vencimientos */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.8px] text-pv-gray">Vencimientos próximos</h2>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
            {UPCOMING.map((u, i) => {
              const dot = STATUS_DOT[u.status]
              return (
                <div
                  key={i}
                  className={`px-3.5 py-3 flex items-start gap-3 ${i < UPCOMING.length - 1 ? 'border-b border-white/[0.05]' : ''}`}
                >
                  <div className="flex-shrink-0 text-center pt-0.5 w-8">
                    <div className="text-[10px] font-bold text-pv-gray">{u.date.split(' ')[0]}</div>
                    <div className="text-[9px] text-pv-gray/60">{u.date.split(' ')[1]}</div>
                  </div>
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-white truncate">{u.label}</div>
                    <div className="text-[10px] text-pv-gray mt-0.5">{u.project}</div>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ backgroundColor: u.ownerColor }}
                  >
                    {u.owner}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Equipo ── */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.8px] text-pv-gray">Equipo y carga de trabajo</h2>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(ALL_MEMBERS).map(m => {
            const donePct = m.tasks > 0 ? Math.round((m.done / m.tasks) * 100) : 0
            return (
              <div key={m.id} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5 flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-white truncate">{m.name}</div>
                  <div className="text-[10px] text-pv-gray mb-2">{m.role}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#2E8FC0]" style={{ width: `${donePct}%` }} />
                    </div>
                    <span className="text-[10px] text-pv-gray flex-shrink-0">{m.done}/{m.tasks}</span>
                  </div>
                  {m.active.length > 0 && (
                    <div className="mt-1.5 text-[9px] text-pv-gray/80 truncate">↳ {m.active[0]}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
