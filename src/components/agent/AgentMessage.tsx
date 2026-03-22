import DOMPurify from 'isomorphic-dompurify'
import parse from 'html-react-parser'
import type { AgentMessage as AgentMessageType } from '@/lib/types'

const ALLOWED_TAGS = ['br', 'strong', 'span', 'em', 'ul', 'li', 'p']
const ALLOWED_ATTR = ['class']

interface Props {
  message: AgentMessageType
}

export default function AgentMessage({ message }: Props) {
  const isUser = message.role === 'user'
  const safeHtml = DOMPurify.sanitize(message.html, { ALLOWED_TAGS, ALLOWED_ATTR })
  return (
    <div
      className={`border-l-2 rounded-r-lg rounded-br-lg px-2.5 py-2 text-[11px] leading-relaxed text-[#C0D0E0] animate-msgIn
        ${isUser
          ? 'border-pv-purple/80 bg-pv-purple/[0.12]'
          : 'border-pv-accent bg-pv-accent/[0.07]'
        }`}
    >
      <div className={`msg-content ${isUser ? 'system' : ''}`}>
        {parse(safeHtml)}
      </div>
      <div className="text-[9px] text-pv-gray mt-1">{message.time}</div>
    </div>
  )
}
