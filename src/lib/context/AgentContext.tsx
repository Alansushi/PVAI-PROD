'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { AgentMessage } from '@/lib/types'

interface AgentContextValue {
  messages: AgentMessage[]
  isTyping: boolean
  isProcessing: boolean
  processingText: string
  attachedFiles: string[]
  addMessage: (html: string, role?: 'agent' | 'user') => void
  setTyping: (v: boolean) => void
  setProcessing: (text: string | false) => void
  addFile: (name: string) => void
  removeFile: (i: number) => void
  clearFiles: () => void
  initMessages: (msgs: (AgentMessage | { text: string; time: string })[]) => void
}

const AgentContext = createContext<AgentContextValue | null>(null)

export function AgentProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingText, setProcessingText] = useState('Procesando...')
  const [attachedFiles, setAttachedFiles] = useState<string[]>([])

  const addMessage = useCallback((html: string, role: 'agent' | 'user' = 'agent') => {
    setMessages(prev => [
      ...prev,
      { id: `m${Date.now()}${Math.random()}`, role, html, time: 'Ahora mismo' },
    ])
  }, [])

  const setTyping = useCallback((v: boolean) => setIsTyping(v), [])

  const setProcessing = useCallback((text: string | false) => {
    if (text === false) {
      setIsProcessing(false)
    } else {
      setIsProcessing(true)
      setProcessingText(text)
    }
  }, [])

  const addFile = useCallback((name: string) => setAttachedFiles(prev => [...prev, name]), [])
  const removeFile = useCallback((i: number) => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i)), [])
  const clearFiles = useCallback(() => setAttachedFiles([]), [])

  const initMessages = useCallback((msgs: (AgentMessage | { text: string; time: string })[]) => {
    setMessages(msgs.map((m, i) => {
      if ('html' in m) return m as AgentMessage
      return { id: `init${i}`, role: 'agent' as const, html: (m as { text: string; time: string }).text, time: m.time }
    }))
  }, [])

  return (
    <AgentContext.Provider value={{
      messages, isTyping, isProcessing, processingText, attachedFiles,
      addMessage, setTyping, setProcessing, addFile, removeFile, clearFiles, initMessages,
    }}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgentContext() {
  const ctx = useContext(AgentContext)
  if (!ctx) throw new Error('useAgentContext must be used inside AgentProvider')
  return ctx
}
