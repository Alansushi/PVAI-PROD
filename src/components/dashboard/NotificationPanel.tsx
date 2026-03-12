'use client'

import { useRouter } from 'next/navigation'

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
  notifications: Notification[]
  onMarkAllRead: () => void
  onMarkRead: (id: string) => void
  onClose: () => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function NotificationPanel({ notifications, onMarkAllRead, onMarkRead, onClose }: Props) {
  const router = useRouter()
  const unreadCount = notifications.filter(n => !n.read).length

  function handleClick(n: Notification) {
    if (!n.read) onMarkRead(n.id)
    if (n.projectId) {
      router.push(`/dashboard/${n.projectId}`)
      onClose()
    }
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-[320px] bg-[#0C1F35] border border-white/[0.10] rounded-xl shadow-2xl z-[300] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <span className="text-[12px] font-semibold text-white">
          Notificaciones {unreadCount > 0 && <span className="text-pv-gray font-normal">({unreadCount} nuevas)</span>}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[10px] text-pv-accent hover:text-pv-accent/70 transition-colors"
          >
            Marcar todo leído
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-[11px] text-pv-gray/50">
            Sin notificaciones
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`px-4 py-3 border-b border-white/[0.05] last:border-b-0 cursor-pointer transition-colors hover:bg-white/[0.04] ${
                !n.read ? 'bg-pv-accent/[0.04]' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                {!n.read && (
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pv-accent flex-shrink-0" />
                )}
                <div className={!n.read ? '' : 'pl-3.5'}>
                  <div className="text-[11px] font-semibold text-white leading-snug">{n.title}</div>
                  <div className="text-[10px] text-pv-gray mt-0.5 leading-snug">{n.body}</div>
                </div>
                <span className="ml-auto text-[9px] text-pv-gray/50 flex-shrink-0 pt-0.5">
                  {timeAgo(n.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
