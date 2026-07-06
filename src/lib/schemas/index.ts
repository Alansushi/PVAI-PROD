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
  notes: z.string().max(5000).optional().nullable(),
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
  profDetail: z.string().max(255).optional().nullable(),
  firmUrl: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
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

const optionalDate = z
  .string()
  .refine(s => s === '' || !Number.isNaN(Date.parse(s)), 'Fecha inválida')
  .optional()
  .nullable()

export const projectUpdateSchema = projectCreateSchema.partial().extend({
  budget: z.coerce.number().finite().optional().nullable(),
  billedAmount: z.coerce.number().finite().optional().nullable(),
  startDate: optionalDate,
  endDate: optionalDate,
  nextPaymentAmount: z.string().max(100).optional().nullable(),
  nextPaymentStatus: z.string().max(50).optional().nullable(),
})

// ---- Risk ----

const riskLevel = z.enum(['low', 'medium', 'high'])

export const riskCreateSchema = z.object({
  title: z.string().trim().min(1, 'title es requerido').max(255),
  description: z.string().max(5000).optional().nullable(),
  probability: riskLevel.optional(),
  impact: riskLevel.optional(),
  status: z.enum(['open', 'mitigated', 'closed']).optional(),
  mitigation: z.string().max(5000).optional().nullable(),
  ownerName: z.string().max(255).optional().nullable(),
})

export const riskUpdateSchema = riskCreateSchema.partial()

// ---- KPI ----

export const kpiCreateSchema = z.object({
  title: z.string().trim().min(1, 'title es requerido').max(255),
  target: z.coerce.number().finite(),
  current: z.coerce.number().finite().optional(),
  unit: z.string().trim().max(50).optional(),
})

export const kpiUpdateSchema = kpiCreateSchema.partial()
