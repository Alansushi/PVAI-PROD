export type AgentPromptType =
  | 'riesgos' | 'avance' | 'tiempo'
  | 'siguiente_entrega' | 'estado_paquetes'
  | 'equipo' | 'sin_asignar'
  | 'velocidad' | 'prediccion' | 'bloqueados' | 'resumen_ejecutivo'

export interface AgentPrompt {
  id: AgentPromptType
  label: string
  prompt: string
  category: 'analisis' | 'paquetes' | 'equipo'
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
  // Paquetes
  {
    id: 'siguiente_entrega',
    label: '¿Cuál es la siguiente entrega?',
    prompt: 'Revisa los paquetes del proyecto y dime cuál es el próximo milestone de pre-entrega o entrega final. ¿Estamos preparados para llegar a esa fecha?',
    category: 'paquetes',
    icon: '📦',
  },
  {
    id: 'estado_paquetes',
    label: 'Estado de los paquetes',
    prompt: 'Haz un resumen del estado actual de cada paquete de entregables: cuántos están completados, cuántos en proceso y cuántos en riesgo. ¿Alguno tiene entregas próximas con tareas sin terminar?',
    category: 'paquetes',
    icon: '🗂',
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
  // Análisis avanzado
  {
    id: 'velocidad',
    label: '¿A qué velocidad vamos?',
    prompt: 'Analiza cuántos entregables se completaron esta semana vs la semana pasada. ¿El equipo está acelerando o desacelerando? Da una conclusión concreta.',
    category: 'analisis',
    icon: '⚡',
  },
  {
    id: 'prediccion',
    label: '¿Cuándo terminaremos?',
    prompt: 'Con base en la velocidad actual de avance y los entregables pendientes, proyecta cuándo se terminará el proyecto. ¿Llegamos al deadline?',
    category: 'analisis',
    icon: '🔮',
  },
  {
    id: 'bloqueados',
    label: '¿Qué está bloqueado?',
    prompt: 'Lista todos los entregables en warn o danger con fecha de vencimiento en los próximos 7 días. ¿Qué está detenido y por qué?',
    category: 'analisis',
    icon: '🚧',
  },
  {
    id: 'resumen_ejecutivo',
    label: 'Resumen para cliente',
    prompt: 'Escribe un párrafo ejecutivo del estado actual del proyecto, apto para enviar a un cliente. Tono profesional, sin jerga técnica. Incluye: avance general, logros recientes, próximos hitos y cualquier riesgo importante.',
    category: 'analisis',
    icon: '📋',
  },
]

export const PROMPT_CATEGORIES: Record<AgentPrompt['category'], string> = {
  analisis: 'Análisis',
  paquetes: 'Paquetes',
  equipo: 'Equipo',
}

// Minuta processing types
export type MinutaAction =
  | { type: 'update';   id: string; name: string; changes: { status?: string; priority?: string; dueDate?: string }; reason: string; _invalid?: boolean; _reason?: string }
  | { type: 'note';     id: string; name: string; note: string; _invalid?: boolean; _reason?: string }
  | { type: 'create';   name: string; status: string; priority: string; ownerName?: string; dueDate?: string; startDate?: string }
  | { type: 'reassign'; id: string; name: string; ownerName: string; reason: string; _invalid?: boolean; _reason?: string }

export interface MinutaPlan {
  summary: string
  actions: MinutaAction[]
}
