import type { ProjectTemplate } from '@/lib/types'

const sitioWeb: ProjectTemplate = {
  id: 'sitio-web',
  label: 'Sitio Web',
  description: 'Sitio corporativo completo: diseño, desarrollo y lanzamiento.',
  icon: '🌐',
  projectType: 'Proyecto ejecutivo',
  estimatedDuration: 60,
  defaultRoles: [
    { label: 'Diseñador UX/UI', required: true },
    { label: 'Desarrollador Frontend', required: true },
    { label: 'Project Manager', required: false },
  ],
  defaultMilestones: [
    { label: 'Entrega de wireframes', daysOffset: 15 },
    { label: 'Aprobación de diseño', daysOffset: 30 },
    { label: 'Go-live', daysOffset: 60 },
  ],
  defaultDeliverables: [
    { title: 'Brief y definición de alcance', daysOffset: 3, phase: 'Inicio' },
    { title: 'Arquitectura de información', daysOffset: 10, phase: 'Diseño' },
    { title: 'Wireframes navegables', daysOffset: 15, phase: 'Diseño' },
    { title: 'Diseño UI completo', daysOffset: 28, phase: 'Diseño' },
    { title: 'Desarrollo frontend', daysOffset: 42, phase: 'Desarrollo' },
    { title: 'Integración y CMS', daysOffset: 50, phase: 'Desarrollo' },
    { title: 'QA y pruebas de usuario', daysOffset: 55, phase: 'Pruebas' },
    { title: 'Lanzamiento y handoff', daysOffset: 60, phase: 'Entrega' },
  ],
  defaultSLAs: [
    { label: 'Revisión de entregables', days: 3 },
    { label: 'Aprobación final', days: 5 },
  ],
}

export default sitioWeb
