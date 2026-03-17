// DB types matching Prisma schema
// These mirror what @prisma/client exports after `prisma generate`

export interface DBUser {
  id: string
  email: string
  name: string | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DBOrganization {
  id: string
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
}

export interface DBOrgMember {
  id: string
  userId: string
  organizationId: string
  role: string
  canDeleteProjects: boolean
  joinedAt: Date
}

export interface DBProject {
  id: string
  organizationId: string
  title: string
  type: string
  status: string
  startDate: Date | null
  endDate: Date | null
  nextPaymentAmount: string | null
  nextPaymentStatus: string | null
  budget: number | null
  billedAmount: number | null
  createdAt: Date
  updatedAt: Date
}

export interface DBProjectMember {
  id: string
  projectId: string
  userId: string | null
  name: string
  initials: string
  color: string
  role: string
  isExternal: boolean
}

export interface DBDeliverable {
  id: string
  projectId: string
  name: string
  status: string
  meta: string | null
  ownerId: string | null
  ownerName: string | null
  dueDate: Date | null
  startDate: Date | null
  priority: string
  notes: string | null
  position: number
  packageId: string | null
  createdAt: Date
  updatedAt: Date
  createdById: string | null
  createdByName: string | null
  updatedById: string | null
  updatedByName: string | null
}

export interface DBMilestone {
  id: string
  packageId: string
  projectId: string
  type: 'pre-entrega' | 'final'
  date: Date
  label: string | null
  createdAt: Date
}

export interface DBDeliverablePackage {
  id: string
  projectId: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  milestones: DBMilestone[]
  deliverables: Pick<DBDeliverable, 'id' | 'name' | 'status' | 'dueDate'>[]
}

export interface DBGanttRow {
  id: string
  projectId: string
  label: string
  ownerName: string
  start: number
  duration: number
  status: string
  order: number
}

export interface DBAuditLogEntry {
  id: string
  userId: string
  action: string
  entityName: string | null
  createdAt: Date
  userName: string | null
}

export interface DBProjectNote {
  id: string
  projectId: string
  userId: string
  content: string
  updatedAt: string
  createdAt: string
}

export interface DBProcessedMinuta {
  id: string
  projectId: string
  userId: string
  title: string
  inputText: string
  summary: string
  actionsJson: string
  createdAt: string
}

export interface DBProcessedMinutaListItem {
  id: string
  title: string
  createdAt: string
  userName: string | null
  actionsCount: number
}

export interface DBProjectRisk {
  id: string
  projectId: string
  title: string
  description: string | null
  probability: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  status: 'open' | 'mitigated' | 'closed'
  mitigation: string | null
  ownerName: string | null
  createdAt: string
  updatedAt: string
}

export interface DBProjectKPI {
  id: string
  projectId: string
  title: string
  target: number
  current: number
  unit: string
  createdAt: string
  updatedAt: string
}

export interface DBVelocityWeek {
  weekLabel: string
  startDate: string
  completed: number
}

export interface DBDeliverableDependency {
  id: string
  blockerId: string
  blockedId: string
  blocker?: { id: string; name: string; status: string }
}

export interface DBProcessedReport {
  id: string
  projectId: string
  userId: string
  content: string
  generatedAt: string
}

export interface DBProjectWithRelations extends DBProject {
  deliverables: DBDeliverable[]
  members: DBProjectMember[]
  ganttRows: DBGanttRow[]
}

