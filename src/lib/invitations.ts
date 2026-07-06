import { prisma } from '@/lib/prisma'

export type InvitationStatus = 'pending' | 'expired'

/** rohernandez@proyeco.es → r•••@proyeco.es */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '•••'
  return `${local.charAt(0)}•••@${domain}`
}

export function invitationStatusFor(
  invitation: { acceptedAt: Date | null; expiresAt: Date } | null | undefined
): InvitationStatus | null {
  if (!invitation || invitation.acceptedAt) return null
  return invitation.expiresAt > new Date() ? 'pending' : 'expired'
}

/**
 * Acepta automáticamente las invitaciones pendientes (no expiradas) cuyo email
 * coincide con el del usuario: crea el OrgMember, vincula el ProjectMember
 * placeholder y marca la invitación como aceptada.
 * Devuelve cuántas invitaciones se vincularon.
 */
export async function linkPendingInvitations(
  userId: string,
  email: string | null | undefined
): Promise<number> {
  if (!email) return 0

  const invitations = await prisma.invitation.findMany({
    where: {
      email:      email.toLowerCase(),
      acceptedAt: null,
      expiresAt:  { gt: new Date() },
    },
    include: { projectMember: true },
  })

  let linked = 0
  for (const invitation of invitations) {
    const alreadyInOrg = await prisma.orgMember.findFirst({
      where: { userId, organizationId: invitation.organizationId },
    })
    if (!alreadyInOrg) {
      await prisma.orgMember.create({
        data: {
          userId,
          organizationId: invitation.organizationId,
          role:           invitation.orgRole,
        },
      })
    }

    if (invitation.projectMemberId && invitation.projectMember && !invitation.projectMember.userId) {
      const alreadyInProject = await prisma.projectMember.findFirst({
        where: { projectId: invitation.projectMember.projectId, userId },
      })
      if (!alreadyInProject) {
        await prisma.projectMember.update({
          where: { id: invitation.projectMemberId },
          data:  { userId, isExternal: false },
        })
      }
    }

    await prisma.invitation.update({
      where: { id: invitation.id },
      data:  { acceptedAt: new Date() },
    })
    linked++
  }

  return linked
}
