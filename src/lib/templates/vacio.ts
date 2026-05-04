import type { ProjectTemplate } from '@/lib/types'

const vacio: ProjectTemplate = {
  id: 'vacio',
  label: 'Proyecto en blanco',
  description: 'Sin tareas iniciales. Configura todo manualmente.',
  icon: '📋',
  projectType: 'Proyecto ejecutivo',
  estimatedDuration: 0,
  defaultRoles: [],
  defaultMilestones: [],
  defaultDeliverables: [],
}

export default vacio
