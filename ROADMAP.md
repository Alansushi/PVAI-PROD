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

## FASE 2 — Core PM Features 🟠 PENDIENTE

### F2.1 — Risk Register (Registro de Riesgos)
- **Modelo:** `ProjectRisk { id, projectId, title, description, probability, impact, status, mitigation, owner, createdAt }`
- **API:** `GET/POST /api/projects/[id]/risks`, `PUT/DELETE /api/projects/[id]/risks/[riskId]`
- Panel "Riesgos" en la vista de proyecto (nueva tab/sección)
- IA puede sugerir riesgos basado en entregables warn/danger

### F2.2 — Reporte Semanal Automático (IA)
- Prompt `reporte_semanal` en agent-prompts: % avance, riesgos, próximos hitos, logros, bloqueos
- Modal "Generar Reporte" — muestra reporte, permite copiar/enviar por email
- Modelo `ProcessedReport` ligero para historial

### F2.3 — Métricas de Velocidad del Equipo
- Usar `AuditLog` para calcular entregables completados por semana
- Gráfica de barras en vista de proyecto: "Entregables completados por semana"
- Velocidad actual vs velocidad requerida para cumplir deadline
- **API:** `GET /api/projects/[id]/activity`

### F2.4 — KPIs por Proyecto
- **Modelo:** `ProjectKPI { id, projectId, title, target, current, unit, updatedAt }`
- Panel de KPIs con barra de progreso por KPI
- API CRUD completo

---

## FASE 3 — Advanced PM 🟡 PENDIENTE

### F3.1 — Dependencias entre Entregables
- Relación muchos-a-muchos: `DeliverableDependency { blockerId, blockedId }`
- UI en modal de entregable para seleccionar dependencias
- Alerta automática cuando un bloqueador está en danger

### F3.2 — Reporte Ejecutivo Exportable (PDF)
- `@react-pdf/renderer` o `puppeteer`
- Template: logo, nombre, estado, Gantt simplificado, KPIs, riesgos, próximos hitos
- `GET /api/projects/[id]/report.pdf`
- Botón "Exportar PDF" en la vista de proyecto

### F3.3 — Detección Predictiva de Delays
- Algoritmo: `velocidad_actual = completados_últimas_2_semanas / 2`
- Si `velocidad_actual < velocidad_requerida * 0.8` → badge "En riesgo" predictivo
- Notificación semanal al PM si se detecta riesgo

### F3.4 — Vista de Capacidad del Equipo
- Por miembro: entregables activos, vencimientos próximos, % carga estimada
- Barra visual de carga (low/medium/high)
- Chip IA: "Balancea la carga" — sugiere reasignaciones

---

## FASE 4 — Enterprise PM ⚪ FUTURO

### F4.1 — Gestión de Cambios Formal (Change Control)
- Change requests con aprobación del PM
- Historial de cambios de alcance + impacto en timeline automático

### F4.2 — Critical Path Calculation
- Calcular la cadena crítica de entregables
- Resaltar en Gantt las tareas que NO pueden retrasarse

### F4.3 — Portfolio View Cross-proyectos
- Matriz con todos los proyectos del org
- Comparar velocidad, riesgo, presupuesto entre proyectos

### F4.4 — Gestión de Proveedores/Externos
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
| F2.2 | Reporte Semanal IA | ★★★★★ | 🟠 Pendiente |
| F2.1 | Risk Register | ★★★★☆ | 🟠 Pendiente |
| F2.3 | Velocidad del Equipo | ★★★☆☆ | 🟠 Pendiente |
| F2.4 | KPIs por Proyecto | ★★★☆☆ | 🟠 Pendiente |
| F3.3 | Detección Predictiva Delays | ★★★★★ | 🟡 Pendiente |
| F3.4 | Vista Capacidad Equipo | ★★★★☆ | 🟡 Pendiente |
| F3.1 | Dependencias Entregables | ★★★☆☆ | 🟡 Pendiente |
| F3.2 | Reporte PDF Exportable | ★★★☆☆ | 🟡 Pendiente |
| F4.x | Enterprise features | ★★☆☆☆ | ⚪ Futuro |

---

## Verificación por fase

- **F1.1:** Entregable con `dueDate` pasado + llamar `/api/cron/daily-alerts?secret=X` → email recibido + notificación in-app
- **F1.2:** Proyecto con entregables vencidos → ver contador rojo en columna Entregables en `/inicio`
- **F1.3:** Abrir Quick Chips en proyecto → probar nuevos prompts (⚡🔮🚧📋)
- **F1.4:** Crear proyecto con budget vía API → ver columna Presupuesto en `/inicio`
- **F2.1:** Agregar riesgo al proyecto → aparece en panel, IA lo menciona en análisis
- **F2.2:** Click "Generar Reporte" → Claude produce resumen ejecutivo en < 10s
- **F3.3:** Proyecto lento con deadline próximo → badge predictivo "En riesgo" en dashboard
