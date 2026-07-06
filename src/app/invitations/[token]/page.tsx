import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { maskEmail } from '@/lib/invitations'
import InvitationAccept from './InvitationAccept'

type Props = { params: Promise<{ token: string }> }

export default async function InvitationPage({ params }: Props) {
  const { token } = await params
  const [session, invitation] = await Promise.all([
    auth(),
    prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: { select: { name: true } },
        invitedBy:    { select: { name: true } },
      },
    }),
  ])

  if (!invitation || invitation.acceptedAt) {
    return (
      <PageShell>
        <h1 className="text-[20px] font-bold text-white mb-2">Invitación no válida</h1>
        <p className="text-[13px] text-[#8BA3B8]">
          Este enlace ya fue usado o no existe.
        </p>
        <a
          href="/login"
          className="mt-6 inline-block text-[13px] text-[#2E8FC0] hover:underline"
        >
          Ir al inicio →
        </a>
      </PageShell>
    )
  }

  const masked = maskEmail(invitation.email)

  if (invitation.expiresAt < new Date()) {
    return (
      <PageShell>
        <h1 className="text-[20px] font-bold text-white mb-2">Invitación expirada</h1>
        <p className="text-[13px] text-[#8BA3B8]">
          El enlace para <span className="text-white">{masked}</span> expiró.
          Pide a {invitation.invitedBy.name ?? 'quien te invitó'} que la reenvíe
          desde el equipo del proyecto.
        </p>
      </PageShell>
    )
  }

  // Logged-in + wrong email
  if (session?.user?.email && session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <PageShell>
        <h1 className="text-[20px] font-bold text-white mb-2">Invitación para otro email</h1>
        <p className="text-[13px] text-[#8BA3B8] mb-1">
          Esta invitación es para <span className="text-white">{masked}</span>.
        </p>
        <p className="text-[13px] text-[#8BA3B8]">
          Estás conectado como <span className="text-white">{session.user.email}</span>.
          Cierra sesión y entra con la cuenta invitada, o pide que reenvíen la
          invitación a tu email actual.
        </p>
      </PageShell>
    )
  }

  // Not logged in — show details + auth options
  if (!session?.user) {
    return (
      <PageShell>
        <InvitationCard invitation={invitation} />
        <div className="flex flex-col gap-3 mt-6">
          <a
            href={`/register?invitation=${token}`}
            className="w-full text-center py-3 bg-[#2E8FC0] hover:bg-[#2680AD] text-white font-semibold text-[14px] rounded-xl transition-colors"
          >
            Crear cuenta →
          </a>
          <a
            href={`/login?invitation=${token}`}
            className="w-full text-center py-3 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.12] text-white font-semibold text-[14px] rounded-xl transition-colors"
          >
            Ya tengo cuenta — Iniciar sesión
          </a>
        </div>
        <p className="text-[11px] text-[#4A5C6A] text-center mt-4">
          La invitación es para {masked}. Regístrate o inicia sesión con ese email.
        </p>
      </PageShell>
    )
  }

  // Logged in + correct email — show accept button (client component handles the POST)
  return (
    <PageShell>
      <InvitationCard invitation={invitation} />
      <InvitationAccept token={token} projectId={invitation.projectId} />
    </PageShell>
  )
}

function InvitationCard({ invitation }: {
  invitation: { orgName?: string; projectRole: string | null; invitedBy: { name: string | null }; organization: { name: string } }
}) {
  return (
    <div>
      <div className="text-[11px] font-bold text-[#2E8FC0] uppercase tracking-wider mb-4">
        Invitación a Proyecto Vivo
      </div>
      <h1 className="text-[22px] font-bold text-white mb-2 leading-tight">
        {invitation.invitedBy.name ?? 'Tu equipo'} te invitó a{' '}
        <span className="text-[#2E8FC0]">{invitation.organization.name}</span>
      </h1>
      {invitation.projectRole && (
        <p className="text-[13px] text-[#8BA3B8]">
          Rol asignado: <span className="text-white">{invitation.projectRole}</span>
        </p>
      )}
    </div>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0C1F35] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="font-display text-3xl font-black text-white mb-1">
            Proyecto<span className="text-[#2E8FC0]">.</span>Vivo
          </div>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
