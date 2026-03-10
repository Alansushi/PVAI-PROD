'use client'

import { useParams } from 'next/navigation'
import { useAgentContext } from '@/lib/context/AgentContext'
import { useAgent } from '@/lib/hooks/useAgent'
import AgentMessages from '@/components/agent/AgentMessages'
import TypingIndicator from '@/components/agent/TypingIndicator'
import QuickChips from '@/components/agent/QuickChips'
import FileAttach from '@/components/agent/FileAttach'
import { useState, useRef } from 'react'

export default function AgentPanel() {
  const params = useParams()
  const projectId = (params?.projectId as string) ?? 'pedregal'
  const { isTyping, isProcessing, processingText, attachedFiles, clearFiles } = useAgentContext()
  const { askAgent, sendFree, generateDoc } = useAgent(projectId)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSend() {
    if (!input.trim() && attachedFiles.length === 0) return
    sendFree(input, attachedFiles)
    clearFiles()
    setInput('')
  }

  return (
    <div
      className="border-l border-white/[0.06] flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(180deg,rgba(15,45,74,0.5),rgba(12,31,53,0.8))' }}
    >
      {/* Header */}
      <div className="px-3.5 py-3 border-b border-pv-accent/15 flex items-center gap-1.5 flex-shrink-0">
        <div className="w-[7px] h-[7px] bg-pv-teal rounded-full animate-pulse" />
        <h3 className="text-xs font-bold text-pv-accent flex-1">Agente IA · Proyecto Vivo</h3>
        <div className="text-[9px] text-pv-teal font-semibold bg-pv-teal/10 px-1.5 py-0.5 rounded-lg">En línea</div>
      </div>

      {/* Messages */}
      <AgentMessages />

      {/* Typing */}
      {isTyping && <TypingIndicator />}

      {/* Processing */}
      {isProcessing && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-pv-purple/10 border-t border-pv-purple/20 text-[10px] text-[#B89EE8] font-semibold flex-shrink-0">
          <div className="w-3 h-3 border-2 border-pv-purple/30 border-t-[#B89EE8] rounded-full animate-spin flex-shrink-0" />
          {processingText}
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-white/[0.07]">
        <div className="text-[9px] font-bold uppercase tracking-[0.5px] text-pv-purple px-3.5 pt-2.5 pb-1">
          ✦ Escribe o elige una acción
        </div>
        <QuickChips onAsk={askAgent} onGenerate={generateDoc} />
        <FileAttach />
        <div className="flex gap-1.5 px-2.5 pb-3 pt-1.5">
          <button
            onClick={() => inputRef.current?.click()}
            className="bg-white/[0.06] border border-white/10 rounded-lg p-2 cursor-pointer transition-all hover:bg-pv-accent/15 hover:border-pv-accent/40 hover:text-pv-accent text-pv-gray flex items-center justify-center flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <input
            className="flex-1 bg-white/[0.05] border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-[11px] text-pv-white font-mono outline-none transition-colors focus:border-pv-purple/50 focus:bg-pv-purple/7 placeholder:text-pv-gray"
            placeholder='"El cliente aprobó cambiar fachada..."'
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            className="bg-pv-purple border-none rounded-lg px-3 py-1.5 cursor-pointer text-sm text-white transition-all hover:bg-[#9070D4] flex-shrink-0"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
