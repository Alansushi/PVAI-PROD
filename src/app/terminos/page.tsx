import Link from 'next/link'

export const metadata = {
  title: 'Términos y Condiciones — Proyecto.Vivo',
  description: 'Términos y Condiciones de uso de la plataforma Proyecto.Vivo',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#0C1F35] text-white/80">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <div className="font-display text-xl font-black text-white">
          Proyecto<span className="text-[#2E8FC0]">.</span>Vivo
        </div>
        <Link
          href="/login"
          className="text-[13px] text-[#2E8FC0] hover:text-white transition-colors"
        >
          ← Volver al inicio
        </Link>
      </header>

      {/* Dev warning banner */}
      <div className="bg-[#E09B3D]/20 border-b border-[#E09B3D]/30 px-6 py-3 text-center">
        <p className="text-[12px] text-[#E09B3D] font-medium">
          ⚠️ Documento en revisión legal — completar los campos marcados con [PLACEHOLDER] antes de publicar
        </p>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Términos y Condiciones
        </h1>
        <p className="text-[13px] text-white/40 mb-10">
          Última actualización: [FECHA_VIGENCIA] · Ley aplicable: México, jurisdicción Ciudad de México
        </p>

        {/* 1. Descripción del servicio */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            1. Descripción del servicio
          </h2>
          <p className="text-[14px] leading-relaxed mb-3">
            <strong className="text-white">Proyecto.Vivo</strong> es una plataforma SaaS (Software as a Service)
            de coordinación inteligente de proyectos de construcción, arquitectura e ingeniería. El servicio
            incluye gestión de entregables, minutas, equipos, riesgos, métricas de avance y asistencia mediante
            inteligencia artificial.
          </p>
          <p className="text-[14px] leading-relaxed">
            El servicio es operado por <strong className="text-white">[NOMBRE_RESPONSABLE]</strong>
            (en adelante, &quot;la Plataforma&quot; o &quot;Proyecto.Vivo&quot;).
          </p>
        </section>

        {/* 2. Registro y cuenta */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            2. Registro y cuenta de usuario
          </h2>
          <p className="text-[14px] leading-relaxed mb-3">
            Para acceder al servicio, el usuario debe registrarse proporcionando información verídica y actualizada.
            Al crear una cuenta, el usuario declara:
          </p>
          <ul className="space-y-2 text-[14px] mb-4">
            {[
              'Tener al menos 18 años de edad',
              'Que la información proporcionada durante el registro es verdadera, precisa y actualizada',
              'Que es el titular legítimo del correo electrónico proporcionado',
              'Que utilizará el servicio únicamente para actividades profesionales lícitas',
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-[#2E8FC0] flex-shrink-0">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[14px] leading-relaxed">
            El usuario es exclusivamente responsable de mantener la confidencialidad de sus credenciales de acceso
            y de todas las actividades que ocurran bajo su cuenta. Debe notificar inmediatamente a Proyecto.Vivo
            cualquier uso no autorizado de su cuenta.
          </p>
        </section>

        {/* 3. Uso aceptable */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            3. Política de uso aceptable
          </h2>
          <p className="text-[14px] leading-relaxed mb-4">
            El usuario se compromete a utilizar el servicio de forma responsable. Están expresamente prohibidas
            las siguientes conductas:
          </p>
          <div className="space-y-2">
            {[
              'Registrar información falsa, engañosa o que suplante la identidad de un tercero',
              'Utilizar la plataforma para actividades ilegales o contrarias a la buena fe',
              'Realizar scraping, extracción automatizada de datos o acceso no autorizado a sistemas',
              'Enviar spam, comunicaciones masivas no solicitadas o contenido malicioso',
              'Utilizar el servicio para desarrollar productos o servicios competidores directos',
              'Intentar vulnerar la seguridad de la plataforma o acceder a datos de otros usuarios',
              'Revender, sublicenciar o transferir el acceso a la plataforma a terceros sin autorización',
              'Cargar contenido que infrinja derechos de propiedad intelectual de terceros',
            ].map((item, i) => (
              <div key={i} className="flex gap-3 text-[14px] bg-[#D94F4F]/[0.05] border border-[#D94F4F]/[0.12] rounded-lg px-4 py-3">
                <span className="text-[#D94F4F] flex-shrink-0">✗</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-white/40 mt-4">
            El incumplimiento de estas políticas puede resultar en la suspensión inmediata de la cuenta sin previo aviso.
          </p>
        </section>

        {/* 4. Planes y pagos */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            4. Planes y pagos
          </h2>
          <p className="text-[14px] leading-relaxed mb-4">
            Proyecto.Vivo ofrece los siguientes planes de suscripción:
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.08]">
              <p className="text-[13px] font-bold text-white mb-1">Plan Básico</p>
              <p className="text-[22px] font-bold text-[#2E8FC0] mb-1">[PRECIO_PLAN_BÁSICO]<span className="text-[14px] font-normal text-white/40">/mes</span></p>
              <p className="text-[12px] text-white/50">Hasta X proyectos activos · X miembros por proyecto</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-5 border border-[#2E8FC0]/30">
              <p className="text-[13px] font-bold text-white mb-1">Plan Pro</p>
              <p className="text-[22px] font-bold text-[#2E8FC0] mb-1">[PRECIO_PLAN_PRO]<span className="text-[14px] font-normal text-white/40">/mes</span></p>
              <p className="text-[12px] text-white/50">Proyectos ilimitados · Miembros ilimitados · IA avanzada</p>
            </div>
          </div>
          <div className="space-y-3 text-[14px]">
            <p>
              <strong className="text-white">Ciclo de facturación:</strong> Los cargos se realizan por adelantado,
              de forma mensual o anual según el plan elegido.
            </p>
            <p>
              <strong className="text-white">Procesamiento de pagos:</strong> Los pagos son procesados por
              [Stripe u otro procesador — PLACEHOLDER], un proveedor de pagos de terceros.
              Proyecto.Vivo no almacena datos de tarjetas de crédito o débito.
            </p>
            <p>
              <strong className="text-white">Modificación de precios:</strong> Proyecto.Vivo se reserva el derecho
              de modificar los precios de los planes con un aviso previo mínimo de <strong className="text-white">30 días naturales</strong> por
              correo electrónico. Los cambios no afectarán el ciclo de facturación vigente al momento del aviso.
            </p>
          </div>
        </section>

        {/* 5. Cancelación y reembolsos */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            5. Cancelación y política de reembolsos
          </h2>
          <div className="space-y-4 text-[14px]">
            <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]">
              <p className="text-[13px] font-bold text-white mb-2">Plan mensual</p>
              <p>
                El usuario puede cancelar en cualquier momento. La cancelación tiene efecto al final del período
                de facturación vigente. <strong className="text-white">No se realizan reembolsos proporcionales</strong> por
                los días no utilizados del mes en curso.
              </p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]">
              <p className="text-[13px] font-bold text-white mb-2">Plan anual</p>
              <p>
                En caso de cancelación de un plan anual antes de su vencimiento, el usuario tiene derecho a
                un <strong className="text-white">reembolso proporcional de los meses completos no utilizados</strong>,
                calculado sobre el precio mensual equivalente del plan anual. No aplica reembolso por meses parciales.
              </p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]">
              <p className="text-[13px] font-bold text-white mb-2">Período de gracia para reactivación</p>
              <p>
                Tras la cancelación, los datos del usuario se conservan por un período de{' '}
                <strong className="text-white">30 días naturales</strong>, durante los cuales el usuario puede
                reactivar su cuenta sin pérdida de información. Transcurrido ese plazo, los datos podrán ser
                eliminados de forma permanente.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Responsabilidades del usuario */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            6. Responsabilidades del organizador del proyecto
          </h2>
          <p className="text-[14px] leading-relaxed mb-3">
            El usuario que crea o administra proyectos en la plataforma es el único responsable de:
          </p>
          <ul className="space-y-2 text-[14px]">
            {[
              'La veracidad, precisión y actualidad de la información de proyectos, entregables y miembros del equipo',
              'Las decisiones tomadas con base en la información gestionada en la plataforma',
              'El uso apropiado de las funcionalidades de inteligencia artificial y la verificación de sus resultados',
              'Obtener los consentimientos necesarios de los miembros del equipo antes de ingresarlos a la plataforma',
              'El cumplimiento de las leyes aplicables a su actividad profesional y empresarial',
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-[#2E8FC0] flex-shrink-0">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 7. Limitación de responsabilidad */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            7. Limitación de responsabilidad de la Plataforma
          </h2>
          <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06] space-y-3 text-[14px]">
            <p>
              La Plataforma se proporciona &quot;tal como está&quot; (<em>as is</em>). Proyecto.Vivo no garantiza
              disponibilidad ininterrumpida del servicio ni un nivel de uptime específico.
            </p>
            <p>
              <strong className="text-white">Proyecto.Vivo no será responsable</strong> por: (i) pérdidas económicas
              derivadas de decisiones tomadas con base en información incorrecta ingresada por el usuario;
              (ii) daños indirectos, incidentales, especiales o consecuentes; (iii) pérdida de datos por causas
              ajenas al control razonable de la Plataforma; (iv) interrupciones del servicio por mantenimiento,
              fallas de terceros proveedores o causas de fuerza mayor.
            </p>
            <p>
              En ningún caso la responsabilidad total de Proyecto.Vivo excederá el monto pagado por el usuario
              durante los <strong className="text-white">3 meses anteriores</strong> al evento que originó la reclamación.
            </p>
          </div>
        </section>

        {/* 8. Propiedad intelectual */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            8. Propiedad intelectual
          </h2>
          <div className="space-y-4 text-[14px]">
            <p>
              <strong className="text-white">Datos del usuario:</strong> Los datos de proyectos, entregables,
              minutas y demás información ingresada por el usuario son y permanecen propiedad exclusiva del usuario.
              Proyecto.Vivo no adquiere ningún derecho de propiedad sobre dicha información.
            </p>
            <p>
              <strong className="text-white">Plataforma y marca:</strong> El código fuente, diseño, marca, logotipos,
              algoritmos de inteligencia artificial y demás elementos de la plataforma son propiedad exclusiva de
              [NOMBRE_RESPONSABLE]. Queda prohibida su reproducción, distribución o uso sin autorización expresa.
            </p>
            <p>
              <strong className="text-white">Licencia de uso:</strong> Proyecto.Vivo otorga al usuario una licencia
              limitada, no exclusiva, intransferible y revocable para acceder y utilizar el servicio conforme
              a estos Términos durante la vigencia de su suscripción.
            </p>
          </div>
        </section>

        {/* 9. Suspensión y cancelación */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            9. Suspensión y cancelación de cuenta
          </h2>
          <p className="text-[14px] leading-relaxed mb-4">
            Proyecto.Vivo podrá suspender o cancelar el acceso de un usuario en los siguientes casos:
          </p>
          <ul className="space-y-2 text-[14px] mb-4">
            {[
              'Incumplimiento de la Política de Uso Aceptable (Sección 3)',
              'Falta de pago de la suscripción vigente',
              'Proporcionar información falsa durante el registro',
              'Actividades que pongan en riesgo la seguridad de la plataforma o de otros usuarios',
              'Requerimiento de autoridad judicial o administrativa competente',
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-[#D94F4F] flex-shrink-0">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[14px] leading-relaxed">
            En casos graves o urgentes (riesgo de seguridad), la suspensión podrá ser inmediata sin previo aviso.
            En los demás casos, se notificará al usuario con al menos <strong className="text-white">7 días naturales</strong> de anticipación.
          </p>
        </section>

        {/* 10. Ley aplicable */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            10. Ley aplicable y jurisdicción
          </h2>
          <p className="text-[14px] leading-relaxed">
            Estos Términos y Condiciones se rigen por las leyes de los <strong className="text-white">Estados Unidos Mexicanos</strong>.
            Para la resolución de cualquier controversia derivada de la interpretación o aplicación de estos Términos,
            las partes se someten expresamente a la jurisdicción de los tribunales competentes de la{' '}
            <strong className="text-white">Ciudad de México</strong>, renunciando a cualquier otro fuero que pudiera
            corresponderles en razón de su domicilio presente o futuro.
          </p>
        </section>

        {/* 11. Cambios */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            11. Modificaciones a los Términos
          </h2>
          <p className="text-[14px] leading-relaxed">
            Proyecto.Vivo se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento.
            Las modificaciones serán notificadas con al menos <strong className="text-white">15 días naturales</strong> de
            anticipación por correo electrónico o mediante aviso en la plataforma. El uso continuado del servicio
            tras la entrada en vigor de las modificaciones implica la aceptación de los nuevos Términos.
          </p>
        </section>

        {/* Navigation */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/aviso-privacidad" className="text-[13px] text-[#2E8FC0] hover:text-white transition-colors">
            Ver Aviso de Privacidad →
          </Link>
          <Link href="/login" className="text-[13px] text-white/40 hover:text-white transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-5 text-center mt-8">
        <p className="text-[11px] text-white/30">
          © {new Date().getFullYear()} Proyecto.Vivo · [NOMBRE_RESPONSABLE] · Todos los derechos reservados
        </p>
      </footer>
    </div>
  )
}
