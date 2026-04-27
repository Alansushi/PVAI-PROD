import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const domain = new URL(req.url).searchParams.get('domain')
  if (!domain || domain.length < 3 || !domain.includes('.')) {
    return NextResponse.json({ orgs: [] })
  }

  // Find any org that has at least one member with this email domain
  const matches = await prisma.orgMember.findMany({
    where: { user: { email: { endsWith: `@${domain.toLowerCase()}` } } },
    select: { organization: { select: { name: true } } },
    distinct: ['organizationId'],
    take: 3,
  })

  const orgs = matches.map((m) => m.organization)
  return NextResponse.json({ orgs })
}
