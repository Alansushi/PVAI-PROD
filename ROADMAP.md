# Roadmap de Automatización — Coordinador de Proyectos

## Objetivo
Transformar pvai-next en un coordinador de proyectos automatizado completo, añadiendo capas de automatización sobre la base existente (CRUD, Kanban, Gantt, IA minutas, notificaciones, audit logs, roles, multi-org).

---

## Estado actual (ya implementado — NO reimplementar)
- CRUD proyectos, entregables, paquetes, miembros
- Kanban 3 columnas (ok/warn/danger) + Gantt
- IA procesamiento de minutas (Anthropic SDK)
- KPIs básicos en dashboard (/inicio)
- Sistema de notificaciones en-app
- Audit logs por entidad
- Roles org/proyecto (owner, member, guest)
- Quick chips de IA (riesgos, avance, tiempo, equipo, paquetes)
- `sendOverdueTaskAlert()` en `src/lib/email.ts`

---

## FASE 1 — Victorias rápidas ✅ COMPLETADA

### F1.1 — Alertas automáticas por email ✅
- **Ruta:** `POST /api/cron/daily-alerts`
- Consulta deliverables con `dueDate < now` y `status != 'ok'`
- Llama `sendOverdueTaskAlert()` por cada uno
- Crea notificación in-app (sin duplicar si ya existe del mismo día)
- **Cron:** `vercel.json` → 9am UTC diariamente
- **Activar:** Agregar `CRON_SECRET` al `.env.local` y Vercel
- **Test manual:** `GET /api/cron/daily-alerts?secret=<CRON_SECRET>`
- **Pendiente DB:** `npx prisma migrate dev --name budget-fields`

### F1.2 — Schedule Variance en dashboard ✅
- Tabla de proyectos muestra count de entregables vencidos en rojo (`X vencidas`) bajo la barra de progreso

### F1.3 — Más Quick Chips de IA ✅
Nuevos prompts en `src/lib/agent-prompts.ts`:
- ⚡ `velocidad` — Entregables completados esta semana vs semana pasada
- 🔮 `prediccion` — Proyección de fecha de término con velocidad actual
- 🚧 `bloqueados` — Entregables warn/danger con vencimiento < 7 días
- 📋 `resumen_ejecutivo` — Párrafo ejecutivo profesional para cliente

### F1.4 — Budget/Costo en proyectos ✅
- Campos `budget Float?` y `billedAmount Float?` en `Project` (schema + db-types)
- API `POST/PUT /api/projects` acepta y guarda estos campos
- Dashboard `/inicio`: columna "Presupuesto" con barra color-coded (verde/amber/rojo según % usado)
- **Pendiente DB:** `npx prisma migrate dev --name budget-fields`

---

## FASE 2 — Core PM Features ✅ COMPLETADA

### F2.1 — Risk Register (Registro de Riesgos) ✅
- **Modelo:** `ProjectRisk { id, projectId, title, description, probability, impact, status, mitigation, ownerName, createdAt, updatedAt }`
- **API:** `GET/POST /api/projects/[id]/risks`, `PUT/DELETE /api/projects/[id]/risks/[riskId]`
- Panel `RisksPanel` en vista de proyecto — ordenado por score (prob × impacto), badges open/críticos
- Modal `RiskModal` — toggles de nivel (low/medium/high) + estado (open/mitigated/closed)
- Chip IA: 🛡 `sugerir_riesgos` — Claude sugiere riesgos basado en entregables warn/danger
- **Migración:** `20260317030843_risk_register_kpis_reports`

### F2.2 — Reporte Semanal Automático (IA) ✅
- Prompt `reporte_semanal` (📄) en agent-prompts
- Rama en `POST /api/agent` con `type='reporte_semanal'`: contexto enriquecido con risks + KPIs, `max_tokens: 2000`
- Persiste en `ProcessedReport` (non-blocking), historial últimos 5 vía `GET /api/projects/[id]/reports`
- Modal `ReportModal` — estados: idle → spinner → reporte HTML, botones Copiar + Regenerar + Historial
- Botón "📄 Reporte" en el header de la vista de proyecto

### F2.3 — Métricas de Velocidad del Equipo ✅
- `GET /api/projects/[id]/activity?type=velocity` — últimas 6 semanas ISO + `requiredPerWeek = pendientes / semanas_restantes`
- Calcula completados por semana desde `AuditLog` (action=update, newValue.status=ok)
- Widget `VelocityWidget` — bar chart CSS 6 semanas, línea punteada "meta/semana", badge ámbar si velocidad insuficiente

### F2.4 — KPIs por Proyecto ✅
- **Modelo:** `ProjectKPI { id, projectId, title, target, current, unit, updatedAt, createdAt }`
- **API:** `GET/POST /api/projects/[id]/kpis`, `PUT/DELETE /api/projects/[id]/kpis/[kpiId]`
- Panel `KPIsPanel` — barras de progreso color-coded (verde ≥80%, azul ≥40%, ámbar <40%), badge promedio
- Modal `KPIModal` — preview en tiempo real de la barra de progreso

---

## FASE 3.5 — UX Fixes & Project Edit ✅ COMPLETADA

### F3.5.1 — Fix PDF (renderToBuffer) ✅
- Reemplazado `renderToStream` + conversión manual de stream por `renderToBuffer` en `GET /api/projects/[id]/report-pdf`
- `renderToBuffer` devuelve un `Buffer` directamente; pasado a `new NextResponse(buffer, {...})` sin conversión

### F3.5.2 — Quick Chips Colapsable ✅
- Añadido `chipsOpen` state (default `true`) en `AgentPanel.tsx`
- Label "✦ Elige una acción" convertido en botón toggle con flecha rotante `▾`
- `<QuickChips>` renderizado condicionalmente con `{chipsOpen && ...}`; cuando colapsado el chat ocupa todo el espacio

### F3.5.3 — Modal Editar Proyecto ✅
- **Nuevo componente:** `src/components/dashboard/ProjectEditModal.tsx` — Dialog con campos: título, tipo, status (toggle ok/warn/danger), fechas inicio/fin, presupuesto, facturado
- **Submit:** `PUT /api/projects/${project.id}`, llama `onSaved(updated)` → `setProject` local sin `router.refresh()`
- **Integración:** `DashboardProjectView.tsx` — prop `project` convertida a estado (`useState<ProjectWithRelations>(projectProp)`); botón ✏️ junto al título en header

---

## FASE 3 — Advanced PM ✅ COMPLETADA

### F3.3 — Detección Predictiva de Delays ✅
- `isPredictiveRisk` useMemo en `DashboardProjectView`: `velocidadActual < velocityRequired * 0.8` (últimas 2 semanas)
- Badge `⚠ Riesgo de delay` animate-pulse en header junto al status badge
- Bloque Monday-only en `POST /api/cron/daily-alerts`: consulta proyectos con `endDate`, computa velocidad desde `AuditLog`, crea `Notification { type: 'velocity_risk' }` con dedup de 7 días

### F3.4 — Vista de Capacidad del Equipo ✅
- Nuevo componente `src/components/dashboard/CapacityWidget.tsx` — barras de carga por miembro (low/medium/high)
- Umbrales: 0 tareas = libre (verde), 1-3 = cargado (ámbar), 4+ = sobrecargado (rojo)
- Chip IA ⚖ `balancear_carga` agregado en `src/lib/agent-prompts.ts`
- Renderizado en `DashboardProjectView` debajo de VelocityWidget

### F3.1 — Dependencias entre Entregables ✅
- **Modelo:** `DeliverableDependency { id, blockerId, blockedId }` con relaciones bidireccionales en `Deliverable`
- **Migración:** `20260317040302_deliverable_dependencies`
- **API:** `GET/POST/DELETE /api/projects/[id]/deliverables/[deliverableId]/dependencies`
- `DBTaskModal.tsx` — sección "Bloqueado por": lista de bloqueadores con `×` eliminar, select para agregar; badge ⚠ rojo si bloqueador en danger
- `DashboardProjectView` pasa `allDeliverables` prop al modal

### F3.2 — Reporte Ejecutivo PDF ✅
- **Package:** `@react-pdf/renderer` instalado
- **Componente:** `src/components/pdf/ProjectReportPDF.tsx` — A4 navy: header, estado general (4 stats), KPIs (barras), riesgos (score), entregables vencidos, footer
- **API:** `GET /api/projects/[id]/report-pdf` — descarga `{slug}-reporte.pdf`, requiere auth
- Botón `📥 PDF` (`<a>` tag) en header de `DashboardProjectView`

---

## FASE 4 — Enterprise PM 🟠 EN PROGRESO

### F4.3 — Métricas Portfolio en Vista General ✅ COMPLETADA
- **Integración:** Riesgos abiertos y velocidad incorporados directamente en `/dashboard/inicio`
- **API:** `GET /api/projects` enriquecido con `openRisks`, `velocityThisWeek`, `velocityDelta`
- **Tabla:** Columnas Riesgos + Velocidad añadidas a la tabla de proyectos en Vista General
- **Renombrado:** "Vista del despacho" → "Vista General" en toda la UI autenticada
- **Sidebar:** Label actualizado a "Vista General" / subtítulo "Resumen ejecutivo"; link Portfolio eliminado
- Velocidad calculada desde AuditLog (2 semanas): delta semana actual vs semana anterior
- Riesgos: badge verde (0), ámbar (1-2), rojo (≥3)
- Sin página separada `/dashboard/portfolio` ni ruta `/api/portfolio`

### F4.1 — Gestión de Cambios Formal (Change Control) ⚪ FUTURO
- Change requests con aprobación del PM
- Historial de cambios de alcance + impacto en timeline automático

### F4.2 — Critical Path Calculation ⚪ FUTURO
- Calcular la cadena crítica de entregables
- Resaltar en Gantt las tareas que NO pueden retrasarse

### F4.4 — Gestión de Proveedores/Externos ⚪ FUTURO
- Portal de reporte para clientes (vista limitada)
- Aprobaciones por email con magic link

---

## Tabla de prioridades

| Fase | Feature | Impacto | Estado |
|------|---------|---------|--------|
| F1.1 | Alertas email automáticas | ★★★★★ | ✅ Hecho |
| F1.2 | Schedule Variance dashboard | ★★★★☆ | ✅ Hecho |
| F1.3 | Más Quick Chips de IA | ★★★★★ | ✅ Hecho |
| F1.4 | Budget/Costo | ★★★☆☆ | ✅ Hecho |
| F2.1 | Risk Register | ★★★★☆ | ✅ Hecho |
| F2.2 | Reporte Semanal IA | ★★★★★ | ✅ Hecho |
| F2.3 | Velocidad del Equipo | ★★★☆☆ | ✅ Hecho |
| F2.4 | KPIs por Proyecto | ★★★☆☆ | ✅ Hecho |
| F3.3 | Detección Predictiva Delays | ★★★★★ | ✅ Hecho |
| F3.4 | Vista Capacidad Equipo | ★★★★☆ | ✅ Hecho |
| F3.1 | Dependencias Entregables | ★★★☆☆ | ✅ Hecho |
| F3.2 | Reporte PDF Exportable | ★★★☆☆ | ✅ Hecho |
| F3.5 | UX Fixes & Project Edit | ★★★★☆ | ✅ Hecho |
| F4.3 | Portfolio View | ★★★☆☆ | ✅ Hecho |
| F4.x | Resto Enterprise features | ★★☆☆☆ | ⚪ Futuro |

---

## Verificación por fase

- **F1.1:** Entregable con `dueDate` pasado + llamar `/api/cron/daily-alerts?secret=X` → email recibido + notificación in-app
- **F1.2:** Proyecto con entregables vencidos → ver contador rojo en columna Entregables en `/inicio`
- **F1.3:** Abrir Quick Chips en proyecto → probar nuevos prompts (⚡🔮🚧📋)
- **F1.4:** Crear proyecto con budget vía API → ver columna Presupuesto en `/inicio`
- **F2.1:** Agregar riesgo → aparece en panel ordenado por score; chip 🛡 "Sugerir riesgos" funciona ✅
- **F2.2:** Click "📄 Reporte" en header → modal genera reporte ejecutivo con IA en <15s; historial guarda últimos 5 ✅
- **F2.3:** Proyecto con entregables completados + endDate → VelocityWidget muestra barras + badge alerta si velocidad insuficiente ✅
- **F2.4:** Crear KPI con target/current → barra de progreso color-coded visible en panel ✅
- **F3.3:** Proyecto lento con deadline próximo → badge predictivo "En riesgo" en dashboard
