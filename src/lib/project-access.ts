import { prisma } from '@/lib/prisma'
import type { Project } from '@prisma/client'

/**
 * Verifica que el usuario tenga acceso al proyecto:
 * - Debe pertenecer a la organización del proyecto
 * - Si su rol en la org es 'guest', además debe ser ProjectMember
 * Devuelve el proyecto o null (el caller responde 404).
 */
export async function requireProjectAccess(
  userId: string,
  projectId: string
): Promise<Project | null> {
  const memberships = await prisma.orgMember.findMany({ where: { userId } })
  if (!memberships.length) return null

  const orgIds = memberships.map(m => m.organizationId)
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: { in: orgIds } },
  })
  if (!project) return null

  const guestOrgIds = memberships.filter(m => m.role === 'guest').map(m => m.organizationId)
  if (guestOrgIds.includes(project.organizationId)) {
    const isMember = await prisma.projectMember.findFirst({ where: { projectId, userId } })
    if (!isMember) return null
  }

  return project
}
