import { Suspense } from 'react'
import LoginPanel from './LoginPanel'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0C1F35] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="font-display text-3xl font-black text-white mb-1">
            Proyecto<span className="text-[#2E8FC0]">.</span>Vivo
          </div>
          <div className="text-[12px] text-[#8BA3B8]">Tu agente IA de proyectos</div>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          <h1 className="text-[20px] font-bold text-white mb-1">Inicia sesión</h1>
          <p className="text-[13px] text-[#8BA3B8] mb-8">
            Accede a tu despacho y gestiona tus proyectos.
          </p>

          <Suspense fallback={null}>
            <LoginPanel />
          </Suspense>

          <p className="text-center text-[11px] text-[#8BA3B8] mt-6">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>

        {/* Demo link */}
        <div className="text-center mt-6">
          <a
            href="/demo"
            className="text-[12px] text-[#8BA3B8] hover:text-white transition-colors no-underline"
          >
            Ver demo pública sin login →
          </a>
        </div>
      </div>
    </div>
  )
}
