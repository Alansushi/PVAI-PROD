# pvai-next — Claude Code Instructions

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS
- NextAuth v5 beta (`next-auth@5.0.0-beta.30`)
- Prisma 5 + Supabase PostgreSQL
- Resend v3 for emails
- Node.js 18 (WSL2)

## Reglas críticas
- **NO tocar** `/src/app/demo/**` ni `/src/lib/data/**` — demo pública con datos mock, no se modifica
- Usar `src/lib/db-types.ts` para tipos hasta que `prisma generate` produzca los tipos oficiales
- Cast necesario: `prisma.model.findMany(...) as unknown as DBType[]`
- Al hacer tareas largas, crear lista de To Do's antes de empezar

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
- `GET/POST /api/projects` — lista + crear proyectos
- `GET/PUT/DELETE /api/projects/[id]`
- `GET/POST /api/projects/[id]/deliverables`
- `PUT/DELETE /api/projects/[id]/deliverables/[deliverableId]`
- `GET/POST /api/projects/[id]/members`

## Patrones de componentes
- Modales: `Dialog` de `@/components/ui/dialog`
- `Input`, `Textarea`, `Select` de `@/components/ui`
- Refrescar server components tras mutaciones: `router.refresh()` de `useRouter`
- Extraer client buttons de pages server: crear `*Button.tsx` o `*Client.tsx` aparte
