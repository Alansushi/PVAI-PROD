'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import NewProjectButton from '@/components/dashboard/NewProjectButton'
import { toLocalDate } from '@/lib/dates'
import { getCached, setCached } from '@/lib/client-cache'

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

type Deliverable = {
  id: string
  name: string
  status: string
  dueDate: string | null
  ownerName: string | null
}
type Member = {
  id: string
  userId: string | null
  name: string
  initials: string
  color: string
}
type Project = {
  id: string
  title: string
  type: string
  status: string
  nextPaymentAmount: string | null
  nextPaymentStatus: string | null
  budget: number | null
  billedAmount: number | null
  deliverables: Deliverable[]
  members: Member[]
}

const CACHE_KEY = 'dashboard-inicio'
type CachedData = { projects: Project[]; orgName: string }

function InicioSkeleton() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="h-5 w-48 bg-white/[0.06] rounded animate-pulse" />
        <div className="h-3 w-32 bg-white/[0.06] rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-2">
            <div className="h-2 w-20 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-7 w-12 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-2 w-16 bg-white/[0.06] rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_260px] gap-4 items-start">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-6 w-24 bg-white/[0.06] rounded animate-pulse" />
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="grid px-4 py-2 border-b border-white/[0.07] gap-2"
              style={{ gridTemplateColumns: '1fr 90px 110px 100px 110px 32px' }}>
              <div className="h-2 w-16 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-2 w-14 bg-white/[0.06] rounded animate-pulse ml-auto" />
              <div className="h-2 w-16 bg-white/[0.06] rounded animate-pulse ml-auto" />
              <div className="h-2 w-12 bg-white/[0.06] rounded animate-pulse ml-auto" />
              <div className="h-2 w-14 bg-white/[0.06] rounded animate-pulse ml-auto" />
              <div />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}
                className={`grid items-center gap-2.5 px-4 py-3 ${i < 3 ? 'border-b border-white/[0.05]' : ''}`}
                style={{ gridTemplateColumns: '1fr 90px 110px 100px 110px 32px' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-white/[0.06] animate-pulse flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <div className="h-3 w-32 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-2 w-20 bg-white/[0.06] rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <div className="h-2.5 w-8 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-1 w-16 bg-white/[0.06] rounded-full animate-pulse" />
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <div className="h-2.5 w-16 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-1 w-14 bg-white/[0.06] rounded-full animate-pulse" />
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <div className="h-2.5 w-16 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-2 w-12 bg-white/[0.06] rounded animate-pulse" />
                </div>
                <div className="h-4 w-20 bg-white/[0.06] rounded-full animate-pulse" />
                <div className="h-3 w-3 bg-white/[0.06] rounded animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-32 bg-white/[0.06] rounded animate-pulse" />
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}
                className={`px-3.5 py-3 flex items-start gap-3 ${i < 4 ? 'border-b border-white/[0.05]' : ''}`}>
                <div className="flex flex-col gap-1 items-center w-8 flex-shrink-0">
                  <div className="h-2.5 w-6 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-2 w-5 bg-white/[0.06] rounded animate-pulse" />
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/[0.06] animate-pulse mt-1.5 flex-shrink-0" />
                <div className="flex flex-col gap-1 flex-1">
                  <div className="h-3 w-full bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-2 w-20 bg-white/[0.06] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardInicio() {
  const cached = getCached<CachedData>(CACHE_KEY)
  const [projects, setProjects] = useState<Project[]>(cached?.projects ?? [])
  const [orgName, setOrgName] = useState(cached?.orgName ?? '')
  const [loading, setLoading] = useState(!cached)

  const fetchProjects = useCallback(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(({ projects, orgName }) => {
        const data: CachedData = { projects: projects ?? [], orgName: orgName ?? '' }
        setCached(CACHE_KEY, data)
        setProjects(data.projects)
        setOrgName(data.orgName)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Always revalidate in background; only blocks on first load (no cache)
  useEffect(() => { fetchProjects() }, [fetchProjects])

  if (loading) return <InicioSkeleton />

  const today = new Date()
  const dateStr = today.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

  const enRiesgo = projects.filter((p) => p.status === 'warn' || p.status === 'danger').length
  const danger   = projects.filter((p) => p.status === 'danger')

  const totalDeliverables = projects.reduce((acc, p) => acc + p.deliverables.length, 0)
  const totalDone         = projects.reduce((acc, p) => acc + p.deliverables.filter(d => d.status === 'ok').length, 0)
  const globalPct         = totalDeliverables > 0 ? Math.round((totalDone / totalDeliverables) * 100) : 0
  const uniqueMembers     = new Set(projects.flatMap((p) => p.members.map((m) => m.userId ?? m.name))).size

  const upcoming = projects
    .flatMap((p) =>
      p.deliverables
        .filter((d) => d.dueDate && d.status !== 'ok')
        .map((d) => ({ ...d, projectTitle: p.title, dueDate: toLocalDate(d.dueDate)! }))
    )
    .filter((d) => {
      const diff = (d.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      return diff >= -1 && diff <= 14
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5)

  const teamMap = new Map<string, { name: string; initials: string; color: string; done: number; total: number }>()
  for (const p of projects) {
    for (const m of p.members) {
      const key = m.userId ?? m.name
      const existing = teamMap.get(key)
      const memberDeliverables = p.deliverables.filter(d => d.ownerName === m.name)
      const memberDone = memberDeliverables.filter(d => d.status === 'ok').length
      if (existing) {
        existing.done  += memberDone
        existing.total += memberDeliverables.length
      } else {
        teamMap.set(key, { name: m.name, initials: m.initials, color: m.color, done: memberDone, total: memberDeliverables.length })
      }
    }
  }
  const team = Array.from(teamMap.values()).slice(0, 6)

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-[18px] font-bold text-white">Vista del despacho</h1>
        <p className="text-[11px] text-pv-gray mt-0.5">
          {dateStr} · {orgName}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
          <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-2">Proyectos totales</div>
          <div className="font-display text-[26px] font-black leading-none text-[#2E8FC0]">
            {projects.length}
          </div>
          <div className="text-[10px] text-pv-gray mt-1">proyectos activos</div>
        </div>
        <div className={`${enRiesgo > 0 ? 'bg-[#E09B3D]/[0.06] border-[#E09B3D]/20' : 'bg-white/[0.04] border-white/[0.08]'} border rounded-xl p-4`}>
          <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-2">En riesgo</div>
          <div className={`font-display text-[26px] font-black leading-none ${enRiesgo > 0 ? 'text-[#E09B3D]' : 'text-white'}`}>
            {enRiesgo}
          </div>
          <div className="text-[10px] text-pv-gray mt-1">de {projects.length} proyectos</div>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
          <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-2">Completadas %</div>
          <div className="font-display text-[26px] font-black leading-none text-white">
            {globalPct}%
          </div>
          <div className="text-[10px] text-pv-gray mt-1">{totalDone}/{totalDeliverables} entregables</div>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
          <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-2">Miembros</div>
          <div className="font-display text-[26px] font-black leading-none text-white">
            {uniqueMembers}
          </div>
          <div className="text-[10px] text-pv-gray mt-1">colaboradores</div>
        </div>
      </div>

      {/* Alertas críticas */}
      {danger.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.8px] text-[#D94F4F]">
            Alertas críticas
          </h2>
          {danger.map(p => (
            <Link
              href={`/dashboard/${p.id}`}
              key={p.id}
              className="bg-[#D94F4F]/[0.06] border border-[#D94F4F]/20 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-[#D94F4F]/10 transition-colors no-underline"
            >
              <span className="w-2 h-2 rounded-full bg-[#D94F4F] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-white">{p.title}</div>
                <div className="text-[10px] text-[#D94F4F]/80">Cobro vencido · Atención requerida</div>
              </div>
              <span className="text-pv-gray text-[12px]">→</span>
            </Link>
          ))}
        </div>
      )}

      {/* Projects + upcoming deadlines */}
      <div className="grid grid-cols-[1fr_260px] gap-4 items-start">
        {/* Projects table */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.8px] text-pv-gray">
              Proyectos activos
            </h2>
            <NewProjectButton onCreated={fetchProjects} />
          </div>

          {projects.length === 0 ? (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-8 text-center">
              <div className="text-[32px] mb-3">🏗</div>
              <div className="text-[14px] font-semibold text-white mb-1">Sin proyectos aún</div>
              <div className="text-[12px] text-pv-gray">
                Crea tu primer proyecto desde el panel lateral o desde Supabase Studio.
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
              <div
                className="grid text-[9px] font-bold uppercase tracking-[0.5px] text-pv-gray px-4 py-2 border-b border-white/[0.07]"
                style={{ gridTemplateColumns: '1fr 90px 110px 100px 110px 32px' }}
              >
                <span>Proyecto</span>
                <span className="text-right">Entregables</span>
                <span className="text-right">Presupuesto</span>
                <span className="text-right">Cobro</span>
                <span className="text-right">Estado</span>
                <span />
              </div>
              {projects.map((p, i) => {
                const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE.ok
                const done  = p.deliverables.filter((d) => d.status === 'ok').length
                const total = p.deliverables.length
                const pct   = total > 0 ? Math.round((done / total) * 100) : 0
                const overdueCount = p.deliverables.filter(
                  (d) => d.status !== 'ok' && d.dueDate && new Date(d.dueDate) < today
                ).length
                const budgetPct = p.budget && p.billedAmount != null
                  ? Math.min(100, Math.round((p.billedAmount / p.budget) * 100))
                  : null
                const isLast = i === projects.length - 1
                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/${p.id}`}
                    className={`grid items-center gap-2.5 px-4 py-3 no-underline text-pv-white transition-colors hover:bg-white/[0.03]
                      ${!isLast ? 'border-b border-white/[0.05]' : ''}`}
                    style={{ gridTemplateColumns: '1fr 90px 110px 100px 110px 32px' }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[p.status] ?? 'bg-pv-gray'}`} />
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold truncate">{p.title}</div>
                        <div className="text-[10px] text-pv-gray">{p.type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-medium text-white mb-1">{pct}%</div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${STATUS_BAR[p.status] ?? 'bg-pv-gray'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {overdueCount > 0 && (
                        <div className="text-[9px] text-[#D94F4F] mt-1 font-medium">
                          {overdueCount} vencida{overdueCount !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {p.budget != null ? (
                        <>
                          <div className="text-[11px] font-medium text-white">
                            ${p.budget.toLocaleString('es-MX')}
                          </div>
                          {budgetPct != null && (
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${budgetPct >= 90 ? 'bg-[#D94F4F]' : budgetPct >= 70 ? 'bg-[#E09B3D]' : 'bg-[#2A9B6F]'}`}
                                style={{ width: `${budgetPct}%` }}
                              />
                            </div>
                          )}
                          {p.billedAmount != null && (
                            <div className="text-[9px] text-pv-gray mt-0.5">
                              facturado ${p.billedAmount.toLocaleString('es-MX')}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-[10px] text-pv-gray/40">—</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-medium text-[#2A9B6F]">{p.nextPaymentAmount ?? '—'}</div>
                      <div className="text-[9px] text-pv-gray">{p.nextPaymentStatus ?? ''}</div>
                    </div>
                    <div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${badge.bg} ${badge.border} ${badge.text} whitespace-nowrap`}>
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-pv-gray text-[12px] text-right">→</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming deadlines */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.8px] text-pv-gray">
            Vencimientos próximos
          </h2>
          {upcoming.length === 0 ? (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 text-center">
              <div className="text-[11px] text-pv-gray">Sin vencimientos próximos</div>
            </div>
          ) : (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
              {upcoming.map((d, i) => {
                const dot = STATUS_DOT[d.status] ?? 'bg-pv-gray'
                const dateLabel = d.dueDate
                  ? d.dueDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                  : ''
                return (
                  <div
                    key={d.id}
                    className={`px-3.5 py-3 flex items-start gap-3 ${i < upcoming.length - 1 ? 'border-b border-white/[0.05]' : ''}`}
                  >
                    <div className="flex-shrink-0 text-center pt-0.5 w-8">
                      <div className="text-[10px] font-bold text-pv-gray">{dateLabel.split(' ')[0]}</div>
                      <div className="text-[9px] text-pv-gray/60">{dateLabel.split(' ')[1]}</div>
                    </div>
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-white truncate">{d.name}</div>
                      <div className="text-[10px] text-pv-gray mt-0.5">{d.projectTitle}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Equipo del despacho */}
      {team.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.8px] text-pv-gray">
            Equipo del despacho
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {team.map((member) => {
              const pct = member.total > 0 ? Math.round((member.done / member.total) * 100) : 0
              return (
                <div
                  key={member.name}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-3 flex items-center gap-3"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                    style={{ background: member.color }}
                  >
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-white truncate">{member.name}</div>
                    <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2E8FC0] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-pv-gray mt-1">
                      {member.done}/{member.total} completadas
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
