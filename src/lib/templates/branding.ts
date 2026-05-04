import type { ProjectTemplate } from '@/lib/types'

const branding: ProjectTemplate = {
  id: 'branding',
  label: 'Branding',
  description: 'Identidad visual completa: concepto, manual de marca y entregables.',
  icon: '🎨',
  projectType: 'Proyecto ejecutivo',
  estimatedDuration: 45,
  defaultRoles: [
    { label: 'Director Creativo', required: true },
    { label: 'Diseñador Gráfico', required: true },
    { label: 'Estratega de Marca', required: false },
  ],
  defaultMilestones: [
    { label: 'Presentación de concepto', daysOffset: 18 },
    { label: 'Propuesta visual aprobada', daysOffset: 30 },
    { label: 'Entrega de manual', daysOffset: 45 },
  ],
  defaultDeliverables: [
    { title: 'Diagnóstico y briefing de marca', daysOffset: 5, phase: 'Descubrimiento' },
    { title: 'Investigación de referentes y competencia', daysOffset: 12, phase: 'Descubrimiento' },
    { title: 'Concepto creativo (3 direcciones)', daysOffset: 18, phase: 'Concepto' },
    { title: 'Propuesta visual seleccionada', daysOffset: 25, phase: 'Diseño' },
    { title: 'Ajustes y refinamiento', daysOffset: 35, phase: 'Diseño' },
    { title: 'Manual de marca', daysOffset: 42, phase: 'Entrega' },
    { title: 'Entregables finales (logos, variantes, recursos)', daysOffset: 45, phase: 'Entrega' },
  ],
  defaultSLAs: [
    { label: 'Revisión de propuestas', days: 4 },
    { label: 'Aprobación de concepto', days: 5 },
  ],
}

export default branding
