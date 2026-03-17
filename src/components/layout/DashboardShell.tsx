'use client'
import { usePathname } from 'next/navigation'
import AgentPanel from '@/components/layout/AgentPanel'

interface Props {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export default function DashboardShell({ sidebar, children }: Props) {
  const pathname = usePathname()
  const isProjectPage = /^\/dashboard\/[^/]+$/.test(pathname) && pathname !== '/dashboard/inicio'

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '210px 1fr',
          marginRight: isProjectPage ? '295px' : '0',
        }}
      >
        {sidebar}
        <main>{children}</main>
      </div>
      {isProjectPage && <AgentPanel />}
    </>
  )
}
