import type { Project } from '@/lib/types'

const PROJECTS_MAP: Record<string, Project> = {
  pedregal: {
    id: 'pedregal',
    title: 'Casa Pedregal',
    sub: 'Proyecto ejecutivo · Actualizado hace 2 min',
    dotStatus: 'warn',
    type: 'Proyecto ejecutivo',
    kpis: {
      k1v: '$45K', k1s: '2ª exhibición · 3 pendientes', k1p: '⏳ 3 pendientes',
      k2v: '2', k3v: '65%', k3s: '12 de 18 entregables', k3p: '📐 Proyecto ejecutivo',
      k4v: '4', k4s: 'desde la última minuta',
    },
    members: ['jorge', 'sofia', 'ext'],
    ganttTitle: 'Casa Pedregal · Cronograma',
    ganttRange: 'Mar — Abr 2026',
    deadline: { pct: 76, label: 'Entrega 25 mar' },
    gantt: [
      { label: 'Planta arq. PB',      owner: 'J. Villanueva', start: 0,  dur: 8,  status: 'ok' },
      { label: 'Plano hidráulico',     owner: 'S. Méndez',     start: 5,  dur: 14, status: 'prog' },
      { label: 'Ampliación cocina',    owner: 'J. Villanueva', start: 9,  dur: 7,  status: 'warn' },
      { label: 'Medio baño PB',        owner: 'S. Méndez',     start: 9,  dur: 10, status: 'warn' },
      { label: 'Cálculo estructural',  owner: 'Ext. Estr.',    start: 3,  dur: 15, status: 'danger' },
      { label: 'Especificaciones',     owner: 'Agente IA',     start: 0,  dur: 7,  status: 'ok' },
      { label: 'Planos eléctricos',    owner: 'C. Ibáñez',     start: 12, dur: 12, status: 'prog' },
    ],
    delTitle: 'Casa Pedregal · Pendientes',
    delCount: '12 de 18 · ✦ 4 del agente',
    deliverables: [
      { id: 'd1', status: 'ok',     name: 'Planta arquitectónica PB',       meta: 'v3',     owner: 'jorge',   dueDate: '2026-03-09', startDate: '2026-02-20', priority: 'media', notes: 'Aprobada por cliente en reunión del 9 mar.' },
      { id: 'd2', status: 'warn',   name: 'Plano hidráulico y sanitario',   meta: 'v1',     owner: 'sofia',   dueDate: '2026-03-14', startDate: '2026-03-05', priority: 'alta',  notes: 'En proceso. Coordinar con especialista.' },
      { id: 'd3', status: 'warn',   name: 'Ampliación cocina a 14m²',       meta: 'minuta', owner: 'jorge',   dueDate: '2026-03-16', startDate: '2026-03-09', priority: 'alta',  notes: 'Cambio solicitado por cliente en reunión 9 mar.' },
      { id: 'd4', status: 'warn',   name: 'Medio baño en PB',               meta: 'minuta', owner: 'sofia',   dueDate: '2026-03-19', startDate: '2026-03-09', priority: 'media', notes: 'Decisión cliente. Requiere ajustar plano de instalaciones.' },
      { id: 'd5', status: 'danger', name: 'Memoria de cálculo estructural', meta: '',        owner: 'ext',     dueDate: '2026-03-18', startDate: '2026-03-03', priority: 'alta',  notes: '6 días sin avance. Riesgo crítico de cobro.' },
      { id: 'd6', status: 'ok',     name: 'Especificaciones técnicas',      meta: 'agente', owner: 'jorge',   dueDate: '2026-03-07', startDate: '2026-03-01', priority: 'baja',  notes: 'Generado por el agente v2. Aprobado.' },
      { id: 'd7', status: 'warn',   name: 'Planos eléctricos',              meta: '',        owner: 'carlos',  dueDate: '2026-03-21', startDate: '2026-03-12', priority: 'media', notes: 'Pendiente de inicio.' },
    ],
    agentMsgs: [
      { text: '<strong>Minuta 9 mar procesada:</strong> Encontré <span class="nl">2 cambios de alcance</span> y <span class="nl">1 fecha comprometida</span>. Agregué 4 pendientes.', time: 'Hace 2 min' },
      { text: '<strong>Riesgo de cobro:</strong> La 2ª exhibición de <span class="warn">$45,000</span> depende de la memoria estructural. El externo lleva <span class="err">6 días sin avance</span>.', time: 'Hace 2 min' },
      { text: '<strong>Fecha límite:</strong> Planos estructurales deben estar antes del 18 mar. <span class="err">Hoy es el último día</span> para confirmar con el externo.', time: 'Hace 3 min' },
    ],
  },
  polanco: {
    id: 'polanco',
    title: 'Oficinas Polanco',
    sub: 'Anteproyecto · Al corriente',
    dotStatus: 'ok',
    type: 'Anteproyecto',
    kpis: {
      k1v: '$28K', k1s: '1ª exhibición · 1 pendiente', k1p: '⏳ 1 pendiente',
      k2v: '0', k3v: '40%', k3s: '6 de 15 entregables', k3p: '🏢 Anteproyecto',
      k4v: '1', k4s: 'desde instrucción del socio',
    },
    members: ['maria', 'carlos'],
    ganttTitle: 'Oficinas Polanco · Cronograma',
    ganttRange: 'Mar — Abr 2026',
    deadline: { pct: 90, label: 'Entrega 10 abr' },
    gantt: [
      { label: 'Planta de conjunto', owner: 'M. Torres',  start: 0,  dur: 5,  status: 'ok' },
      { label: 'Programa arq.',      owner: 'C. Ibáñez',  start: 0,  dur: 3,  status: 'ok' },
      { label: 'Planta arq. N1',     owner: 'M. Torres',  start: 5,  dur: 15, status: 'prog' },
      { label: 'Planta arq. N2',     owner: 'M. Torres',  start: 15, dur: 10, status: 'warn' },
      { label: 'Render fachada',     owner: 'C. Ibáñez',  start: 18, dur: 10, status: 'warn' },
    ],
    delTitle: 'Oficinas Polanco · Pendientes',
    delCount: '6 de 15 · Al corriente',
    deliverables: [
      { id: 'p1', status: 'ok',   name: 'Planta de conjunto',        meta: 'v2', owner: 'maria',  dueDate: '2026-03-05', startDate: '2026-02-28', priority: 'media', notes: 'Aprobada.' },
      { id: 'p2', status: 'ok',   name: 'Programa arquitectónico',   meta: 'v1', owner: 'carlos', dueDate: '2026-03-03', startDate: '2026-02-28', priority: 'baja',  notes: 'Entregado y revisado.' },
      { id: 'p3', status: 'warn', name: 'Planta arquitectónica N1',  meta: 'v1', owner: 'maria',  dueDate: '2026-03-20', startDate: '2026-03-05', priority: 'alta',  notes: 'En proceso. Fecha crítica para liberar cobro.' },
      { id: 'p4', status: 'warn', name: 'Planta arquitectónica N2',  meta: 'v1', owner: 'maria',  dueDate: '2026-03-25', startDate: '2026-03-20', priority: 'media', notes: 'Depende de N1.' },
      { id: 'p5', status: 'warn', name: 'Render de fachada',         meta: '',   owner: 'carlos', dueDate: '2026-03-28', startDate: '2026-03-18', priority: 'media', notes: 'Solicitado por cliente.' },
    ],
    agentMsgs: [
      { text: '<strong>Oficinas Polanco:</strong> Al <span class="ok">40%</span> y sin alertas activas.', time: 'Hace 15 min' },
      { text: '<strong>Próxima acción:</strong> Planta N1 vence el 20 mar. María la tiene en proceso.', time: 'Hace 15 min' },
    ],
  },
  coyoacan: {
    id: 'coyoacan',
    title: 'Remodelación Coyoacán',
    sub: 'Entrega final · Cobro vencido 18 días',
    dotStatus: 'danger',
    type: 'Entrega final',
    kpis: {
      k1v: '$36K', k1s: 'Cobro final vencido 18 días', k1p: '🔴 Urgente',
      k2v: '1', k3v: '90%', k3s: '16 de 18 entregables', k3p: '🏠 Remodelación',
      k4v: '2', k4s: 'bloquean el cobro',
    },
    members: ['ramirez'],
    ganttTitle: 'Remodelación Coyoacán · Cronograma',
    ganttRange: 'Feb — Mar 2026',
    deadline: { pct: 85, label: 'Entrega 20 feb' },
    gantt: [
      { label: 'Planos finales',      owner: 'L. Ramírez', start: 0,  dur: 18, status: 'ok' },
      { label: 'Memoria descriptiva', owner: 'Agente IA',  start: 5,  dur: 10, status: 'ok' },
      { label: 'Especificaciones',    owner: 'Agente IA',  start: 8,  dur: 8,  status: 'ok' },
      { label: 'Bitácora de obra',    owner: 'L. Ramírez', start: 20, dur: 10, status: 'danger' },
      { label: 'Acta de entrega',     owner: 'L. Ramírez', start: 25, dur: 5,  status: 'danger' },
    ],
    delTitle: 'Remodelación Coyoacán · Pendientes',
    delCount: '16 de 18 · 🔴 Cobro vencido',
    deliverables: [
      { id: 'c1', status: 'ok',     name: 'Planos arquitectónicos finales', meta: 'v4',     owner: 'ramirez', dueDate: '2026-02-20', startDate: '2026-01-10', priority: 'alta',  notes: 'Aprobados por el cliente.' },
      { id: 'c2', status: 'ok',     name: 'Memoria descriptiva',            meta: 'agente', owner: 'ramirez', dueDate: '2026-02-22', startDate: '2026-02-15', priority: 'media', notes: 'Generado por el agente v3.' },
      { id: 'c3', status: 'ok',     name: 'Especificaciones técnicas',      meta: 'v2',     owner: 'ramirez', dueDate: '2026-02-25', startDate: '2026-02-18', priority: 'baja',  notes: 'Aprobado.' },
      { id: 'c4', status: 'danger', name: 'Bitácora de obra firmada',       meta: '',        owner: 'ramirez', dueDate: '2026-02-20', startDate: '2026-02-15', priority: 'alta',  notes: 'Pendiente firma del cliente. Bloquea cobro de $36K.' },
      { id: 'c5', status: 'danger', name: 'Acta de entrega final',          meta: '',        owner: 'ramirez', dueDate: '2026-02-25', startDate: '2026-02-20', priority: 'alta',  notes: 'Espera bitácora firmada.' },
    ],
    agentMsgs: [
      { text: '<strong>🔴 Cobro bloqueado:</strong> $36K lleva <span class="err">18 días vencido</span>. Faltan: bitácora firmada y acta de entrega.', time: 'Hace 1 hora' },
      { text: '<strong>Acción recomendada:</strong> Genera el reporte al <span class="ok">90%</span> y envíalo al cliente hoy con solicitud de firma.', time: 'Hace 1 hora' },
    ],
  },
}

export function getProject(id: string): Project | undefined {
  return PROJECTS_MAP[id]
}

export function getAllProjects(): Project[] {
  return Object.values(PROJECTS_MAP)
}

export { PROJECTS_MAP }
