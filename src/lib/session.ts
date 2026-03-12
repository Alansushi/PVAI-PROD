import { cache } from 'react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const getSession = cache(async () => {
  return auth()
})

export const getOrgMembership = cache(async (userId: string) => {
  return prisma.orgMember.findFirst({
    where: { userId },
    include: { organization: true },
  })
})
