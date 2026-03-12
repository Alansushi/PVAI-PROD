import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import RegisterForm from './RegisterForm'

export default async function RegisterPage() {
  const session = await auth()
  if (session) redirect('/dashboard/inicio')

  return (
    <div className="min-h-screen bg-[#0C1F35] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="font-display text-3xl font-black text-white mb-1">
            Proyecto<span className="text-[#2E8FC0]">.</span>Vivo
          </div>
          <div className="text-[12px] text-[#8BA3B8]">Tu agente IA de proyectos</div>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          <h1 className="text-[20px] font-bold text-white mb-1">Crear cuenta</h1>
          <p className="text-[13px] text-[#8BA3B8] mb-8">
            Registra tu despacho y empieza a gestionar proyectos.
          </p>

          <RegisterForm />

          <p className="text-center text-[11px] text-[#8BA3B8] mt-6">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>

        <div className="text-center mt-6">
          <p className="text-[12px] text-[#8BA3B8]">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-[#2E8FC0] hover:text-white transition-colors">
              Iniciar sesión →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
