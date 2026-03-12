import { AGENT_PROMPTS, PROMPT_CATEGORIES, AgentPrompt } from '@/lib/agent-prompts'

interface Props {
  onAsk: (prompt: AgentPrompt) => void
  onMinuta: () => void
}

const categories = ['analisis', 'paquetes', 'equipo'] as const

export default function QuickChips({ onAsk, onMinuta }: Props) {
  return (
    <div className="flex flex-col gap-2 px-2.5 pb-2">
      {categories.map(cat => (
        <div key={cat}>
          <div className="text-[8.5px] font-bold uppercase tracking-[0.6px] text-pv-gray/60 px-0.5 pb-1">
            {PROMPT_CATEGORIES[cat]}
          </div>
          <div className="flex flex-col gap-0.5">
            {AGENT_PROMPTS.filter(p => p.category === cat).map(prompt => (
              <button
                key={prompt.id}
                onClick={() => onAsk(prompt)}
                className="px-2.5 py-1.5 rounded-md text-[10.5px] font-medium cursor-pointer transition-all text-left border font-sans
                  bg-pv-purple/10 border-pv-purple/25 text-[#B89EE8] hover:bg-pv-purple/22 hover:border-pv-purple"
              >
                {prompt.icon} {prompt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={onMinuta}
        className="px-2.5 py-1.5 rounded-md text-[10.5px] font-medium cursor-pointer transition-all text-left border font-sans
          bg-pv-accent/10 border-pv-accent/25 text-pv-accent hover:bg-pv-accent/20"
      >
        ✦ Minuta
      </button>
    </div>
  )
}
