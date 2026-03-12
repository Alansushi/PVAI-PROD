export type AgentPromptType =
  | 'riesgos' | 'avance' | 'tiempo'
  | 'cobro' | 'pagos'
  | 'equipo' | 'sin_asignar'

export interface AgentPrompt {
  id: AgentPromptType
  label: string
  prompt: string
  category: 'analisis' | 'cobro' | 'equipo'
  icon: string
}

export const AGENT_PROMPTS: AgentPrompt[] = [
  // Análisis
  {
    id: 'riesgos',
    label: '¿Qué riesgos hay esta semana?',
    prompt: '¿Qué entregables están en riesgo esta semana y cuáles son los principales cuellos de botella?',
    category: 'analisis',
    icon: '⚠',
  },
  {
    id: 'avance',
    label: '¿Cuál es el avance general?',
    prompt: 'Dame un resumen del avance general del proyecto: % completado, entregables pendientes y próximas fechas críticas.',
    category: 'analisis',
    icon: '📊',
  },
  {
    id: 'tiempo',
    label: '¿Estamos en tiempo?',
    prompt: '¿Vamos a llegar al deadline? Analiza el ritmo actual de avance y da una recomendación concreta.',
    category: 'analisis',
    icon: '📅',
  },
  // Cobros
  {
    id: 'cobro',
    label: '¿Qué falta para cobrar?',
    prompt: '¿Qué entregables o condiciones faltan para liberar el próximo cobro? Lista lo pendiente de forma accionable.',
    category: 'cobro',
    icon: '💰',
  },
  {
    id: 'pagos',
    label: 'Estado de pagos',
    prompt: 'Resume el estado de los cobros del proyecto: monto esperado, estatus y si hay algún riesgo de retraso.',
    category: 'cobro',
    icon: '🧾',
  },
  // Equipo
  {
    id: 'equipo',
    label: '¿Quién tiene más carga?',
    prompt: '¿Qué miembro del equipo tiene más entregables asignados? ¿Hay alguien sobrecargado o subutilizado?',
    category: 'equipo',
    icon: '👥',
  },
  {
    id: 'sin_asignar',
    label: 'Entregables sin responsable',
    prompt: 'Lista todos los entregables que no tienen un responsable asignado.',
    category: 'equipo',
    icon: '🔍',
  },
]

export const PROMPT_CATEGORIES: Record<AgentPrompt['category'], string> = {
  analisis: 'Análisis',
  cobro: 'Cobros',
  equipo: 'Equipo',
}

// Minuta processing types
export type MinutaAction =
  | { type: 'update'; id: string; name: string; changes: { status?: string; priority?: string; dueDate?: string }; reason: string }
  | { type: 'note';   id: string; name: string; note: string }
  | { type: 'create'; name: string; status: string; priority: string; ownerName?: string; dueDate?: string; startDate?: string }

export interface MinutaPlan {
  summary: string
  actions: MinutaAction[]
}
