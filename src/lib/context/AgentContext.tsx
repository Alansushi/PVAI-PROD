'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { AgentCard, AgentCardType, AgentCardAction } from '@/lib/types'

interface AgentContextValue {
  cards: AgentCard[]
  isTyping: boolean
  isProcessing: boolean
  processingText: string
  attachedFiles: string[]
  addCard: (html: string, role?: 'agent' | 'user', cardType?: AgentCardType, actions?: AgentCardAction[]) => void
  dismissCard: (id: string) => void
  updateCardUndone: (id: string) => void
  setTyping: (v: boolean) => void
  setProcessing: (text: string | false) => void
  addFile: (name: string) => void
  removeFile: (i: number) => void
  clearFiles: () => void
  initCards: (msgs: Array<{
    id: string
    role: string
    content: string
    createdAt: string
    cardType?: string | null
    actions?: unknown
    dismissed?: boolean
    executed?: boolean
    undone?: boolean
  }>) => void
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  lastRefreshed: Date | null
  setLastRefreshed: (d: Date) => void
  agentStatus: 'idle' | 'thinking' | 'stale'
  setAgentStatus: (s: 'idle' | 'thinking' | 'stale') => void
}

const AgentContext = createContext<AgentContextValue | null>(null)

export function AgentProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<AgentCard[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingText, setProcessingText] = useState('Procesando...')
  const [attachedFiles, setAttachedFiles] = useState<string[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [agentStatus, setAgentStatusState] = useState<'idle' | 'thinking' | 'stale'>('idle')

  const addCard = useCallback((
    html: string,
    role: 'agent' | 'user' = 'agent',
    cardType: AgentCardType = 'insight',
    actions?: AgentCardAction[]
  ) => {
    setCards(prev => [...prev, {
      id: `c${Date.now()}${Math.random()}`,
      role,
      html,
      timestamp: new Date(),
      cardType,
      actions,
      dismissed: false,
    }])
  }, [])

  const dismissCard = useCallback((id: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, dismissed: true } : c))
  }, [])

  const updateCardUndone = useCallback((id: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, undone: true } : c))
  }, [])

  const setTyping = useCallback((v: boolean) => {
    setIsTyping(v)
    setAgentStatusState(v ? 'thinking' : 'idle')
  }, [])

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

  const initCards = useCallback((msgs: Array<{
    id: string
    role: string
    content: string
    createdAt: string
    cardType?: string | null
    actions?: unknown
    dismissed?: boolean
    executed?: boolean
    undone?: boolean
  }>) => {
    setCards(msgs.map(m => ({
      id: m.id,
      role: m.role as 'agent' | 'user',
      html: m.content,
      timestamp: new Date(m.createdAt),
      cardType: (m.cardType as AgentCardType) ?? 'insight',
      actions: Array.isArray(m.actions) ? (m.actions as AgentCardAction[]) : undefined,
      dismissed: m.dismissed ?? false,
      isDbCard: true,
      undone: m.undone ?? false,
    })))
  }, [])

  const setAgentStatus = useCallback((s: 'idle' | 'thinking' | 'stale') => {
    setAgentStatusState(s)
  }, [])

  return (
    <AgentContext.Provider value={{
      cards, isTyping, isProcessing, processingText, attachedFiles,
      addCard, dismissCard, updateCardUndone, setTyping, setProcessing,
      addFile, removeFile, clearFiles, initCards,
      collapsed, setCollapsed,
      lastRefreshed, setLastRefreshed,
      agentStatus, setAgentStatus,
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
