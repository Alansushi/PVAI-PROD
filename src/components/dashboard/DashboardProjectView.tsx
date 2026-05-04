'use client'

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { DBProjectWithRelations, DBDeliverable, DBProjectMember, DBAuditLogEntry, DBDeliverablePackage, DBProjectRisk, DBProjectKPI, DBVelocityWeek } from '@/lib/db-types'
import { PRIORITY_COLORS, GANTT_THRESHOLD } from '@/lib/constants'
import { toLocalDate } from '@/lib/dates'
import DBTaskModal from './DBTaskModal'
import InviteMemberModal from './InviteMemberModal'
import DBMinutaModal from './DBMinutaModal'
import CollaboratorProfileModal from './CollaboratorProfileModal'
import { EmptyState } from '@/components/ui/EmptyState'
import ProjectTimelineWidget from './ProjectTimelineWidget'
import PriorityList from './PriorityList'
import ProjectNotesWidget from './ProjectNotesWidget'
import MinutasPanel from './MinutasPanel'
import PackageModal from './PackageModal'
import RiskModal from './RiskModal'
import RisksPanel from './RisksPanel'
import KPIModal from './KPIModal'
import KPIsPanel from './KPIsPanel'
import VelocityWidget from './VelocityWidget'
import CapacityWidget from './CapacityWidget'
import ProjectEditModal from './ProjectEditModal'
import MembersListModal from './MembersListModal'
import ShareSummaryDialog from '@/components/share/ShareSummaryDialog'

type ProjectWithRelations = DBProjectWithRelations

interface Props {
  project: ProjectWithRelations
}

const COL_CONFIG = [
  { key: 'ok',     label: '✓ Completadas', cls: 'text-pv-green',  countCls: 'bg-pv-green/20 text-pv-green',  headCls: 'bg-pv-green/8',   borderCls: 'border-l-2 border-pv-green/50' },
  { key: 'warn',   label: '⏳ En proceso',  cls: 'text-pv-amber',  countCls: 'bg-pv-amber/20 text-pv-amber',  headCls: 'bg-pv-amber/8',   borderCls: 'border-l-2 border-pv-amber/50' },
  { key: 'danger', label: '🔴 En riesgo',   cls: 'text-pv-red',    countCls: 'bg-pv-red/20 text-pv-red',      headCls: 'bg-pv-red/8',     borderCls: 'border-l-2 border-pv-red/50' },
]

const DATE_CLS: Record<string, string> = {
  ok:     'text-pv-green bg-pv-green/15',
  warn:   'text-pv-amber bg-pv-amber/15',
  danger: 'text-pv-red bg-pv-red/15',
}

const BAR_CLS: Record<string, string> = {
  ok:     'bg-pv-green/85 text-white',
  prog:   'bg-pv-accent/85 text-white',
  warn:   'bg-pv-amber/90 text-black',
  danger: 'bg-pv-red/90 text-white',
}

const STATUS_DOT: Record<string, string> = {
  ok:     'bg-pv-green',
  warn:   'bg-pv-amber',
  danger: 'bg-pv-red',
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

type ColSort = { key: 'createdAt' | 'updatedAt'; dir: 'desc' | 'asc' }
const DEFAULT_SORT: ColSort = { key: 'createdAt', dir: 'desc' }

const SORT_CYCLE: ColSort[] = [
  { key: 'createdAt', dir: 'desc' },
  { key: 'createdAt', dir: 'asc'  },
  { key: 'updatedAt', dir: 'desc' },
  { key: 'updatedAt', dir: 'asc'  },
]

function nextSort(current: ColSort): ColSort {
  const idx = SORT_CYCLE.findIndex(s => s.key === current.key && s.dir === current.dir)
  return SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]
}

function getSorted(items: DBDeliverable[], sort: ColSort): DBDeliverable[] {
  return [...items].sort((a, b) => {
    const av = new Date(a[sort.key]).getTime()
    const bv = new Date(b[sort.key]).getTime()
    return sort.dir === 'desc' ? bv - av : av - bv
  })
}

function sortLabel(sort: ColSort): string {
  const base = sort.key === 'createdAt' ? 'Creación' : 'Actualizó'
  return `${base} ${sort.dir === 'desc' ? '↓' : '↑'}`
}


const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const ACTION_LABEL: Record<string, string> = {
  create: 'creó',
  update: 'actualizó',
  delete: 'eliminó',
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return `hace ${Math.floor(diff / 86400)} días`
}

export default function DashboardProjectView({ project: projectProp }: Props) {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentUser = session?.user?.id && session?.user?.name
    ? { id: session.user.id, name: session.user.name }
    : undefined
  const [project, setProject] = useState<ProjectWithRelations>(projectProp)
  const [deliverables, setDeliverables] = useState<DBDeliverable[]>(projectProp.deliverables)
  const [members, setMembers] = useState<DBProjectMember[]>(projectProp.members as DBProjectMember[])
  const [packages, setPackages] = useState<DBDeliverablePackage[]>([])
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [minutaOpen, setMinutaOpen] = useState(false)
  const [pkgModalOpen, setPkgModalOpen] = useState(false)
  const [editingDeliverable, setEditingDeliverable] = useState<DBDeliverable | null>(null)
  const [editingPackage, setEditingPackage] = useState<DBDeliverablePackage | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<'ok' | 'warn' | 'danger'>('warn')
  const [profileMember, setProfileMember] = useState<DBProjectMember | null>(null)
  const [membersListOpen, setMembersListOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [activityLogs, setActivityLogs] = useState<DBAuditLogEntry[]>([])
  const [minutasKey, setMinutasKey] = useState(0)
  const [colSorts, setColSorts] = useState<Record<string, ColSort>>({
    ok: DEFAULT_SORT, warn: DEFAULT_SORT, danger: DEFAULT_SORT,
  })

  // F2 state
  const [risks, setRisks] = useState<DBProjectRisk[]>([])
  const [risksLoading, setRisksLoading] = useState(true)
  const [riskModalOpen, setRiskModalOpen] = useState(false)
  const [editingRisk, setEditingRisk] = useState<DBProjectRisk | null>(null)
  const [kpis, setKpis] = useState<DBProjectKPI[]>([])
  const [kpisLoading, setKpisLoading] = useState(true)
  const [kpiModalOpen, setKpiModalOpen] = useState(false)
  const [editingKPI, setEditingKPI] = useState<DBProjectKPI | null>(null)
  const [velocityWeeks, setVelocityWeeks] = useState<DBVelocityWeek[]>([])
  const [velocityRequired, setVelocityRequired] = useState(0)
  const [velocityLoading, setVelocityLoading] = useState(true)
  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const VALID_TABS = ['tablero', 'analisis', 'riesgos', 'minutas'] as const
  type TabKey = typeof VALID_TABS[number]
  const rawTab = searchParams.get('tab')
  const activeTab: TabKey = (VALID_TABS.includes(rawTab as TabKey) ? rawTab : 'tablero') as TabKey

  function setActiveTab(tab: TabKey) {
    const next = new URLSearchParams(searchParams.toString())
    next.set('tab', tab)
    router.replace(`?${next.toString()}`, { scroll: false })
  }

  const [moreOpen, setMoreOpen] = useState(false)

  type TableroView = 'lista' | 'gantt' | 'kanban'
  const VALID_VIEWS: TableroView[] = ['lista', 'gantt', 'kanban']

  function getDefaultView(): TableroView {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`pvai_project_${projectProp.id}_view`)
      if (stored === 'lista' || stored === 'gantt' || stored === 'kanban') return stored
    }
    const withDates = projectProp.deliverables.filter(d => d.startDate && d.dueDate)
    const estimated = projectProp.ganttRows.length > 0 ? projectProp.ganttRows.length : withDates.length
    return estimated >= GANTT_THRESHOLD ? 'gantt' : 'lista'
  }

  const rawView = searchParams.get('view')
  const tableroView: TableroView = (VALID_VIEWS.includes(rawView as TableroView) ? rawView : getDefaultView()) as TableroView

  const fetchActivity = useCallback(() => {
    setActivityLoading(true)
    fetch(`/api/projects/${project.id}/activity`)
      .then(r => r.ok ? r.json() : [])
      .then(setActivityLogs)
      .catch(() => {})
      .finally(() => setActivityLoading(false))
  }, [project.id])

  const fetchDeliverables = useCallback(() => {
    fetch(`/api/projects/${project.id}/deliverables`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setDeliverables(data) })
      .catch(() => {})
  }, [project.id])

  const fetchPackages = useCallback(() => {
    setPackagesLoading(true)
    fetch(`/api/projects/${project.id}/packages`)
      .then(r => r.ok ? r.json() : [])
      .then(setPackages)
      .catch(() => {})
      .finally(() => setPackagesLoading(false))
  }, [project.id])

  const fetchRisks = useCallback(() => {
    setRisksLoading(true)
    fetch(`/api/projects/${project.id}/risks`)
      .then(r => r.ok ? r.json() : [])
      .then(setRisks)
      .catch(() => {})
      .finally(() => setRisksLoading(false))
  }, [project.id])

  const fetchKPIs = useCallback(() => {
    setKpisLoading(true)
    fetch(`/api/projects/${project.id}/kpis`)
      .then(r => r.ok ? r.json() : [])
      .then(setKpis)
      .catch(() => {})
      .finally(() => setKpisLoading(false))
  }, [project.id])

  const fetchVelocity = useCallback(() => {
    setVelocityLoading(true)
    fetch(`/api/projects/${project.id}/activity?type=velocity`)
      .then(r => r.ok ? r.json() : { weeks: [], requiredPerWeek: 0 })
      .then(data => { setVelocityWeeks(data.weeks ?? []); setVelocityRequired(data.requiredPerWeek ?? 0) })
      .catch(() => {})
      .finally(() => setVelocityLoading(false))
  }, [project.id])

  useEffect(() => {
    fetchActivity()
    fetchPackages()
    fetchRisks()
    fetchKPIs()
    fetchVelocity()
  }, [fetchActivity, fetchPackages, fetchRisks, fetchKPIs, fetchVelocity])

  const done         = deliverables.filter(d => d.status === 'ok').length
  const total        = deliverables.length
  const pct          = total > 0 ? Math.round((done / total) * 100) : 0
  const agentPending = deliverables.filter(
    d => (d.meta === 'minuta' || d.meta === 'agente') && d.status !== 'ok'
  ).length

  const byStatus = {
    ok:     deliverables.filter(d => d.status === 'ok'),
    warn:   deliverables.filter(d => d.status === 'warn'),
    danger: deliverables.filter(d => d.status === 'danger'),
  }

  const showRiesgosTab = risksLoading || risks.length > 0
  const safeActiveTab = (activeTab === 'riesgos' && !showRiesgosTab) ? 'tablero' : activeTab

  // Dynamic Gantt: if no manual ganttRows, compute from deliverables with dates
  const ganttRows = useMemo(() => {
    if (project.ganttRows.length > 0) return project.ganttRows

    const withDates = deliverables.filter(d => d.startDate && d.dueDate)
    if (withDates.length === 0) return []

    const startDates = withDates.map(d => toLocalDate(d.startDate)!.getTime())
    const baseDate = new Date(Math.min(...startDates))

    const totalDays = (() => {
      const endDates = withDates.map(d => toLocalDate(d.dueDate)!.getTime())
      const maxEnd = new Date(Math.max(...endDates))
      return Math.max(daysBetween(baseDate, maxEnd), 7)
    })()

    return withDates.map((d, i) => {
      const start = daysBetween(baseDate, toLocalDate(d.startDate)!)
      const duration = Math.max(daysBetween(toLocalDate(d.startDate)!, toLocalDate(d.dueDate)!), 1)
      return {
        id: `auto-${d.id}`,
        projectId: project.id,
        label: d.name,
        ownerName: d.ownerName ?? '—',
        start,
        duration,
        status: d.status === 'ok' ? 'ok' : d.status === 'danger' ? 'danger' : 'prog',
        order: i,
        _totalDays: totalDays,
      }
    })
  }, [deliverables, project.ganttRows, project.id])

  // Compute total days for Gantt scale
  const ganttTotalDays = useMemo(() => {
    if (project.ganttRows.length > 0) return 35
    const withTotal = ganttRows as Array<{ _totalDays?: number }>
    return withTotal[0]?._totalDays ?? 35
  }, [ganttRows, project.ganttRows.length])

  // Base date for auto-gantt (earliest startDate)
  const baseDate = useMemo(() => {
    if (project.ganttRows.length > 0) return null
    const withDates = deliverables.filter(d => d.startDate && d.dueDate)
    if (withDates.length === 0) return null
    const startDates = withDates.map(d => toLocalDate(d.startDate)!.getTime())
    return new Date(Math.min(...startDates))
  }, [deliverables, project.ganttRows.length])

  // Array of dates for Gantt header
  const ganttDates = useMemo(() => {
    if (!baseDate || ganttRows.length === 0) return []
    const dates: Date[] = []
    for (let i = 0; i < ganttTotalDays; i++) {
      const d = new Date(baseDate)
      d.setDate(d.getDate() + i)
      dates.push(d)
    }
    return dates
  }, [baseDate, ganttTotalDays, ganttRows.length])

  // Offset in days from baseDate to today (for "today" line)
  const todayOffset = useMemo(() => {
    if (!baseDate) return -1
    return daysBetween(baseDate, new Date())
  }, [baseDate])

  // Next upcoming pre-entrega
  const nextPreEntrega = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const upcoming = packages
      .flatMap(p =>
        p.milestones
          .filter(m => m.type === 'pre-entrega' && (toLocalDate(m.date) ?? new Date(m.date)) >= today)
          .map(m => ({ milestone: m, pkg: p })),
      )
      .sort((a, b) => new Date(a.milestone.date).getTime() - new Date(b.milestone.date).getTime())
    return upcoming[0] ?? null
  }, [packages])

  // Next upcoming entrega final
  const nextFinalEntrega = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const upcoming = packages
      .flatMap(p =>
        p.milestones
          .filter(m => m.type === 'final' && (toLocalDate(m.date) ?? new Date(m.date)) >= today)
          .map(m => ({ milestone: m, pkg: p })),
      )
      .sort((a, b) => new Date(a.milestone.date).getTime() - new Date(b.milestone.date).getTime())
    return upcoming[0] ?? null
  }, [packages])

  // F3.3 — Predictive delay detection
  const isPredictiveRisk = useMemo(() => {
    if (!project.endDate || velocityRequired <= 0) return false
    const lastTwo = velocityWeeks.slice(-2)
    const velocidadActual = lastTwo.reduce((s, w) => s + w.completed, 0) / Math.max(lastTwo.length, 1)
    return velocidadActual < velocityRequired * 0.8
  }, [velocityWeeks, velocityRequired, project.endDate])

  // Milestone vertical lines for Gantt
  const milestoneOffsets = useMemo(() => {
    if (!baseDate || ganttRows.length === 0) return []
    return packages.flatMap(p =>
      p.milestones.map(m => {
        const offset = daysBetween(baseDate, new Date(m.date))
        return { ...m, offset, packageName: p.name }
      }),
    ).filter(m => m.offset >= 0 && m.offset <= ganttTotalDays)
  }, [packages, baseDate, ganttTotalDays, ganttRows.length])

  function changeTableroView(v: TableroView) {
    localStorage.setItem(`pvai_project_${projectProp.id}_view`, v)
    const next = new URLSearchParams(searchParams.toString())
    next.set('view', v)
    router.replace(`?${next.toString()}`, { scroll: false })
  }

  function openNewTask(status: 'ok' | 'warn' | 'danger' = 'warn') {
    setEditingDeliverable(null)
    setDefaultStatus(status)
    setTaskModalOpen(true)
  }

  function openEditTask(d: DBDeliverable) {
    setEditingDeliverable(d)
    setTaskModalOpen(true)
  }

  function handleSaved(saved: DBDeliverable) {
    setDeliverables(prev => {
      const idx = prev.findIndex(d => d.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
  }

  function handleDeleted(id: string) {
    setDeliverables(prev => prev.filter(d => d.id !== id))
  }

  function handleMemberAdded(member: DBProjectMember) {
    setMembers(prev => [...prev, member])
  }

  function handleMemberUpdated(updated: DBProjectMember) {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m))
    setProfileMember(updated)
  }

  function handleMemberRemoved(memberId: string) {
    setMembers(prev => prev.filter(m => m.id !== memberId))
    setProfileMember(null)
  }

  function handlePackageSaved(pkg: DBDeliverablePackage) {
    setPackages(prev => {
      const idx = prev.findIndex(p => p.id === pkg.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = pkg
        return next
      }
      return [...prev, pkg]
    })
    fetchDeliverables()
  }

  function handlePackageDeleted(id: string) {
    setPackages(prev => prev.filter(p => p.id !== id))
  }

  function openNewPackage() {
    setEditingPackage(null)
    setPkgModalOpen(true)
  }

  function openEditPackage(pkg: DBDeliverablePackage) {
    setEditingPackage(pkg)
    setPkgModalOpen(true)
  }

  function handleRiskSaved(risk: DBProjectRisk) {
    setRisks(prev => {
      const idx = prev.findIndex(r => r.id === risk.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = risk; return next }
      return [risk, ...prev]
    })
  }

  function handleRiskDeleted(id: string) {
    setRisks(prev => prev.filter(r => r.id !== id))
  }

  function handleKPISaved(kpi: DBProjectKPI) {
    setKpis(prev => {
      const idx = prev.findIndex(k => k.id === kpi.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = kpi; return next }
      return [...prev, kpi]
    })
  }

  function handleKPIDeleted(id: string) {
    setKpis(prev => prev.filter(k => k.id !== id))
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Header — 3 zonas */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 md:gap-8 items-center">

        {/* ZONA 1 — Identidad */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[21px] font-black">{project.title}</h1>
            <button
              onClick={() => setEditProjectOpen(true)}
              title="Editar proyecto"
              aria-label="Editar proyecto"
              className="w-6 h-6 flex items-center justify-center rounded-md text-pv-gray hover:text-pv-accent hover:bg-pv-accent/10 transition-colors text-[13px] focus-visible:ring-2 focus-visible:ring-pv-accent focus-visible:outline-none"
            >
              ✏️
            </button>
          </div>
          <div className="text-[11px] text-pv-gray/70 mt-0.5">{project.type}</div>
        </div>

        {/* ZONA 2 — Avance (hero) */}
        <div className="flex flex-col items-start md:items-center gap-1">
          <div className="font-display text-[40px] md:text-[56px] font-black leading-none text-pv-accent">
            {pct}%
          </div>
          <div className="w-full max-w-[240px] h-1 bg-pv-accent/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-pv-accent rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="font-mono text-[11px] text-pv-gray/70">
            {done}/{total} entregables
          </div>
        </div>

        {/* ZONA 3 — Acciones */}
        <div className="flex items-center gap-2">
          {/* Chip de estado consolidado */}
          {(risks.filter(r => r.status === 'open').length > 0 || isPredictiveRisk) ? (
            <button
              onClick={() => setActiveTab('riesgos')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold bg-pv-red/10 border-pv-red/30 text-pv-red hover:bg-pv-red/20 transition-colors motion-safe:animate-pulse focus-visible:ring-2 focus-visible:ring-pv-red focus-visible:outline-none"
              title="Ver riesgos activos"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-pv-red inline-block" />
              Riesgo de delay
            </button>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold bg-pv-green/10 border-pv-green/30 text-pv-green">
              <span className="w-1.5 h-1.5 rounded-full bg-pv-green inline-block" />
              Al corriente
            </div>
          )}

          {/* Botón primario único */}
          <button
            onClick={() => openNewTask()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-pv-accent text-white rounded-lg hover:bg-pv-accent/90 transition-colors focus-visible:ring-2 focus-visible:ring-pv-accent focus-visible:outline-none"
          >
            + Nueva tarea
          </button>

          {/* Menú "..." de acciones secundarias */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(v => !v)}
              aria-label="Más acciones"
              aria-expanded={moreOpen}
              className="w-7 h-7 flex items-center justify-center rounded-md text-pv-gray hover:text-white hover:bg-white/10 transition-colors text-[13px] font-bold focus-visible:ring-2 focus-visible:ring-pv-accent focus-visible:outline-none"
              title="Más acciones"
            >
              •••
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-[#0C1F35] border border-white/10 rounded-xl py-1.5 z-20 min-w-[170px] shadow-xl">
                  <button
                    onClick={() => { setShareOpen(true); setMoreOpen(false) }}
                    className="w-full text-left px-3 py-2 text-[11px] text-pv-gray hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    ↗ Compartir resumen
                  </button>
                  <button
                    onClick={() => { setMinutaOpen(true); setMoreOpen(false) }}
                    className="w-full text-left px-3 py-2 text-[11px] text-pv-gray hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    ✦ Nueva minuta
                  </button>
                  <button
                    onClick={() => { setInviteOpen(true); setMoreOpen(false) }}
                    className="w-full text-left px-3 py-2 text-[11px] text-pv-gray hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    + Agregar colaborador
                  </button>
                  <button
                    onClick={() => { setMembersListOpen(true); setMoreOpen(false) }}
                    className="w-full text-left px-3 py-2 text-[11px] text-pv-gray hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    {members.length} persona{members.length !== 1 ? 's' : ''} en el equipo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 w-fit">
        {([
          { id: 'tablero',  label: 'Tablero',  show: true },
          { id: 'analisis', label: 'Análisis', show: true },
          { id: 'riesgos',  label: 'Riesgos',  show: showRiesgosTab },
          { id: 'minutas',  label: 'Minutas',  show: true },
        ] as const).filter(tab => tab.show).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              safeActiveTab === tab.id
                ? 'bg-pv-accent text-white shadow-sm'
                : 'text-pv-gray hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2×2 widget grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* Row 1 — Timeline + Notes */}
        <Suspense fallback={<div className="h-[150px] bg-white/[0.04] rounded-xl animate-pulse" />}>
          <ProjectTimelineWidget
            deliverables={deliverables}
            onOpenTask={openEditTask}
          />
        </Suspense>
        <ProjectNotesWidget projectId={project.id} />

        {/* Row 2 — KPI: Tareas generadas/actualizadas con IA */}
        <div className="bg-pv-purple/8 border border-pv-purple/20 rounded-xl px-3.5 py-3 md:col-span-2">
          <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-1.5">Tareas generadas con IA</div>
          <div className="font-display text-[22px] font-black leading-none text-[#B89EE8]">{agentPending}</div>
          <div className="text-[10px] text-pv-gray mt-0.5">pendientes desde la última minuta</div>
          <div className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-lg mt-1.5 bg-pv-purple/20 text-[#B89EE8]">
            {agentPending > 0 ? '✦ Agente activo' : '✦ Sin pendientes'}
          </div>
        </div>
      </div>

      {/* Próxima pre-entrega */}
      {nextPreEntrega && (
        <div className="bg-pv-amber/[0.14] border border-pv-amber/50 rounded-xl px-4 py-3 flex items-start gap-4 shadow-[inset_3px_0_0_#E09B3D,0_4px_16px_rgba(224,155,61,0.14)]">
          <div className="flex-shrink-0 text-center">
            <div className="text-[9px] font-bold uppercase tracking-[0.5px] text-pv-amber mb-0.5">Próxima pre-entrega</div>
            <div className="font-display text-[18px] font-black text-pv-amber leading-none">
              {(toLocalDate(nextPreEntrega.milestone.date) ?? new Date(nextPreEntrega.milestone.date)).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[12px] font-bold text-white">{nextPreEntrega.pkg.name}</span>
              {nextPreEntrega.milestone.label && (
                <span className="text-[10px] text-pv-amber/80">— {nextPreEntrega.milestone.label}</span>
              )}
              <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pv-amber/20 text-pv-amber">pre-entrega</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {nextPreEntrega.pkg.deliverables.slice(0, 3).map(d => (
                <span key={d.id} className="flex items-center gap-1 text-[10px] text-white/70 bg-white/[0.06] rounded-md px-2 py-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[d.status] ?? 'bg-pv-gray'}`} />
                  {d.name}
                </span>
              ))}
              {nextPreEntrega.pkg.deliverables.length > 3 && (
                <button
                  onClick={() => openEditPackage(nextPreEntrega.pkg)}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-pv-amber/20 text-pv-amber hover:bg-pv-amber/30 transition-colors"
                >
                  +{nextPreEntrega.pkg.deliverables.length - 3} más →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Próxima entrega final */}
      {nextFinalEntrega && (
        <div className="bg-pv-accent/[0.14] border border-pv-accent/50 rounded-xl px-4 py-3 flex items-start gap-4 shadow-[inset_3px_0_0_#2E8FC0,0_4px_16px_rgba(46,143,192,0.14)]">
          <div className="flex-shrink-0 text-center">
            <div className="text-[9px] font-bold uppercase tracking-[0.5px] text-pv-accent mb-0.5">Próxima entrega final</div>
            <div className="font-display text-[18px] font-black text-pv-accent leading-none">
              {(toLocalDate(nextFinalEntrega.milestone.date) ?? new Date(nextFinalEntrega.milestone.date)).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[12px] font-bold text-white">{nextFinalEntrega.pkg.name}</span>
              {nextFinalEntrega.milestone.label && (
                <span className="text-[10px] text-pv-accent/80">— {nextFinalEntrega.milestone.label}</span>
              )}
              <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pv-accent/20 text-pv-accent">final</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {nextFinalEntrega.pkg.deliverables.slice(0, 3).map(d => (
                <span key={d.id} className="flex items-center gap-1 text-[10px] text-white/70 bg-white/[0.06] rounded-md px-2 py-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[d.status] ?? 'bg-pv-gray'}`} />
                  {d.name}
                </span>
              ))}
              {nextFinalEntrega.pkg.deliverables.length > 3 && (
                <button
                  onClick={() => openEditPackage(nextFinalEntrega.pkg)}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-pv-accent/20 text-pv-accent hover:bg-pv-accent/30 transition-colors"
                >
                  +{nextFinalEntrega.pkg.deliverables.length - 3} más →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: TABLERO ─────────────────────────────── */}
      {safeActiveTab === 'tablero' && (<>

      {/* View toggle */}
      <div className="flex justify-end">
        <div
          role="tablist"
          aria-label="Vista de entregables"
          className="flex"
        >
          {([
            { id: 'lista',  label: 'Lista' },
            { id: 'gantt',  label: 'Cronograma' },
            { id: 'kanban', label: 'Kanban' },
          ] as const).map((v, i, arr) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={tableroView === v.id}
              onClick={() => changeTableroView(v.id)}
              className={[
                'px-3 py-1 text-[10px] font-semibold transition-colors border border-white/[0.08]',
                i === 0 ? 'rounded-l-lg' : '',
                i === arr.length - 1 ? 'rounded-r-lg' : '',
                i > 0 ? '-ml-px' : '',
                tableroView === v.id
                  ? 'bg-pv-accent text-white z-10 relative'
                  : 'bg-white/[0.06] text-pv-gray hover:text-white hover:bg-white/[0.10]',
              ].join(' ')}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deliverables panel — single toggled view */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.07] flex justify-between items-center">
          <h3 className="text-xs font-semibold">Entregables</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-pv-gray">{done}/{total} completados</span>
            <button
              onClick={() => openNewTask('warn')}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors"
            >
              <span className="text-[12px] leading-none">+</span>
              Nueva tarea
            </button>
          </div>
        </div>

        {/* Lista view */}
        {tableroView === 'lista' && (
          <PriorityList deliverables={deliverables} onOpenTask={openEditTask} />
        )}

        {/* Gantt view (threshold-aware) */}
        {tableroView === 'gantt' && ganttRows.length === 0 && (
          <EmptyState
            title="Sin cronograma"
            hint="Agrega fechas de inicio y vencimiento a los entregables para ver el cronograma."
          />
        )}
        {tableroView === 'gantt' && ganttRows.length > 0 && ganttRows.length < GANTT_THRESHOLD && (
          <PriorityList deliverables={deliverables} onOpenTask={openEditTask} />
        )}
        {tableroView === 'gantt' && ganttRows.length >= GANTT_THRESHOLD && (<>
          {ganttDates.length > 0 && (
            <div className="grid border-b border-white/[0.06]" style={{ gridTemplateColumns: '155px 1fr' }}>
              <div className="px-4 py-1.5 text-[9px] text-pv-gray/50 uppercase tracking-[0.5px]">Tarea</div>
              <div className="relative h-[28px] overflow-hidden">
                {ganttDates.map((date, i) => {
                  const left = ((i / ganttTotalDays) * 100).toFixed(2)
                  const showLabel = ganttTotalDays <= 21 || i % 3 === 0
                  return showLabel ? (
                    <div
                      key={i}
                      className="absolute top-0 text-[8px] text-pv-gray/60 pt-1 select-none"
                      style={{ left: `${left}%` }}
                    >
                      {date.getDate()} {MONTHS[date.getMonth()]}
                    </div>
                  ) : null
                })}
                {todayOffset >= 0 && todayOffset <= ganttTotalDays && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-pv-accent/40"
                    style={{ left: `${(todayOffset / ganttTotalDays) * 100}%` }}
                  />
                )}
                {milestoneOffsets.map((m, i) => (
                  <div
                    key={`mhdr-${i}`}
                    title={`${m.packageName}${m.label ? ' — ' + m.label : ''} (${m.type})`}
                    className={`absolute top-0 bottom-0 w-px ${m.type === 'pre-entrega' ? 'bg-pv-amber/50' : 'bg-pv-red/50'}`}
                    style={{ left: `${(m.offset / ganttTotalDays) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="max-h-[220px] overflow-y-auto">
            {ganttRows.map((r) => {
              const left  = ((r.start / ganttTotalDays) * 100).toFixed(1)
              const width = Math.max((r.duration / ganttTotalDays) * 100, 3).toFixed(1)
              return (
                <div
                  key={r.id}
                  className="grid border-b border-white/[0.04] last:border-b-0 items-center min-h-[34px] hover:bg-white/[0.02]"
                  style={{ gridTemplateColumns: '155px 1fr' }}
                >
                  <div className="px-4 py-1.5 text-[11px] font-medium text-pv-white overflow-hidden text-ellipsis whitespace-nowrap">
                    {r.label}
                    <small className="block text-[9px] text-pv-gray mt-px">{r.ownerName}</small>
                  </div>
                  <div className="relative h-[34px]">
                    {todayOffset >= 0 && todayOffset <= ganttTotalDays && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-pv-accent/20 z-0"
                        style={{ left: `${(todayOffset / ganttTotalDays) * 100}%` }}
                      />
                    )}
                    {milestoneOffsets.map((m, i) => (
                      <div
                        key={`mrow-${i}`}
                        className={`absolute top-0 bottom-0 w-px z-0 ${m.type === 'pre-entrega' ? 'bg-pv-amber/25' : 'bg-pv-red/25'}`}
                        style={{ left: `${(m.offset / ganttTotalDays) * 100}%` }}
                      />
                    ))}
                    <div
                      className={`absolute h-[15px] top-1/2 -translate-y-1/2 rounded-[4px] text-[8px] font-bold flex items-center px-1.5 overflow-hidden whitespace-nowrap z-10 ${BAR_CLS[r.status] ?? 'bg-pv-accent/85 text-white'}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      {parseFloat(width) > 7 ? r.label : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>)}

        {/* Kanban view */}
        {tableroView === 'kanban' && (
          <div className="overflow-x-auto">
            <div className="grid border-t border-white/[0.07] min-w-[540px]" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              {COL_CONFIG.map(col => (
                <div key={col.key} className="border-r border-white/[0.06] last:border-r-0 flex flex-col min-h-[180px] min-w-[180px]">
                  <div className={`px-3 py-2 flex items-center justify-between border-b border-white/[0.06] ${col.headCls}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.6px] flex items-center gap-1.5 ${col.cls}`}>
                      {col.label}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${col.countCls}`}>
                        {byStatus[col.key as keyof typeof byStatus].length}
                      </span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setColSorts(prev => ({ ...prev, [col.key]: nextSort(prev[col.key]) }))}
                        title="Cambiar orden"
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded text-pv-accent bg-pv-accent/10 hover:bg-pv-accent/20 transition-colors"
                      >
                        {sortLabel(colSorts[col.key])}
                      </button>
                      <button
                        onClick={() => openNewTask(col.key as 'ok' | 'warn' | 'danger')}
                        className="text-[16px] leading-none text-pv-gray hover:text-white transition-colors"
                        title="Agregar tarea en esta columna"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="p-2 flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: '320px' }}>
                    {getSorted(byStatus[col.key as keyof typeof byStatus], colSorts[col.key]).map(d => {
                      const ownerName = d.ownerName ?? '—'
                      const dateVal = toLocalDate(d.dueDate)
                      const dateStr = dateVal
                        ? dateVal.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                        : '-'
                      return (
                        <div
                          key={d.id}
                          onClick={() => openEditTask(d)}
                          title="Click para editar"
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
                              style={{ background: PRIORITY_COLORS[d.priority as keyof typeof PRIORITY_COLORS] ?? '#8A9BB0' }}
                            />
                            <span className="text-pv-gray">{ownerName}</span>
                            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ml-auto ${DATE_CLS[d.status]}`}>
                              {dateStr}
                            </span>
                          </div>
                          {d.createdByName && (
                            <div className="text-[9px] text-pv-gray/60 mt-0.5">
                              Creado por {d.createdByName}
                            </div>
                          )}
                          {d.updatedByName && d.updatedAt && d.createdAt &&
                            (new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime() > 60_000) && (
                            <div className="text-[9px] text-pv-gray/50">
                              Act. {new Date(d.updatedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} · {d.updatedByName}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {byStatus[col.key as keyof typeof byStatus].length === 0 && (
                      <EmptyState compact title="Sin tareas" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Packages panel */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center justify-between">
          <h3 className="text-xs font-semibold">Paquetes de entregables</h3>
          <button
            onClick={openNewPackage}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors"
          >
            <span className="text-[12px] leading-none">+</span>
            Nuevo paquete
          </button>
        </div>
        {packagesLoading ? (
          <div className="p-3 flex flex-col gap-2">
            {[1, 2].map(i => (
              <div key={i} className="h-10 bg-white/[0.04] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <EmptyState
            title="Sin paquetes"
            hint="Crea uno para agrupar entregables con fechas de pre-entrega y entrega final."
          />
        ) : (
          <div className="p-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {packages.map(pkg => {
              const preMs = pkg.milestones.filter(m => m.type === 'pre-entrega')
              const finalMs = pkg.milestones.filter(m => m.type === 'final')
              const today = new Date(); today.setHours(0, 0, 0, 0)
              const isPast = (date: Date | string) => new Date(date) < today
              const allPast = pkg.milestones.length > 0 && pkg.milestones.every(m => isPast(m.date))
              return (
                <div
                  key={pkg.id}
                  onClick={() => openEditPackage(pkg)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 cursor-pointer hover:bg-white/[0.07] hover:border-white/15 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[12px] font-bold text-white leading-snug">{pkg.name}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {allPast && (
                        <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-pv-green/10 text-pv-green/60">
                          Completado
                        </span>
                      )}
                      <span className="text-[9px] text-pv-gray/50">
                        {pkg.deliverables.length} entregable{pkg.deliverables.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {/* Milestone chips */}
                  {pkg.milestones.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {preMs.map(m => (
                        <span key={m.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          isPast(m.date)
                            ? 'bg-white/[0.05] text-pv-gray/50 line-through'
                            : 'bg-pv-amber/15 text-pv-amber'
                        }`}>
                          ▽ {(toLocalDate(m.date) ?? new Date(m.date)).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          {m.label ? ` · ${m.label}` : ' · pre-entrega'}
                          {isPast(m.date) && ' · vencida'}
                        </span>
                      ))}
                      {finalMs.map(m => (
                        <span key={m.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          isPast(m.date)
                            ? 'bg-white/[0.05] text-pv-gray/50 line-through'
                            : 'bg-pv-accent/15 text-pv-accent'
                        }`}>
                          ● {(toLocalDate(m.date) ?? new Date(m.date)).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          {m.label ? ` · ${m.label}` : ' · final'}
                          {isPast(m.date) && ' · vencida'}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Deliverables compact list */}
                  {pkg.deliverables.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      {pkg.deliverables.slice(0, 3).map(d => (
                        <div key={d.id} className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[d.status] ?? 'bg-pv-gray'}`} />
                          <span className="text-[10px] text-white/70 truncate">{d.name}</span>
                        </div>
                      ))}
                      {pkg.deliverables.length > 3 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditPackage(pkg) }}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/[0.08] text-pv-accent hover:bg-pv-accent/20 transition-colors ml-3 mt-0.5 self-start"
                        >
                          +{pkg.deliverables.length - 3} más →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      </>)} {/* end tablero */}

      {/* ── TAB: ANÁLISIS ────────────────────────────── */}
      {safeActiveTab === 'analisis' && (<>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <KPIsPanel
          kpis={kpis}
          loading={kpisLoading}
          onNew={() => { setEditingKPI(null); setKpiModalOpen(true) }}
          onEdit={(kpi) => { setEditingKPI(kpi); setKpiModalOpen(true) }}
        />
        <VelocityWidget weeks={velocityWeeks} requiredPerWeek={velocityRequired} loading={velocityLoading} />
      </div>
      <CapacityWidget members={members} deliverables={deliverables} loading={false} />
      </>)} {/* end analisis */}

      {/* ── TAB: RIESGOS ─────────────────────────────── */}
      {safeActiveTab === 'riesgos' && (
        <RisksPanel
          risks={risks}
          loading={risksLoading}
          onNew={() => { setEditingRisk(null); setRiskModalOpen(true) }}
          onEdit={(risk) => { setEditingRisk(risk); setRiskModalOpen(true) }}
        />
      )}

      {/* ── TAB: MINUTAS ─────────────────────────────── */}
      {safeActiveTab === 'minutas' && (<>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {activityLoading ? (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.07]">
              <div className="h-3 w-40 bg-white/[0.06] rounded animate-pulse" />
            </div>
            <div className="flex flex-col gap-2 p-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-white/[0.04] rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : activityLogs.length > 0 && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.07]">
              <h3 className="text-xs font-semibold">Últimas acciones del equipo</h3>
            </div>
            <div className="flex flex-col divide-y divide-white/[0.04]">
              {activityLogs.map(log => (
                <div key={log.id} className="px-4 py-2.5 flex items-center gap-2.5">
                  <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    log.action === 'create' ? 'bg-pv-green/15 text-pv-green'
                    : log.action === 'delete' ? 'bg-pv-red/15 text-pv-red'
                    : 'bg-pv-accent/15 text-pv-accent'
                  }`}>
                    {ACTION_LABEL[log.action] ?? log.action}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-white">{log.userName ?? 'Alguien'}</span>
                    {log.entityName && (
                      <span className="text-[11px] text-pv-gray"> &ldquo;{log.entityName}&rdquo;</span>
                    )}
                  </div>
                  <div className="text-[9px] text-pv-gray/60 flex-shrink-0">{timeAgo(log.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <MinutasPanel projectId={project.id} key={minutasKey} />
      </div>
      </>)} {/* end minutas */}

      {/* DBTaskModal */}
      <DBTaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        projectId={project.id}
        editingDeliverable={editingDeliverable}
        defaultStatus={defaultStatus}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        members={members}
        allDeliverables={deliverables.map(d => ({ id: d.id, name: d.name, status: d.status }))}
        currentUser={currentUser}
      />

      {/* InviteMemberModal */}
      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        projectId={project.id}
        onAdded={handleMemberAdded}
      />

      {/* DBMinutaModal */}
      <DBMinutaModal
        open={minutaOpen}
        onClose={() => setMinutaOpen(false)}
        projectId={project.id}
        members={members}
        deliverables={deliverables.map(d => ({ id: d.id, name: d.name, status: d.status }))}
        onApplied={() => {
          fetchDeliverables()
          fetchActivity()
          setMinutasKey(k => k + 1)
        }}
      />


      {/* MembersListModal */}
      <MembersListModal
        open={membersListOpen}
        onClose={() => setMembersListOpen(false)}
        members={members}
        onSelectMember={m => setProfileMember(m)}
        onInvite={() => setInviteOpen(true)}
      />

      {/* CollaboratorProfileModal */}
      <CollaboratorProfileModal
        open={!!profileMember}
        onClose={() => setProfileMember(null)}
        member={profileMember}
        deliverables={deliverables}
        projectId={project.id}
        projectTitle={project.title}
        onUpdated={handleMemberUpdated}
        onRemoved={handleMemberRemoved}
      />

      {/* PackageModal */}
      <PackageModal
        open={pkgModalOpen}
        onClose={() => setPkgModalOpen(false)}
        projectId={project.id}
        deliverables={deliverables.map(d => ({ id: d.id, name: d.name, status: d.status }))}
        editingPackage={editingPackage}
        onSaved={handlePackageSaved}
        onDeleted={handlePackageDeleted}
      />

      {/* RiskModal */}
      <RiskModal
        open={riskModalOpen}
        onClose={() => setRiskModalOpen(false)}
        projectId={project.id}
        editingRisk={editingRisk}
        onSaved={handleRiskSaved}
        onDeleted={handleRiskDeleted}
      />

      {/* KPIModal */}
      <KPIModal
        open={kpiModalOpen}
        onClose={() => setKpiModalOpen(false)}
        projectId={project.id}
        editingKPI={editingKPI}
        onSaved={handleKPISaved}
        onDeleted={handleKPIDeleted}
      />

      {/* ProjectEditModal */}
      <ProjectEditModal
        open={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        project={project}
        onSaved={updated => setProject(prev => ({ ...prev, ...updated }))}
      />

      {/* ShareSummaryDialog */}
      <ShareSummaryDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        scope="project"
        projectId={project.id}
      />
    </div>
  )
}
