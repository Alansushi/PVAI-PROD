'use client'

import { useCallback } from 'react'
import { useAgentContext } from '@/lib/context/AgentContext'
import { AgentPrompt, MinutaPlan } from '@/lib/agent-prompts'
import type { AgentCardAction } from '@/lib/types'

export function useAgent(projectId: string) {
  const { addCard, initCards, setTyping, setProcessing, dismissCard, updateCardUndone } = useAgentContext()

  const askAgent = useCallback(async (agentPrompt: AgentPrompt, view?: string) => {
    const prompt = agentPrompt.prompt
    addCard(`<strong>Tú:</strong> ${agentPrompt.label}`, 'user')
    setTyping(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: prompt, type: agentPrompt.id, view }),
      })
      const data = await res.json()
      addCard(
        data.html ?? '<span class="warn">Sin respuesta del agente.</span>',
        'agent',
        data.cardType ?? 'insight'
      )
    } catch {
      addCard('<span class="danger">Error al conectar con el agente.</span>')
    } finally {
      setTyping(false)
    }
  }, [projectId, addCard, setTyping])

  const sendFree = useCallback(async (text: string, files: string[], view?: string) => {
    let msgHtml = `<strong>Tú:</strong> ${text || '(archivo adjunto)'}`
    if (files.length > 0) {
      msgHtml += `<div style="margin-top:4px;">${files.map(f => `<div class="msg-file">📎 ${f}</div>`).join('')}</div>`
    }
    addCard(msgHtml, 'user')
    setTyping(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: text || '(archivo adjunto)', type: 'free', view }),
      })
      const data = await res.json()
      addCard(
        data.html ?? '<span class="warn">Sin respuesta del agente.</span>',
        'agent',
        data.cardType ?? 'insight'
      )
    } catch {
      addCard('<span class="danger">Error al conectar con el agente.</span>')
    } finally {
      setTyping(false)
    }
  }, [projectId, addCard, setTyping])

  const generateDoc = useCallback(() => {
    setProcessing('Leyendo planos y cuadro de áreas...')
    setTimeout(() => {
      setProcessing('Generando memoria descriptiva...')
      setTimeout(() => {
        setProcessing(false)
        addCard('<strong>📄 Memoria descriptiva generada:</strong> Lista para revisión. <span class="warn">2 secciones desactualizadas por cambios de minuta</span> — revísalas antes de firmar.')
      }, 1800)
    }, 1000)
  }, [setProcessing, addCard])

  const processMinuta = useCallback(async (text: string, onDone: (plan?: MinutaPlan) => void) => {
    setProcessing('Analizando acuerdos...')
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: text, type: 'minuta' }),
      })
      const data = await res.json()
      setProcessing(false)
      const plan = data.plan as MinutaPlan | undefined
      if (plan?.summary) {
        addCard(`<strong>✦ Minuta analizada:</strong> ${plan.summary}`)
      }
      onDone(plan)
    } catch {
      setProcessing(false)
      addCard('<span class="danger">Error al procesar la minuta.</span>')
      onDone()
    }
  }, [projectId, setProcessing, addCard])

  const refreshHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/agent-messages`)
      if (!res.ok) return
      const data = await res.json()
      if (!data?.messages?.length) return
      initCards(data.messages)
    } catch {}
  }, [projectId, initCards])

  const executeCardAction = useCallback(async (
    action: AgentCardAction,
    cardId?: string,
    isDbCard?: boolean
  ): Promise<boolean> => {
    const payload = action.payload as Record<string, unknown> | undefined
    if (!payload) return true

    try {
      let beforeState: Record<string, unknown> | null = null
      let success = false
      let createdId: string | null = null

      if (action.actionType === 'update' || action.actionType === 'reassign') {
        const deliverableId = payload.id as string
        if (!deliverableId) return false

        // Capture before state for undo
        if (isDbCard && cardId) {
          const current = await fetch(`/api/projects/${projectId}/deliverables/${deliverableId}`)
          if (current.ok) {
            const d = await current.json()
            const del = d.deliverable ?? d
            beforeState = {
              status: del.status,
              dueDate: del.dueDate,
              priority: del.priority,
              ownerName: del.ownerName,
            }
          }
        }

        const body: Record<string, unknown> = {}
        const changes = payload.changes as Record<string, unknown> | undefined
        if (changes?.status) body.status = changes.status
        if (changes?.dueDate) body.dueDate = changes.dueDate
        if (payload.ownerName) body.ownerName = payload.ownerName

        const res = await fetch(`/api/projects/${projectId}/deliverables/${deliverableId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        success = res.ok
      } else if (action.actionType === 'create') {
        const res = await fetch(`/api/projects/${projectId}/deliverables`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: payload.name,
            status: payload.status ?? 'warn',
            priority: payload.priority ?? 'media',
            ownerName: payload.ownerName,
            dueDate: payload.dueDate,
          }),
        })
        success = res.ok
        if (res.ok) {
          const data = await res.json()
          createdId = data.deliverable?.id ?? data.id ?? null
          if (createdId) beforeState = { createdId }
        }
      } else {
        // 'note', 'navigate', 'dismiss' — no mutation
        return true
      }

      // Persist beforeState to DB for undo (only for DB-backed cards)
      if (success && isDbCard && cardId) {
        fetch(`/api/projects/${projectId}/agent-messages`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: cardId, executed: true, beforeState }),
        }).catch(() => {})
      }

      return success
    } catch {
      return false
    }
  }, [projectId])

  const undoCardAction = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/projects/${projectId}/agent-messages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, action: 'undo' }),
      })
      if (res.ok) {
        updateCardUndone(messageId)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [projectId, updateCardUndone])

  const dismissCardServer = useCallback(async (cardId: string) => {
    dismissCard(cardId)
    fetch(`/api/projects/${projectId}/agent-messages`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: cardId, dismissed: true }),
    }).catch(() => {})
  }, [projectId, dismissCard])

  return { askAgent, sendFree, generateDoc, processMinuta, refreshHistory, executeCardAction, undoCardAction, dismissCardServer }
}
