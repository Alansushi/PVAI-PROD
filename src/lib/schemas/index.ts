import { z } from 'zod'

// ---- Primitivos reutilizables ----

export const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (formato: #RRGGBB)')
export const isoDate = z.string().datetime({ offset: true }).optional().or(z.literal(''))

// ---- Deliverable ----

export const deliverableCreateSchema = z.object({
  name: z.string().min(1, 'name es requerido').max(255),
  status: z.enum(['ok', 'warn', 'danger']).optional(),
  priority: z.enum(['alta', 'media', 'baja']).optional(),
  meta: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
  ownerId: z.string().max(255).optional().nullable(),
  ownerName: z.string().max(255).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  position: z.number().int().optional(),
})

export const deliverableUpdateSchema = deliverableCreateSchema.partial()

// ---- Project Member ----

export const memberCreateSchema = z.object({
  name: z.string().min(1).max(255),
  initials: z.string().min(1).max(3),
  color: hexColor,
  role: z.string().min(1).max(100),
  isExternal: z.boolean().optional(),
  userId: z.string().max(255).optional().nullable(),
  notifyEmail: z.string().email('Email inválido').max(255).optional().nullable().or(z.literal('')),
})

// ---- Register ----

export const registerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
  profession: z.string().min(1).max(255),
  firmName: z.string().min(1).max(255),
})

// ---- Project ----

export const projectCreateSchema = z.object({
  title: z.string().min(1).max(255),
  type: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
  budget: z.number().optional().nullable(),
  billedAmount: z.number().optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
})

export const projectUpdateSchema = projectCreateSchema.partial()
