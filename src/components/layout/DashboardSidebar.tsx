'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'


interface Project {
  id: string
  title: string
  type: string
  status: string
}

const DOT_COLORS: Record<string, string> = {
  ok:     'bg-pv-green',
  warn:   'bg-pv-amber',
  danger: 'bg-pv-red',
}

interface Props {
  projects: Project[]
  isOnlyGuest?: boolean
}

export default function DashboardSidebar({ projects, isOnlyGuest = false }: Props) {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard/inicio'

  return (
    <aside className="h-full bg-black/20 border-r border-white/[0.06] flex flex-col overflow-y-auto">
      <div className="px-3.5 pt-[18px] pb-1.5 text-[9px] font-bold uppercase tracking-[1px] text-pv-gray">
        General
      </div>
      <Link
        href="/dashboard/inicio"
        className={`px-3.5 py-2 flex items-center gap-2.5 border-l-[3px] transition-all text-pv-white no-underline
          ${isDashboard
            ? 'bg-pv-accent/10 border-pv-accent'
            : 'border-transparent hover:bg-white/[0.04]'
          }`}
      >
        <span className="text-[14px] flex-shrink-0">🏢</span>
        <div>
          <div className="text-xs font-semibold">Vista General</div>
          <div className="text-[10px] text-pv-gray">Resumen ejecutivo</div>
        </div>
      </Link>

      <div className="h-px bg-white/[0.06] mx-3.5 my-1.5" />

      <div className="px-3.5 pt-1 pb-1.5 text-[9px] font-bold uppercase tracking-[1px] text-pv-gray">
        Proyectos activos
      </div>

      {projects.length === 0 && (
        <div className="px-3.5 py-2 text-[11px] text-pv-gray/60 italic">
          Sin proyectos aún
        </div>
      )}

      {projects.map((p) => {
        const active = pathname === `/dashboard/${p.id}`
        return (
          <Link
            key={p.id}
            href={`/dashboard/${p.id}`}
            className={`px-3.5 py-2 flex items-center gap-2.5 border-l-[3px] transition-all text-pv-white no-underline
              ${active
                ? 'bg-pv-accent/10 border-pv-accent'
                : 'border-transparent hover:bg-white/[0.04]'
              }`}
          >
            <div className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${DOT_COLORS[p.status] ?? 'bg-pv-gray'}`} />
            <div>
              <div className="text-xs font-semibold">{p.title}</div>
              <div className="text-[10px] text-pv-gray">{p.type}</div>
            </div>
          </Link>
        )
      })}


      {isOnlyGuest && (
        <>
          <div className="h-px bg-white/[0.06] mx-3.5 my-1.5" />
          <div className="px-3.5 pb-2">
            <Link
              href="/onboarding"
              className="flex items-center gap-2 px-3 py-2 text-[11px] text-pv-accent border border-pv-accent/30 rounded-lg hover:bg-pv-accent/10 transition-colors"
            >
              + Crear mi organización
            </Link>
          </div>
        </>
      )}
    </aside>
  )
}
