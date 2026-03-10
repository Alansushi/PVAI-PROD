'use client'

import { useCallback } from 'react'
import { useAgentContext } from '@/lib/context/AgentContext'
import { useProjectContext } from '@/lib/context/ProjectContext'
import { AGENT_RESPONSES } from '@/lib/data/agent-responses'
import type { Deliverable } from '@/lib/types'

export function useAgent(projectId: string) {
  const { addMessage, setTyping, setProcessing } = useAgentContext()
  const { addDeliverable, getProject } = useProjectContext()

  const addTaskFromAgent = useCallback((name: string, status: Deliverable['status']) => {
    const project = getProject(projectId)
    const owner = project?.members[0] ?? 'jorge'
    addDeliverable(projectId, {
      id: `t${Date.now()}`,
      status,
      name,
      meta: 'minuta',
      owner,
      priority: 'media',
      startDate: '',
      dueDate: '',
      notes: 'Detectado en instrucción manual.',
    })
  }, [projectId, getProject, addDeliverable])

  const askAgent = useCallback((type: 'riesgos' | 'cobro' | 'tiempo') => {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      addMessage(AGENT_RESPONSES[type]?.[projectId] ?? 'Procesando...')
    }, 1400)
  }, [projectId, setTyping, addMessage])

  const sendFree = useCallback((text: string, files: string[]) => {
    let msgHtml = `<strong>Tú:</strong> ${text || '(archivo adjunto)'}`
    if (files.length > 0) {
      msgHtml += `<div style="margin-top:4px;">${files.map(f => `<div class="msg-file">📎 ${f}</div>`).join('')}</div>`
    }
    addMessage(msgHtml, 'user')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      const lower = text.toLowerCase()
      let resp: string
      if (lower.includes('fachada') || lower.includes('acabado')) {
        resp = '<strong>✦ Cambio registrado:</strong> Cliente aprobó cambio en fachada. <span class="nl">Agregué 1 pendiente</span>: actualizar especificaciones de fachada.'
        addTaskFromAgent('Actualización especificaciones de fachada', 'warn')
      } else if (lower.includes('aprobó') || lower.includes('autorizó')) {
        resp = '<strong>✦ Aprobación registrada:</strong> Marcando entregables relacionados.'
      } else if (lower.includes('cobr') || lower.includes('exhibición')) {
        resp = AGENT_RESPONSES.cobro[projectId] ?? 'Procesando...'
      } else {
        const project = getProject(projectId)
        resp = `<strong>Instrucción recibida:</strong> Registré en <span class="nl">${project?.title ?? projectId}</span>. Si hay acuerdos específicos, dímelos.`
      }
      addMessage(resp)
    }, 1800)
  }, [projectId, addMessage, setTyping, addTaskFromAgent, getProject])

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

  const processMinuta = useCallback((text: string, onDone: () => void) => {
    setProcessing('Analizando acuerdos...')
    setTimeout(() => {
      setProcessing('Identificando entregables afectados...')
      setTimeout(() => {
        setProcessing('Actualizando pendientes...')
        setTimeout(() => {
          setProcessing(false)
          const hasCocina = text.toLowerCase().includes('cocina')
          const hasBano = text.toLowerCase().includes('baño')
          let count = 0
          if (hasCocina) { addTaskFromAgent('Actualización planos cocina', 'warn'); count++ }
          if (hasBano)   { addTaskFromAgent('Plano de baño adicional', 'warn'); count++ }
          if (!hasCocina && !hasBano) { addTaskFromAgent('Pendiente detectado en minuta', 'warn'); count++ }
          addMessage(`<strong>✦ Minuta procesada:</strong> Encontré <span class="nl">${count + 1} acuerdo(s)</span>. Agregué ${count + 1} pendiente(s).`)
          onDone()
        }, 900)
      }, 900)
    }, 900)
  }, [setProcessing, addTaskFromAgent, addMessage])

  return { askAgent, sendFree, generateDoc, processMinuta }
}
