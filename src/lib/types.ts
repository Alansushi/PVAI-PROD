export type ProjectStatus = 'ok' | 'warn' | 'danger'
export type Priority = 'alta' | 'media' | 'baja'

export interface Member {
  id: string
  name: string
  initials: string
  color: string
  role: string
  tasks: number
  done: number
  active: string[]
}

export interface GanttRow {
  label: string
  owner: string
  start: number
  dur: number
  status: 'ok' | 'prog' | 'warn' | 'danger'
}

export interface GanttDeadline {
  pct: number
  label: string
}

export interface KpiData {
  k1v: string
  k1s: string
  k1p: string
  k2v: string
  k3v: string
  k3s: string
  k3p: string
  k4v: string
  k4s: string
}

export interface Deliverable {
  id: string
  status: ProjectStatus
  name: string
  meta: string
  owner: string
  dueDate: string
  startDate: string
  priority: Priority
  notes: string
}

export interface AgentMsg {
  text: string
  time: string
}

export interface Project {
  id: string
  title: string
  sub: string
  kpis: KpiData
  members: string[]
  ganttTitle: string
  ganttRange: string
  deadline: GanttDeadline
  gantt: GanttRow[]
  delTitle: string
  delCount: string
  deliverables: Deliverable[]
  agentMsgs: AgentMsg[]
  dotStatus: 'ok' | 'warn' | 'danger'
  type: string
}

export interface AgentMessage {
  id: string
  role: 'agent' | 'user'
  html: string
  time: string
}

export type AgentCardType = 'alerta' | 'recomendacion' | 'insight' | 'pregunta'

export interface AgentCardAction {
  id: string
  label: string
  variant: 'primary' | 'secondary' | 'ghost'
  actionType: 'update' | 'create' | 'reassign' | 'note' | 'navigate' | 'dismiss'
  payload?: unknown
}

export interface AgentCard {
  id: string
  cardType: AgentCardType
  role: 'agent' | 'user'
  html: string
  timestamp: Date
  actions?: AgentCardAction[]
  dismissed?: boolean
  isDbCard?: boolean
  undone?: boolean
}
