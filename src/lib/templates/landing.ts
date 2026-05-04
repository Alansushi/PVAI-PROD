import type { ProjectTemplate } from '@/lib/types'

const landing: ProjectTemplate = {
  id: 'landing',
  label: 'Landing Page',
  description: 'Página de aterrizaje para campaña o lanzamiento de producto.',
  icon: '🚀',
  projectType: 'Proyecto ejecutivo',
  estimatedDuration: 21,
  defaultRoles: [
    { label: 'Diseñador', required: true },
    { label: 'Desarrollador', required: true },
    { label: 'Copywriter', required: false },
  ],
  defaultMilestones: [
    { label: 'Aprobación de diseño', daysOffset: 12 },
    { label: 'Go-live', daysOffset: 21 },
  ],
  defaultDeliverables: [
    { title: 'Brief y concepto creativo', daysOffset: 3, phase: 'Inicio' },
    { title: 'Copywriting y estructura de contenido', daysOffset: 7, phase: 'Contenido' },
    { title: 'Diseño visual', daysOffset: 12, phase: 'Diseño' },
    { title: 'Desarrollo y responsive', daysOffset: 17, phase: 'Desarrollo' },
    { title: 'QA y optimización de velocidad', daysOffset: 19, phase: 'Pruebas' },
    { title: 'Lanzamiento y seguimiento', daysOffset: 21, phase: 'Entrega' },
  ],
  defaultSLAs: [
    { label: 'Revisión de contenido', days: 2 },
    { label: 'Aprobación de diseño', days: 3 },
  ],
}

export default landing
