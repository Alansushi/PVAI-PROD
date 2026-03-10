interface Props {
  onAsk: (type: 'riesgos' | 'cobro' | 'tiempo') => void
  onGenerate: () => void
}

export default function QuickChips({ onAsk, onGenerate }: Props) {
  return (
    <div className="flex flex-col gap-0.5 px-2.5 pb-2">
      {[
        { label: '¿Qué riesgos tiene esta semana?', type: 'riesgos' as const, variant: 'nl' },
        { label: '¿Qué falta para cobrar?',          type: 'cobro' as const,   variant: 'nl' },
        { label: '¿Estamos en tiempo?',               type: 'tiempo' as const,  variant: 'nl' },
      ].map(chip => (
        <button
          key={chip.type}
          onClick={() => onAsk(chip.type)}
          className="px-2.5 py-1.5 rounded-md text-[10.5px] font-medium cursor-pointer transition-all text-left border font-sans
            bg-pv-purple/10 border-pv-purple/25 text-[#B89EE8] hover:bg-pv-purple/22 hover:border-pv-purple"
        >
          {chip.label}
        </button>
      ))}
      <button
        onClick={onGenerate}
        className="px-2.5 py-1.5 rounded-md text-[10.5px] font-medium cursor-pointer transition-all text-left border font-sans
          bg-pv-accent/10 border-pv-accent/25 text-pv-accent hover:bg-pv-accent/20"
      >
        Generar memoria descriptiva
      </button>
    </div>
  )
}
