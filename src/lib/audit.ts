import { prisma } from '@/lib/prisma'

interface AuditLogParams {
  userId: string
  action: 'create' | 'update' | 'delete'
  entity: 'project' | 'deliverable' | 'member' | 'ganttRow' | 'organization' | 'risk' | 'kpi' | 'user'
  entityId: string
  entityName?: string
  projectId?: string
  deliverableId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
}

export async function createAuditLog(params: AuditLogParams) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      entityName: params.entityName,
      projectId: params.projectId,
      deliverableId: params.deliverableId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      oldValue: (params.oldValue ?? undefined) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newValue: (params.newValue ?? undefined) as any,
    },
  })
}
