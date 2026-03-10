import type { Member } from '@/lib/types'

export const ALL_MEMBERS: Record<string, Member> = {
  jorge:   { id: 'jorge',   name: 'Jorge Villanueva', initials: 'JV', color: '#2E8FC0', role: 'Arquitecto Senior',        tasks: 4, done: 3, active: ['Planta arquitectónica PB', 'Ampliación cocina'] },
  sofia:   { id: 'sofia',   name: 'Sofía Méndez',     initials: 'SM', color: '#2A9B6F', role: 'Arquitecta',               tasks: 3, done: 1, active: ['Plano hidráulico', 'Medio baño PB'] },
  carlos:  { id: 'carlos',  name: 'Carlos Ibáñez',    initials: 'CI', color: '#7C5CBF', role: 'Diseñador / Visualización', tasks: 2, done: 1, active: ['Planos eléctricos'] },
  maria:   { id: 'maria',   name: 'María Torres',     initials: 'MT', color: '#E09B3D', role: 'Arquitecta Jr.',            tasks: 2, done: 2, active: ['Planta de conjunto', 'Programa arq.'] },
  ramirez: { id: 'ramirez', name: 'Arq. Luis Ramírez', initials: 'LR', color: '#1DA6A0', role: 'Director del despacho',   tasks: 2, done: 1, active: ['Bitácora de obra', 'Acta de entrega'] },
  ext:     { id: 'ext',     name: 'Ext. Estructural', initials: 'ES', color: '#D94F4F', role: 'Corresponsable Externo',   tasks: 1, done: 0, active: ['Memoria de cálculo estructural'] },
}
