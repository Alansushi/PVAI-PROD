# pvai-next — Claude Code Instructions

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS
- NextAuth v5 beta (`next-auth@5.0.0-beta.30`)
- Prisma 5 + Supabase PostgreSQL
- Resend v3 for emails
- Node.js 18 (WSL2)

## Reglas críticas
- Usar `src/lib/db-types.ts` para tipos hasta que `prisma generate` produzca los tipos oficiales
- Cast necesario: `prisma.model.findMany(...) as unknown as DBType[]`
- Al hacer tareas largas, crear lista de To Do's antes de empezar

## Reglas route.ts (App Router)
- **Solo exportar HTTP method handlers**: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- **Nunca** hacer `export interface`, `export type`, `export const` en archivos `route.ts`
- Turbopack puede no registrar los handlers correctamente si hay otros exports en el mismo archivo
- Si necesitas tipos compartidos, definirlos en un archivo aparte (e.g., `types.ts` en la misma carpeta) sin exportarlos desde `route.ts`

## Checklist pre-push a main (OBLIGATORIO)
Antes de completar cualquier implementación y pushear a `main`:
- [ ] `npm run check` sin errores (`tsc --noEmit && next lint`)
- [ ] `npm run build` sin errores — es el check definitivo; Vercel fallará el deploy si este falla
- [ ] Ningún `route.ts` exporta interfaces/types/consts (`grep -rn "^export interface\|^export type\|^export const" src/app/api/`)
- [ ] Nuevas rutas API probadas en browser o con curl antes de pushear
- [ ] Migraciones Prisma corridas y verificadas (`npx prisma migrate status`)
- [ ] Usar rama de feature + PR en lugar de pushear directo a `main` (Vercel crea preview por rama)

## Auth
- `src/auth.ts` exporta `{ handlers, auth, signIn, signOut }`
- En server components: `await auth()` directo (NO como wrapper)
- En client components: importar `signOut` de `next-auth/react`

## Design System
- Fondo navy: `bg-[#0C1F35]` / `bg-pv-navy`
- Accent: `#2E8FC0` / `text-pv-accent`
- Verde: `#2A9B6F` / `text-pv-green`
- Amber: `#E09B3D` / `text-pv-amber`
- Rojo: `#D94F4F` / `text-pv-red`
- Texto gris: `text-pv-gray`
- Fuentes: DM Sans (body), `font-display` = Playfair Display

## API Routes existentes
- `GET/POST /api/projects` — lista + crear proyectos (`budget`, `billedAmount` soportados)
- `GET/PUT/DELETE /api/projects/[id]`
- `GET/POST /api/projects/[id]/deliverables`
- `PUT/DELETE /api/projects/[id]/deliverables/[deliverableId]`
- `GET/POST /api/projects/[id]/members`
- `GET/POST /api/projects/[id]/minutas`
- `GET/PUT/DELETE /api/projects/[id]/minutas/[minutaId]`
- `GET/POST /api/projects/[id]/packages`
- `PUT/DELETE /api/projects/[id]/packages/[packageId]`
- `GET /api/projects/[id]/activity` — audit log del proyecto
- `GET/POST /api/projects/[id]/notes`
- `POST /api/agent` — IA (quick questions + minuta processing)
- `GET/POST /api/notifications` — notificaciones in-app
- `POST /api/cron/daily-alerts` — alertas email de entregables vencidos (cron diario 9am UTC)

## Patrones de componentes
- Modales: `Dialog` de `@/components/ui/dialog`
- `Input`, `Textarea`, `Select` de `@/components/ui`
- Refrescar server components tras mutaciones: `router.refresh()` de `useRouter`
- Extraer client buttons de pages server: crear `*Button.tsx` o `*Client.tsx` aparte

## Flujo de trabajo por fase (OBLIGATORIO)

### Al iniciar cualquier tarea de implementación
- **Leer `ROADMAP.md` primero**, antes de proponer cualquier plan o tocar código
- Identificar qué fases están completas, cuál es la siguiente pendiente y qué dependencias existen

### Al proponer una nueva fase
Generar siempre un plan con esta estructura antes de escribir código:
1. **Contexto** — qué hay implementado que esta fase usa o extiende
2. **Orden de implementación** — con rationale de por qué ese orden
3. **Cambios de DB** — modelos nuevos, migraciones necesarias
4. **Tabla de archivos** — separada en "Modificar" y "Crear", con razón por cada archivo
5. **Comandos de migración** — exactos, en orden
6. **Criterios de verificación** — cómo confirmar que cada sub-ítem funciona

## Reglas de documentación (OBLIGATORIO — no esperar que el usuario lo pida)
- **Actualizar `ROADMAP.md` siempre que:**
  - Se proponga o diseñe una nueva fase → agregar sección con estado `🟠 PENDIENTE`
  - Se complete una fase o sub-ítem → marcar `✅ COMPLETADA`, añadir detalles reales (modelos, rutas, componentes, migración aplicada)
  - Actualizar la tabla de prioridades y criterios de verificación acordemente
- Hacerlo como paso final natural de cada tarea de implementación, igual que correr `prisma generate`

## Automatización implementada (FASE 1)
- `src/app/api/cron/daily-alerts/route.ts` — Cron de alertas vencidas (email + notif in-app)
- `vercel.json` — Cron configurado a las 9am UTC; requiere `CRON_SECRET` en env
- Quick chips IA: `velocidad`, `prediccion`, `bloqueados`, `resumen_ejecutivo` en `src/lib/agent-prompts.ts`
- Campos `budget` y `billedAmount` en `Project` (schema + db-types + API)
- Schedule variance: contador "X vencidas" por proyecto en `/dashboard/inicio`
- Ver `ROADMAP.md` para el plan completo y estado de cada fase


