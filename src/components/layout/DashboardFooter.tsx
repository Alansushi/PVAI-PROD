import Link from 'next/link'

export default function DashboardFooter() {
  return (
    <footer
      className="border-t border-white/[0.06] px-6 py-4 flex items-center justify-between"
      style={{ background: 'rgba(0,0,0,0.15)' }}
    >
      {/* Izquierda: branding + versión */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-pv-accent tracking-wider">PROYECTO.VIVO</span>
        <span className="text-[9px] text-pv-gray/50">v0.1.0</span>
      </div>

      {/* Centro: links legales */}
      <div className="flex items-center gap-4 text-[10px] text-pv-gray/40">
        <Link href="/aviso-privacidad" className="hover:text-pv-gray transition-colors" target="_blank">
          Aviso de Privacidad
        </Link>
        <span>·</span>
        <Link href="/terminos" className="hover:text-pv-gray transition-colors" target="_blank">
          Términos y Condiciones
        </Link>
      </div>

      {/* Derecha: copyright */}
      <div className="text-[10px] text-pv-gray/40">
        © {new Date().getFullYear()} Proyecto Vivo · Todos los derechos reservados
      </div>
    </footer>
  )
}
