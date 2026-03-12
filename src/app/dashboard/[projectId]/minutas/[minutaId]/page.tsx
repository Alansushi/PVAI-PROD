import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { MinutaAction } from '@/lib/agent-prompts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

interface Props {
  params: { projectId: string; minutaId: string }
}

const TYPE_BADGE: Record<string, string> = {
  update: 'bg-pv-accent/15 text-pv-accent',
  create: 'bg-pv-green/15 text-pv-green',
  note:   'bg-pv-amber/15 text-pv-amber',
}

const TYPE_LABEL: Record<string, string> = {
  update: 'actualizar',
  create: 'crear',
  note:   'nota',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function actionDetail(action: MinutaAction): string {
  if (action.type === 'update') {
    return Object.entries(action.changes)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
  }
  if (action.type === 'note') return action.note
  return `${action.status} · ${action.priority}`
}

export default async function MinutaDetailPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const memberships = await prisma.orgMember.findMany({ where: { userId: session.user.id } })
  if (!memberships.length) redirect('/onboarding')

  const orgIds = memberships.map(m => m.organizationId)
  const guestOrgIds = memberships.filter(m => m.role === 'guest').map(m => m.organizationId)
  const project = await prisma.project.findFirst({
    where: { id: params.projectId, organizationId: { in: orgIds } },
  })
  if (!project) redirect('/dashboard/inicio')
  if (guestOrgIds.includes(project.organizationId)) {
    const isMember = await prisma.projectMember.findFirst({ where: { projectId: params.projectId, userId: session.user.id } })
    if (!isMember) redirect('/dashboard/inicio')
  }

  const minuta = await db.processedMinuta.findUnique({
    where: { id: params.minutaId },
    include: { user: { select: { name: true } } },
  })

  if (!minuta || minuta.projectId !== params.projectId) redirect(`/dashboard/${params.projectId}`)

  let actions: MinutaAction[] = []
  try {
    actions = JSON.parse(minuta.actionsJson)
  } catch {
    actions = []
  }

  return (
    <div className="p-5 flex flex-col gap-5 max-w-3xl">
      {/* Back link */}
      <Link
        href={`/dashboard/${params.projectId}`}
        className="text-[11px] text-pv-gray hover:text-white transition-colors self-start flex items-center gap-1"
      >
        ← Volver al proyecto
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-display text-[20px] font-black leading-snug">{minuta.title}</h1>
        <div className="text-[11px] text-pv-gray mt-1 flex items-center gap-1.5">
          <span>{formatDate(minuta.createdAt.toISOString())}</span>
          {minuta.user?.name && (
            <>
              <span>·</span>
              <span>Procesado por <span className="text-white">{minuta.user.name}</span></span>
            </>
          )}
        </div>
      </div>

      {/* Input text */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] text-pv-gray uppercase tracking-wider font-semibold">Texto original de la reunión</div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 max-h-[220px] overflow-y-auto">
          <pre className="text-[11px] text-pv-gray/80 font-mono whitespace-pre-wrap leading-relaxed">
            {minuta.inputText}
          </pre>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] text-pv-gray uppercase tracking-wider font-semibold">Resumen de Claude</div>
        <div className="bg-pv-accent/[0.07] border border-pv-accent/20 rounded-xl px-4 py-3">
          <p className="text-[12px] text-white/90 leading-relaxed">{minuta.summary}</p>
        </div>
      </div>

      {/* Actions table */}
      {actions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] text-pv-gray uppercase tracking-wider font-semibold">
            Acciones aplicadas ({actions.length})
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
            <div
              className="grid px-4 py-2 border-b border-white/[0.07] text-[9px] font-semibold text-pv-gray uppercase tracking-wider"
              style={{ gridTemplateColumns: '80px 1fr 1fr' }}
            >
              <span>Tipo</span>
              <span>Entregable</span>
              <span>Detalle</span>
            </div>
            <div className="flex flex-col divide-y divide-white/[0.04]">
              {actions.map((action, i) => (
                <div
                  key={i}
                  className="grid px-4 py-2.5 items-start text-[11px]"
                  style={{ gridTemplateColumns: '80px 1fr 1fr' }}
                >
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase self-start ${TYPE_BADGE[action.type] ?? ''}`}>
                    {TYPE_LABEL[action.type] ?? action.type}
                  </span>
                  <span className="text-white pr-3">{action.name}</span>
                  <span className="text-pv-gray/80">{actionDetail(action)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
