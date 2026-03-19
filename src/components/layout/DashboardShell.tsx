'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Session } from 'next-auth'
import AgentPanel from '@/components/layout/AgentPanel'
import DashboardNav from '@/components/layout/DashboardNav'

interface Props {
  session: Session
  orgName: string
  sidebar: React.ReactNode
  children: React.ReactNode
}

export default function DashboardShell({ session, orgName, sidebar, children }: Props) {
  const pathname = usePathname()
  const isProjectPage = /^\/dashboard\/[^/]+$/.test(pathname) && pathname !== '/dashboard/inicio'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <>
      <DashboardNav
        session={session}
        orgName={orgName}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
      />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[290] bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-[210px_1fr]${isProjectPage ? ' lg:mr-[295px]' : ''}`}>
        {/* Sidebar wrapper — fixed overlay on mobile, static grid column on desktop */}
        <div
          className={[
            'fixed top-[68px] bottom-0 left-0 w-[210px] z-[300]',
            'transition-transform duration-300 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:static lg:translate-x-0 lg:z-auto lg:w-auto',
          ].join(' ')}
        >
          {/* Close button visible only on mobile */}
          <button
            className="lg:hidden absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-pv-gray hover:text-white transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {sidebar}
        </div>

        <main>{children}</main>
      </div>

      {isProjectPage && <AgentPanel />}
    </>
  )
}
