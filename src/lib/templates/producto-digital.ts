import type { ProjectTemplate } from '@/lib/types'

const productoDigital: ProjectTemplate = {
  id: 'producto-digital',
  label: 'Producto Digital',
  description: 'App o plataforma digital desde research hasta lanzamiento.',
  icon: '📱',
  projectType: 'Proyecto ejecutivo',
  estimatedDuration: 90,
  defaultRoles: [
    { label: 'Product Manager', required: true },
    { label: 'Diseñador UX/UI', required: true },
    { label: 'Desarrollador Frontend', required: true },
    { label: 'Desarrollador Backend', required: false },
  ],
  defaultMilestones: [
    { label: 'Wireframes y flujos aprobados', daysOffset: 30 },
    { label: 'MVP listo para testing', daysOffset: 60 },
    { label: 'Lanzamiento oficial', daysOffset: 90 },
  ],
  defaultDeliverables: [
    { title: 'Research y análisis de usuario', daysOffset: 10, phase: 'Discovery' },
    { title: 'Arquitectura y flujos UX', daysOffset: 20, phase: 'UX' },
    { title: 'Wireframes interactivos', daysOffset: 30, phase: 'UX' },
    { title: 'Diseño UI (sistema de diseño)', daysOffset: 42, phase: 'UI' },
    { title: 'Sprint 1 — Funcionalidades core', daysOffset: 60, phase: 'Desarrollo' },
    { title: 'Sprint 2 — Funcionalidades adicionales', daysOffset: 75, phase: 'Desarrollo' },
    { title: 'QA y testing con usuarios', daysOffset: 82, phase: 'Pruebas' },
    { title: 'Lanzamiento beta', daysOffset: 87, phase: 'Lanzamiento' },
    { title: 'Lanzamiento oficial', daysOffset: 90, phase: 'Lanzamiento' },
  ],
  defaultSLAs: [
    { label: 'Revisión de sprint', days: 3 },
    { label: 'Aprobación de diseño', days: 5 },
    { label: 'Sign-off de funcionalidades', days: 7 },
  ],
}

export default productoDigital
