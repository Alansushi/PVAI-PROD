'use client'

import { useState, useMemo } from 'react'

interface CalEvent {
  id: string
  title: string
  date: string   // 'YYYY-MM-DD'
  time: string   // 'HH:MM'
  color: 'accent' | 'green' | 'amber'
}

export interface CalendarMilestone {
  id: string
  title: string
  date: string  // 'YYYY-MM-DD'
  type: 'pre-entrega' | 'final'
}

const EVENT_COLORS = {
  accent: { dot: 'bg-[#2E8FC0]', text: 'text-[#2E8FC0]', badge: 'bg-[#2E8FC0]/15 text-[#2E8FC0]' },
  green:  { dot: 'bg-[#2A9B6F]', text: 'text-[#2A9B6F]', badge: 'bg-[#2A9B6F]/15 text-[#2A9B6F]' },
  amber:  { dot: 'bg-[#E09B3D]', text: 'text-[#E09B3D]', badge: 'bg-[#E09B3D]/15 text-[#E09B3D]' },
}

const DAYS_SHORT = ['L','M','X','J','V','S','D']
const MONTHS_ES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function firstWeekday(year: number, month: number): number {
  // 0=Mon … 6=Sun (ISO week)
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

export default function ProjectCalendarWidget({ milestones = [] }: { milestones?: CalendarMilestone[] }) {
  const events: CalEvent[] = milestones.map(m => ({
    id: m.id,
    title: m.title,
    date: m.date,
    time: '00:00',
    color: m.type === 'pre-entrega' ? 'amber' : 'accent',
  }))

  const today = new Date()
  const [current, setCurrent] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const year  = current.getFullYear()
  const month = current.getMonth()

  const totalDays = daysInMonth(year, month)
  const offset    = firstWeekday(year, month)

  // Events in current month, keyed by day
  const eventsByDay = useMemo(() => {
    const map: Record<number, CalEvent[]> = {}
    for (const ev of events) {
      const d = new Date(ev.date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        map[day] = map[day] ? [...map[day], ev] : [ev]
      }
    }
    return map
  }, [year, month])

  // Upcoming events in current month (from today if same month, else all)
  const upcomingEvents = useMemo(() => {
    return events
      .filter(ev => {
        const d = new Date(ev.date)
        return d.getFullYear() === year && d.getMonth() === month
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)
  }, [year, month])

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  function prevMonth() { setCurrent(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrent(new Date(year, month + 1, 1)) }

  // Build grid cells: nulls for offset, then 1..totalDays
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]

  return (
    <div className="bg-[#1C3448] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[15px] font-black text-white capitalize">
          {MONTHS_ES[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-pv-gray hover:text-white hover:bg-white/10 transition-colors text-[12px]"
          >
            ‹
          </button>
          <button
            onClick={nextMonth}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-pv-gray hover:text-white hover:bg-white/10 transition-colors text-[12px]"
          >
            ›
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-[9px] text-pv-gray/70 uppercase tracking-[0.3px] pb-1">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />

          const events = eventsByDay[day] ?? []
          const today_ = isToday(day)

          return (
            <div key={day} className="flex flex-col items-center gap-0.5 py-0.5">
              <div
                className={`w-[22px] h-[22px] flex items-center justify-center rounded-full text-[10px] font-semibold transition-colors
                  ${today_ ? 'bg-[#2E8FC0] text-white font-black' : 'text-white/80 hover:bg-white/10'}`}
              >
                {day}
              </div>
              {/* Event dots */}
              {events.length > 0 && (
                <div className="flex gap-0.5 flex-wrap justify-center">
                  {events.slice(0, 2).map(ev => (
                    <div
                      key={ev.id}
                      className={`w-1 h-1 rounded-full ${EVENT_COLORS[ev.color].dot}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div className="border-t border-white/[0.07] pt-2.5 flex flex-col gap-1.5">
          {upcomingEvents.map(ev => {
            const d = new Date(ev.date)
            const dayNum = d.getDate()
            const monthAbbr = MONTHS_ES[d.getMonth()].slice(0, 3)
            return (
              <div key={ev.id} className="flex items-center gap-2">
                <div className={`text-[9px] font-bold w-[36px] text-center py-0.5 rounded-md ${EVENT_COLORS[ev.color].badge}`}>
                  {dayNum} {monthAbbr}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-white/90 truncate block">{ev.title}</span>
                </div>
                {ev.time !== '00:00' && (
                  <div className="text-[9px] text-pv-gray/70 flex-shrink-0">{ev.time}</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {upcomingEvents.length === 0 && (
        <div className="border-t border-white/[0.07] pt-2 text-[10px] text-pv-gray/50 text-center">
          Sin eventos este mes
        </div>
      )}
    </div>
  )
}
