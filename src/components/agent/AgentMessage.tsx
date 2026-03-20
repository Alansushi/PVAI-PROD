import type { AgentMessage as AgentMessageType } from '@/lib/types'

interface Props {
  message: AgentMessageType
}

export default function AgentMessage({ message }: Props) {
  const isUser = message.role === 'user'
  return (
    <div
      className={`border-l-2 rounded-r-lg rounded-br-lg px-2.5 py-2 text-[11px] leading-relaxed text-[#C0D0E0] animate-msgIn
        ${isUser
          ? 'border-pv-purple/80 bg-pv-purple/[0.12]'
          : 'border-pv-accent bg-pv-accent/[0.07]'
        }`}
    >
      <div
        className={`msg-content ${isUser ? 'system' : ''}`}
        dangerouslySetInnerHTML={{ __html: message.html }}
      />
      <div className="text-[9px] text-pv-gray mt-1">{message.time}</div>
    </div>
  )
}
