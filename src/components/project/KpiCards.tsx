import type { KpiData } from '@/lib/types'

interface Props {
  kpis: KpiData
}

export default function KpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-3 cursor-pointer transition-all hover:border-pv-accent hover:bg-white/[0.07]">
        <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-1.5">Próxima exhibición</div>
        <div className="font-display text-[22px] font-black leading-none text-pv-green">{kpis.k1v}</div>
        <div className="text-[10px] text-pv-gray mt-0.5">{kpis.k1s}</div>
        <div className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-lg mt-1 bg-pv-green/20 text-pv-green">{kpis.k1p}</div>
      </div>
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-3 cursor-pointer transition-all hover:border-pv-accent hover:bg-white/[0.07]">
        <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-1.5">En riesgo esta semana</div>
        <div className="font-display text-[22px] font-black leading-none text-pv-amber">{kpis.k2v}</div>
        <div className="text-[10px] text-pv-gray mt-0.5">entregables sin avance</div>
        <div className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-lg mt-1 bg-pv-amber/20 text-pv-amber">⚠️ Requieren acción hoy</div>
      </div>
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-3 cursor-pointer transition-all hover:border-pv-accent hover:bg-white/[0.07]">
        <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-1.5">Avance del proyecto</div>
        <div className="font-display text-[22px] font-black leading-none text-pv-accent">{kpis.k3v}</div>
        <div className="text-[10px] text-pv-gray mt-0.5">{kpis.k3s}</div>
        <div className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-lg mt-1 bg-pv-accent/20 text-pv-accent">{kpis.k3p}</div>
      </div>
      <div className="bg-pv-purple/8 border border-pv-purple/20 rounded-xl px-3.5 py-3 cursor-pointer transition-all hover:border-pv-purple/40 hover:bg-pv-purple/12">
        <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-1.5">Pendientes del agente</div>
        <div className="font-display text-[22px] font-black leading-none text-[#B89EE8]">{kpis.k4v}</div>
        <div className="text-[10px] text-pv-gray mt-0.5">{kpis.k4s}</div>
        <div className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-lg mt-1 bg-pv-purple/20 text-[#B89EE8]">✦ Agente activo</div>
      </div>
    </div>
  )
}
