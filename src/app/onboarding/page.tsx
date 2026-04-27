import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'
import OnboardingInvitation from './OnboardingInvitation'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // If already has org, skip onboarding
  const existing = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
  })
  if (existing) redirect('/dashboard/inicio')

  // Check for pending invitations for this email
  const pendingInvitations = session.user.email
    ? await prisma.invitation.findMany({
        where: {
          email:       session.user.email.toLowerCase(),
          acceptedAt:  null,
          expiresAt:   { gt: new Date() },
        },
        include: {
          organization: { select: { name: true } },
          invitedBy:    { select: { name: true } },
        },
        take: 3,
      })
    : []

  async function createOrg(formData: FormData) {
    'use server'
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const name = formData.get('name') as string
    if (!name?.trim()) return

    const slug =
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') +
      '-' +
      Date.now().toString(36)

    const org = await prisma.organization.create({
      data: { name: name.trim(), slug },
    })

    await prisma.orgMember.create({
      data: {
        userId: session.user.id,
        organizationId: org.id,
        role: 'member',
        canDeleteProjects: true,
      },
    })

    if (session.user.email) {
      await sendWelcomeEmail({
        name: session.user.name,
        email: session.user.email,
      }).catch(() => null)
    }

    redirect('/dashboard/inicio')
  }

  return (
    <div className="min-h-screen bg-[#0C1F35] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="font-display text-3xl font-black text-white mb-1">
            Proyecto<span className="text-[#2E8FC0]">.</span>Vivo
          </div>
          <div className="text-[12px] text-[#8BA3B8]">Configura tu despacho</div>
        </div>

        {/* Pending invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-4 flex flex-col gap-3">
            {pendingInvitations.map((inv) => (
              <OnboardingInvitation
                key={inv.id}
                token={inv.token}
                orgName={inv.organization.name}
                inviterName={inv.invitedBy.name}
              />
            ))}
            <div className="text-[11px] text-[#4A5C6A] text-center">— o bien —</div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          <h1 className="text-[20px] font-bold text-white mb-1">
            Bienvenido{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-[13px] text-[#8BA3B8] mb-8">
            ¿Cómo se llama tu despacho?
          </p>

          <form action={createOrg} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#8BA3B8] uppercase tracking-wider mb-2">
                Nombre del despacho
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="Ej: Arquitectura Pedregal"
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-3 text-white text-[14px] placeholder-white/30 focus:outline-none focus:border-[#2E8FC0]/60 focus:bg-white/[0.08] transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#2E8FC0] hover:bg-[#2680ac] text-white font-semibold text-[14px] py-3 px-4 rounded-xl transition-colors mt-2"
            >
              Crear despacho →
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
