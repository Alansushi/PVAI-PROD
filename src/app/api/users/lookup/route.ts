import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = new URL(req.url).searchParams.get('email')
  if (!email) return NextResponse.json(null)

  // Only return users within the same org(s) as the requester — prevents cross-org enumeration
  const myOrgMemberships = await prisma.orgMember.findMany({
    where: { userId: session.user.id },
    select: { organizationId: true },
  })
  const myOrgIds = myOrgMemberships.map((m) => m.organizationId)

  if (!myOrgIds.length) return NextResponse.json(null)

  // Only return the user if they belong to at least one of the requester's orgs
  const targetMembership = await prisma.orgMember.findFirst({
    where: { organizationId: { in: myOrgIds }, user: { email: email.toLowerCase() } },
    select: { user: { select: { id: true, name: true, email: true, image: true } } },
  })

  return NextResponse.json(targetMembership?.user ?? null)
}
