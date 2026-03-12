'use client'

import { useCallback } from 'react'
import { useAgentContext } from '@/lib/context/AgentContext'
import { AgentPrompt, MinutaPlan } from '@/lib/agent-prompts'

export function useAgent(projectId: string) {
  const { addMessage, setTyping, setProcessing } = useAgentContext()

  const askAgent = useCallback(async (agentPrompt: AgentPrompt) => {
    const prompt = agentPrompt.prompt
    addMessage(`<strong>Tú:</strong> ${agentPrompt.label}`, 'user')
    setTyping(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: prompt, type: agentPrompt.id }),
      })
      const data = await res.json()
      addMessage(data.html ?? '<span class="warn">Sin respuesta del agente.</span>')
    } catch {
      addMessage('<span class="danger">Error al conectar con el agente.</span>')
    } finally {
      setTyping(false)
    }
  }, [projectId, addMessage, setTyping])

  const sendFree = useCallback(async (text: string, files: string[]) => {
    let msgHtml = `<strong>Tú:</strong> ${text || '(archivo adjunto)'}`
    if (files.length > 0) {
      msgHtml += `<div style="margin-top:4px;">${files.map(f => `<div class="msg-file">📎 ${f}</div>`).join('')}</div>`
    }
    addMessage(msgHtml, 'user')
    setTyping(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: text || '(archivo adjunto)', type: 'free' }),
      })
      const data = await res.json()
      addMessage(data.html ?? '<span class="warn">Sin respuesta del agente.</span>')
    } catch {
      addMessage('<span class="danger">Error al conectar con el agente.</span>')
    } finally {
      setTyping(false)
    }
  }, [projectId, addMessage, setTyping])

  const generateDoc = useCallback(() => {
    setProcessing('Leyendo planos y cuadro de áreas...')
    setTimeout(() => {
      setProcessing('Generando memoria descriptiva...')
      setTimeout(() => {
        setProcessing(false)
        addMessage('<strong>📄 Memoria descriptiva generada:</strong> Lista para revisión. <span class="warn">2 secciones desactualizadas por cambios de minuta</span> — revísalas antes de firmar.')
      }, 1800)
    }, 1000)
  }, [setProcessing, addMessage])

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
        addMessage(`<strong>✦ Minuta analizada:</strong> ${plan.summary}`)
      }
      onDone(plan)
    } catch {
      setProcessing(false)
      addMessage('<span class="danger">Error al procesar la minuta.</span>')
      onDone()
    }
  }, [projectId, setProcessing, addMessage])

  return { askAgent, sendFree, generateDoc, processMinuta }
}
