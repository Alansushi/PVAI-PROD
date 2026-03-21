import Link from 'next/link'

export const metadata = {
  title: 'Aviso de Privacidad — Proyecto.Vivo',
  description: 'Aviso de Privacidad conforme a la LFPDPPP (Ley Federal de Protección de Datos Personales en Posesión de los Particulares)',
}

export default function AvisoPrivacidadPage() {
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
          Aviso de Privacidad
        </h1>
        <p className="text-[13px] text-white/40 mb-10">
          Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) · Última actualización: [FECHA_VIGENCIA]
        </p>

        {/* 1. Identidad del Responsable */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            1. Identidad y domicilio del Responsable
          </h2>
          <p className="text-[14px] leading-relaxed mb-3">
            <strong className="text-white">[NOMBRE_RESPONSABLE]</strong>, con RFC <strong className="text-white">[RFC]</strong>,
            con domicilio en <strong className="text-white">[DOMICILIO_FISCAL]</strong>, Ciudad de México, México
            (en adelante, &quot;Proyecto.Vivo&quot; o &quot;el Responsable&quot;), es el responsable del tratamiento de sus datos personales
            conforme a la LFPDPPP y su Reglamento.
          </p>
          <p className="text-[14px] leading-relaxed">
            Para cualquier consulta relacionada con este Aviso de Privacidad, puede contactarnos en:
            <br />
            <span className="text-[#2E8FC0]">Email: [EMAIL_PRIVACIDAD]</span>
            <br />
            <span className="text-[#2E8FC0]">Teléfono: [TELÉFONO_CONTACTO]</span>
          </p>
        </section>

        {/* 2. Datos recabados */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            2. Datos personales que recabamos
          </h2>
          <p className="text-[14px] leading-relaxed mb-4">
            Para la prestación de nuestros servicios, recabamos las siguientes categorías de datos personales:
          </p>
          <div className="space-y-3">
            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-[13px] font-semibold text-white mb-2">Datos de identificación</p>
              <p className="text-[13px] text-white/60">Nombre completo</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-[13px] font-semibold text-white mb-2">Datos de contacto</p>
              <p className="text-[13px] text-white/60">Correo electrónico, número de teléfono</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-[13px] font-semibold text-white mb-2">Datos profesionales</p>
              <p className="text-[13px] text-white/60">Profesión, especialidad, nombre del despacho o empresa, URL del sitio web del despacho</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-[13px] font-semibold text-white mb-2">Datos de uso de la plataforma</p>
              <p className="text-[13px] text-white/60">Información sobre proyectos, entregables, minutas y actividad dentro de la plataforma generada durante el uso del servicio</p>
            </div>
          </div>
          <p className="text-[13px] text-white/40 mt-4">
            No recabamos datos personales sensibles en los términos del artículo 3, fracción VI de la LFPDPPP.
          </p>
        </section>

        {/* 3. Finalidades */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            3. Finalidades del tratamiento
          </h2>
          <p className="text-[14px] font-semibold text-white mb-3">Finalidades primarias (necesarias para la relación jurídica):</p>
          <ul className="space-y-2 mb-6">
            {[
              'Creación y administración de su cuenta de usuario',
              'Prestación del servicio de coordinación de proyectos de construcción y arquitectura',
              'Autenticación e identificación en la plataforma',
              'Envío de notificaciones transaccionales relacionadas con sus proyectos (alertas de entregables, recordatorios)',
              'Atención de solicitudes de soporte técnico',
              'Cumplimiento de obligaciones legales y fiscales aplicables',
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-[14px]">
                <span className="text-[#2A9B6F] mt-0.5 flex-shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[14px] font-semibold text-white mb-3">Finalidades secundarias (no necesarias para la relación jurídica):</p>
          <ul className="space-y-2 mb-4">
            {[
              'Análisis estadístico para mejora del servicio',
              'Envío de comunicaciones sobre nuevas funcionalidades o actualizaciones de la plataforma',
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-[14px]">
                <span className="text-[#E09B3D] mt-0.5 flex-shrink-0">◦</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-white/50 bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
            Si usted no desea que sus datos sean tratados para las finalidades secundarias, puede manifestarlo enviando
            un correo a <span className="text-[#2E8FC0]">[EMAIL_PRIVACIDAD]</span> indicando &quot;Opt-out finalidades secundarias&quot;.
            La negativa no afectará la prestación del servicio principal.
          </p>
        </section>

        {/* 4. Transferencias */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            4. Transferencias de datos personales
          </h2>
          <p className="text-[14px] leading-relaxed mb-4">
            Sus datos personales pueden ser transferidos a los siguientes terceros en el marco de la prestación del servicio:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-3 pr-4 font-semibold text-white">Tercero</th>
                  <th className="text-left py-3 pr-4 font-semibold text-white">Finalidad</th>
                  <th className="text-left py-3 font-semibold text-white">Base jurídica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                <tr>
                  <td className="py-3 pr-4 text-white/70">Google LLC</td>
                  <td className="py-3 pr-4 text-white/70">Autenticación mediante Google OAuth</td>
                  <td className="py-3 text-white/70">Ejecución del contrato (Art. 37, fracción I LFPDPPP)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-white/70">Supabase, Inc.</td>
                  <td className="py-3 pr-4 text-white/70">Almacenamiento de datos en base de datos segura</td>
                  <td className="py-3 text-white/70">Ejecución del contrato (Art. 37, fracción I LFPDPPP)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-white/70">Resend, Inc.</td>
                  <td className="py-3 pr-4 text-white/70">Envío de correos electrónicos transaccionales</td>
                  <td className="py-3 text-white/70">Ejecución del contrato (Art. 37, fracción I LFPDPPP)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-white/70">Vercel, Inc.</td>
                  <td className="py-3 pr-4 text-white/70">Alojamiento de la aplicación web</td>
                  <td className="py-3 text-white/70">Ejecución del contrato (Art. 37, fracción I LFPDPPP)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[13px] text-white/40 mt-4">
            No realizamos transferencias de datos con fines comerciales a terceros no relacionados con la prestación del servicio.
          </p>
        </section>

        {/* 5. Derechos ARCO */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            5. Derechos ARCO
          </h2>
          <p className="text-[14px] leading-relaxed mb-4">
            Usted tiene derecho a <strong className="text-white">Acceder</strong>, <strong className="text-white">Rectificar</strong>,{' '}
            <strong className="text-white">Cancelar</strong> u <strong className="text-white">Oponerse</strong> al tratamiento
            de sus datos personales (derechos ARCO), en los términos previstos en la LFPDPPP.
          </p>
          <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06] space-y-3">
            <p className="text-[14px] font-semibold text-white">Para ejercer sus derechos ARCO:</p>
            <ol className="space-y-2 text-[13px]">
              <li className="flex gap-3">
                <span className="text-[#2E8FC0] font-bold flex-shrink-0">1.</span>
                <span>Envíe un correo a <span className="text-[#2E8FC0]">[EMAIL_PRIVACIDAD]</span> con el asunto &quot;Ejercicio de Derechos ARCO&quot;</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#2E8FC0] font-bold flex-shrink-0">2.</span>
                <span>Incluya su nombre completo y correo electrónico registrado en la plataforma</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#2E8FC0] font-bold flex-shrink-0">3.</span>
                <span>Especifique qué derecho desea ejercer y, en su caso, para qué datos específicos</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#2E8FC0] font-bold flex-shrink-0">4.</span>
                <span>Adjunte identificación oficial vigente</span>
              </li>
            </ol>
            <p className="text-[13px] text-white/50 mt-2">
              Responderemos a su solicitud en un plazo máximo de 20 días hábiles a partir de su recepción,
              conforme al artículo 32 de la LFPDPPP.
            </p>
          </div>
        </section>

        {/* 6. Revocación del consentimiento */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            6. Revocación del consentimiento y eliminación de cuenta
          </h2>
          <p className="text-[14px] leading-relaxed mb-3">
            Usted puede revocar su consentimiento para el tratamiento de sus datos personales en cualquier momento.
            Para solicitar la eliminación completa de su cuenta y datos asociados:
          </p>
          <ul className="space-y-2 text-[14px]">
            <li className="flex gap-3">
              <span className="text-[#2E8FC0] flex-shrink-0">→</span>
              <span>Envíe un correo a <span className="text-[#2E8FC0]">[EMAIL_PRIVACIDAD]</span> con el asunto &quot;Solicitud de eliminación de cuenta&quot;</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#2E8FC0] flex-shrink-0">→</span>
              <span>Procesaremos su solicitud en un plazo máximo de 30 días hábiles</span>
            </li>
          </ul>
          <p className="text-[13px] text-white/40 mt-4">
            Nota: la revocación no tendrá efectos retroactivos y no afecta el tratamiento previo a su solicitud.
            Ciertos datos podrán conservarse por el tiempo requerido por obligaciones legales o fiscales.
          </p>
        </section>

        {/* 7. Cookies */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            7. Uso de cookies y tecnologías de seguimiento
          </h2>
          <p className="text-[14px] leading-relaxed mb-3">
            Esta plataforma utiliza <strong className="text-white">cookies de sesión estrictamente necesarias</strong> para
            mantener su autenticación mientras navega por el servicio. Estas cookies no recopilan información con fines
            publicitarios ni se comparten con terceros para ese fin.
          </p>
          <p className="text-[14px] leading-relaxed">
            Las cookies de sesión se eliminan automáticamente al cerrar su navegador o al cerrar sesión en la plataforma.
            No utilizamos cookies de rastreo de terceros ni píxeles de publicidad.
          </p>
        </section>

        {/* 8. Cambios al Aviso */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            8. Cambios al Aviso de Privacidad
          </h2>
          <p className="text-[14px] leading-relaxed">
            Nos reservamos el derecho de modificar este Aviso de Privacidad en cualquier momento.
            Cualquier modificación será notificada mediante correo electrónico al titular o mediante aviso
            visible en la plataforma con al menos 15 días de anticipación a su entrada en vigor.
            La versión vigente siempre estará disponible en esta página.
          </p>
        </section>

        {/* 9. INAI */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold text-white mb-4 pb-2 border-b border-white/[0.08]">
            9. Autoridad competente
          </h2>
          <p className="text-[14px] leading-relaxed">
            Si considera que su derecho a la protección de datos personales ha sido lesionado por alguna conducta
            del Responsable, podrá interponer la queja o denuncia correspondiente ante el{' '}
            <strong className="text-white">Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI)</strong>,
            www.inai.org.mx.
          </p>
        </section>

        {/* Navigation */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/terminos" className="text-[13px] text-[#2E8FC0] hover:text-white transition-colors">
            Ver Términos y Condiciones →
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
