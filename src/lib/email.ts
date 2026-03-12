import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Proyecto Vivo <onboarding@resend.dev>'

interface UserInfo {
  name?: string | null
  email: string
}

interface DeliverableInfo {
  name: string
  dueDate?: Date | null
  projectTitle?: string
}

export async function sendWelcomeEmail(user: UserInfo) {
  if (!process.env.RESEND_API_KEY) return

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: 'Bienvenido a Proyecto Vivo',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #0C1F35; font-size: 24px; margin-bottom: 16px;">
          Bienvenido${user.name ? `, ${user.name}` : ''}
        </h1>
        <p style="color: #4A5568; line-height: 1.6;">
          Tu cuenta en Proyecto Vivo está lista. Ya puedes gestionar tus proyectos,
          entregables y equipo desde el dashboard.
        </p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/inicio"
           style="display: inline-block; margin-top: 24px; padding: 12px 24px;
                  background: #2E8FC0; color: white; text-decoration: none;
                  border-radius: 8px; font-weight: 600;">
          Ir al dashboard →
        </a>
      </div>
    `,
  })
}

export async function sendProjectInviteEmail(
  email: string,
  params: {
    inviteeName: string
    projectTitle: string
    orgName: string
    inviterName: string
  }
) {
  if (!process.env.RESEND_API_KEY) return

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Te agregaron al proyecto ${params.projectTitle}`,
    html: `
      <div style="background:#0C1F35;padding:40px 0;min-height:100vh;">
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#112233;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.1);">
          <div style="margin-bottom:24px;">
            <span style="color:#2E8FC0;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">PROYECTO VIVO</span>
          </div>
          <h1 style="color:#ffffff;font-size:22px;margin-bottom:8px;line-height:1.3;">
            ${params.inviterName} te agregó al proyecto <em>${params.projectTitle}</em>
          </h1>
          <p style="color:#8A9BB0;line-height:1.7;font-size:14px;margin-bottom:24px;">
            Crea tu cuenta en Proyecto Vivo para ver el avance del proyecto, gestionar tus tareas
            y colaborar con el equipo de ${params.orgName}.
          </p>
          <a href="${process.env.NEXTAUTH_URL}/login"
             style="display:inline-block;padding:13px 28px;background:#2E8FC0;color:white;
                    text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
            Crear mi cuenta →
          </a>
          <p style="color:#4A5C6A;font-size:12px;margin-top:24px;">
            Inicia sesión con tu cuenta de Google. Es gratis.
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendTaskAssignedEmail(
  email: string,
  params: { assigneeName: string; taskName: string; projectTitle: string; dueDate?: Date | null }
) {
  if (!process.env.RESEND_API_KEY) return

  const dueDateStr = params.dueDate
    ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(params.dueDate)
    : null

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Te asignaron una tarea en ${params.projectTitle}`,
    html: `
      <div style="background:#0C1F35;padding:40px 0;min-height:100vh;">
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#112233;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.1);">
          <div style="margin-bottom:24px;">
            <span style="color:#2E8FC0;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">PROYECTO VIVO</span>
          </div>
          <h1 style="color:#ffffff;font-size:22px;margin-bottom:8px;line-height:1.3;">
            Hola${params.assigneeName ? `, ${params.assigneeName}` : ''} — tienes una nueva tarea
          </h1>
          <p style="color:#8A9BB0;line-height:1.7;font-size:14px;margin-bottom:8px;">
            Se te asignó <strong style="color:#ffffff;">${params.taskName}</strong>
            en el proyecto <strong style="color:#ffffff;">${params.projectTitle}</strong>.
          </p>
          ${dueDateStr ? `<p style="color:#E09B3D;font-size:13px;font-weight:600;margin-bottom:24px;">Vence: ${dueDateStr}</p>` : '<div style="margin-bottom:24px;"></div>'}
          <a href="${process.env.NEXTAUTH_URL}/dashboard/inicio"
             style="display:inline-block;padding:13px 28px;background:#2E8FC0;color:white;
                    text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
            Ver mis tareas →
          </a>
        </div>
      </div>
    `,
  })
}

export async function sendOverdueTaskAlert(user: UserInfo, deliverable: DeliverableInfo) {
  if (!process.env.RESEND_API_KEY) return

  const dueDateStr = deliverable.dueDate
    ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(deliverable.dueDate)
    : 'sin fecha'

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Entregable vencido: ${deliverable.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #D94F4F; font-size: 20px; margin-bottom: 16px;">
          Entregable vencido
        </h1>
        <p style="color: #4A5568; line-height: 1.6;">
          El entregable <strong>${deliverable.name}</strong>
          ${deliverable.projectTitle ? `del proyecto <strong>${deliverable.projectTitle}</strong>` : ''}
          venció el ${dueDateStr} y aún no está completado.
        </p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/inicio"
           style="display: inline-block; margin-top: 24px; padding: 12px 24px;
                  background: #D94F4F; color: white; text-decoration: none;
                  border-radius: 8px; font-weight: 600;">
          Ver entregable →
        </a>
      </div>
    `,
  })
}
