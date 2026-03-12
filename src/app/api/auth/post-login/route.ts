import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const memberships = await prisma.orgMember.findMany({
    where: { userId: session.user.id },
  })

  // Only redirect to onboarding if user has NO memberships at all
  if (!memberships.length) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  return NextResponse.redirect(new URL('/dashboard/inicio', req.url))
}
