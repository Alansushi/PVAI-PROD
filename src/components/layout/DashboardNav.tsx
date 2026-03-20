'use client'

import { useState, useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'
import UserProfileModal from '@/components/dashboard/UserProfileModal'
import NotificationPanel from '@/components/dashboard/NotificationPanel'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  projectId?: string | null
  read: boolean
  createdAt: string
}

interface Props {
  session: Session
  orgName?: string
  onToggleSidebar?: () => void
}

export default function DashboardNav({ session, orgName = '', onToggleSidebar }: Props) {
  const user = session.user
  const [profileOpen, setProfileOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const bellRef = useRef<HTMLDivElement>(null)

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?'

  const unreadCount = notifications.filter(n => !n.read).length

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch {
      // silently ignore
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(() => {
      if (!document.hidden) fetchNotifications()
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Close panel on outside click
  useEffect(() => {
    if (!panelOpen) return
    function handleOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [panelOpen])

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PUT' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <>
      <nav className="flex justify-between items-center px-4 lg:px-8 py-3.5 border-b border-white/[0.06] bg-[rgba(12,31,53,0.97)] backdrop-blur-xl sticky top-0 z-[200]">
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05] transition-colors text-pv-gray hover:text-white"
              aria-label="Abrir menú"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <div>
            <div className="font-display text-xl font-black">
              Proyecto<span className="text-pv-accent">.</span>Vivo
            </div>
            <div className="text-[10px] text-pv-gray mt-px">Tu agente IA de proyectos</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Bell icon with notification badge */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setPanelOpen(prev => !prev)}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05] transition-colors"
              title="Notificaciones"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pv-gray hover:text-white transition-colors">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-pv-red text-white text-[8px] font-bold flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {panelOpen && (
              <NotificationPanel
                notifications={notifications}
                onMarkAllRead={markAllRead}
                onMarkRead={markRead}
                onClose={() => setPanelOpen(false)}
              />
            )}
          </div>

          {/* User avatar + name — clickable to open profile */}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2.5 hover:bg-white/[0.05] px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name ?? 'Avatar'}
                className="w-8 h-8 rounded-full border border-white/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#2E8FC0] flex items-center justify-center text-[11px] font-bold text-white border border-white/20">
                {initials}
              </div>
            )}
            <div className="text-left">
              <div className="text-[12px] font-semibold text-white leading-tight">
                {user?.name ?? user?.email}
              </div>
              <div className="text-[10px] text-pv-gray leading-tight">Director</div>
            </div>
          </button>

        </div>
      </nav>

      <UserProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={{ name: user?.name, email: user?.email, image: user?.image }}
        orgName={orgName}
      />
    </>
  )
}
