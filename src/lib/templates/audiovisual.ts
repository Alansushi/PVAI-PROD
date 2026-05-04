import type { ProjectTemplate } from '@/lib/types'

const audiovisual: ProjectTemplate = {
  id: 'audiovisual',
  label: 'Audiovisual',
  description: 'Producción de video: desde guión hasta entrega final.',
  icon: '🎬',
  projectType: 'Proyecto ejecutivo',
  estimatedDuration: 30,
  defaultRoles: [
    { label: 'Director', required: true },
    { label: 'Editor', required: true },
    { label: 'Director de Fotografía', required: false },
  ],
  defaultMilestones: [
    { label: 'Rough cut aprobado', daysOffset: 22 },
    { label: 'Entrega final', daysOffset: 30 },
  ],
  defaultDeliverables: [
    { title: 'Brief creativo y concepto', daysOffset: 3, phase: 'Preproducción' },
    { title: 'Guión y storyboard', daysOffset: 8, phase: 'Preproducción' },
    { title: 'Producción y rodaje', daysOffset: 18, phase: 'Producción' },
    { title: 'Edición y montaje', daysOffset: 22, phase: 'Postproducción' },
    { title: 'Corrección de color y audio', daysOffset: 26, phase: 'Postproducción' },
    { title: 'Revisión con cliente', daysOffset: 28, phase: 'Revisión' },
    { title: 'Entrega final (master + formatos)', daysOffset: 30, phase: 'Entrega' },
  ],
  defaultSLAs: [
    { label: 'Revisión de rough cut', days: 3 },
    { label: 'Aprobación de entrega final', days: 2 },
  ],
}

export default audiovisual
