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

      {/* Centro: placeholder para links futuros */}
      <div className="flex items-center gap-4 text-[10px] text-pv-gray/40">
        {/* Espacio reservado para links */}
      </div>

      {/* Derecha: copyright */}
      <div className="text-[10px] text-pv-gray/40">
        © {new Date().getFullYear()} Proyecto Vivo · Todos los derechos reservados
      </div>
    </footer>
  )
}
