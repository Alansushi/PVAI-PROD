# AGENTS.md — Proyecto Vivo AI (PVAI)

## Project Name and Purpose
**Proyecto Vivo** is a project management SaaS for creative agencies. It helps agency teams track projects, deliverables, meeting minutes (minutas), packages, budgets, and team members — all in one place. The product includes an embedded AI assistant ("Agente IA") powered by Claude, accessible via a persistent sidebar panel.

## Tech Stack
- Next.js 16.2.1 App Router, TypeScript, Tailwind CSS
- NextAuth v5 beta (`next-auth@5.0.0-beta.30`)
- Prisma 5 + Supabase PostgreSQL
- Resend v3 for emails
- Node.js 18

## UX Audit Reference
A complete UX audit of the product is available at:
```
docs/audit/Auditoria-Proyecto-Vivo.html
```
Read this file before proposing any UX changes to understand existing findings, recommendations, and priorities.

## Onboarding Note
**El mini-tour de onboarding ya existe — no recrearlo desde cero, solo complementarlo (agregar 1 paso nuevo apuntando al composer del agente).**

The onboarding tour is already implemented. Any onboarding-related work should extend the existing flow by adding a single new step that points users to the AI agent composer. Do not rebuild or replace the current tour.

## AI Sidebar — Key Files for Context

The AI assistant ("Agente IA") is a core feature of PVAI. These are the key files when working on anything related to the agent sidebar:

| File | Description |
|------|-------------|
| `src/components/layout/AgentPanel.tsx` | Panel fijo derecho (295px) + drawer mobile — the main sidebar component |
| `src/lib/context/AgentContext.tsx` | Estado global del agente — global state management for the agent |
| `src/lib/hooks/useAgent.ts` | API calls — hook that handles all API interactions with the agent |
| `src/components/agent/` | Componentes individuales — individual sub-components for the agent UI |
| `src/app/api/agent/route.ts` | API backend Claude — the backend route that calls the Claude API |

## Design System
- Fondo navy: `bg-[#0C1F35]` / `bg-pv-navy`
- Accent: `#2E8FC0` / `text-pv-accent`
- Verde: `#2A9B6F` / `text-pv-green`
- Amber: `#E09B3D` / `text-pv-amber`
- Rojo: `#D94F4F` / `text-pv-red`
- Fuentes: DM Sans (body), `font-display` = Playfair Display
