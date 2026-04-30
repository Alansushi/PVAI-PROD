'use client'

import { useState, useEffect, useRef } from 'react'
import { AGENT_PROMPTS, AgentPrompt } from '@/lib/agent-prompts'

interface Props {
  onSend: (text: string) => void
  onChip: (prompt: AgentPrompt) => void
  contextChips?: AgentPrompt[]
  onExpandChat?: () => void
}

export default function AgentComposer({ onSend, onChip, contextChips, onExpandChat }: Props) {
  const [text, setText] = useState('')
  const [chipOffset, setChipOffset] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const chipSource = contextChips && contextChips.length > 0 ? contextChips : AGENT_PROMPTS

  // Rotate chips every 8 seconds
  useEffect(() => {
    setChipOffset(0)
    const id = setInterval(() => {
      setChipOffset(o => (o + 1) % chipSource.length)
    }, 8000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipSource.length])

  // Get 3 chips with wrap-around
  const visibleChips = [0, 1, 2].map(
    i => chipSource[(chipOffset + i) % chipSource.length]
  )

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }

  function handleChip(prompt: AgentPrompt) {
    onChip(prompt)
    setText('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.metaKey && e.key === 'Enter') {
      e.preventDefault()
      onExpandChat?.()
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const disabled = text.trim() === ''

  return (
    <div className="flex-shrink-0 border-t border-pv-accent/20 px-3 py-2.5" style={{ background: 'rgba(46,143,192,0.05)' }}>
      {/* Chips row */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {visibleChips.map(prompt => (
          <button
            key={`${prompt.id}-${chipOffset}`}
            onClick={() => handleChip(prompt)}
            className="text-[9.5px] bg-pv-accent/10 hover:bg-pv-accent/20 border border-pv-accent/30 text-pv-accent/80 rounded-full px-2 py-0.5 transition-colors cursor-pointer"
          >
            {prompt.icon} {prompt.label} ▸
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-center">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregúntale a tu agente…"
          rows={1}
          className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-[#C0D0E0] placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 focus:bg-white/[0.09] resize-none"
        />
        <button
          onClick={handleSend}
          disabled={disabled}
          className="ml-1.5 text-pv-accent hover:text-white disabled:opacity-30 transition-colors"
          aria-label="Enviar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      {onExpandChat && (
        <p className="text-[8.5px] text-pv-gray/40 mt-1 text-right">⌘+Enter para chat expandido</p>
      )}
    </div>
  )
}
