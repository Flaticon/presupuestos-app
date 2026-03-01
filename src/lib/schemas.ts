import { z } from "zod/v4";

export const ProjectInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  building: z.string(),
  floor: z.string(),
  city: z.string(),
  engineer: z.string(),
  cip: z.string(),
  fc: z.number(),
  fy: z.number(),
  norm: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const NivelSchema = z.object({
  id: z.string(),
  label: z.string(),
  shortLabel: z.string(),
  orden: z.number(),
  active: z.boolean(),
  color: z.string(),
});

export const BudgetItemSchema = z.object({
  d: z.string(),
  u: z.string(),
  m: z.number(),
  cu: z.number(),
  factor: z.number().optional(),
  insumoId: z.string().optional(),
});

export const BudgetGroupSchema = z.object({
  id: z.string(),
  cat: z.string(),
  piso: z.string().optional(),
  link: z.string().optional(),
  areaM2: z.number().optional(),
  metradoUnit: z.string().optional(),
  areaSource: z.object({
    type: z.enum(["auto", "manual", "hybrid"]),
    nota: z.string().optional(),
  }).optional(),
  items: z.array(BudgetItemSchema),
});

export const BudgetSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  groups: z.array(BudgetGroupSchema),
});

/** Validate and return data, or null if invalid */
export function safeParse<T>(schema: z.ZodType<T>, data: unknown, label: string): T | null {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  console.warn(`[metrados] ${label}: schema validation failed`, result.error.issues.slice(0, 3));
  return null;
}
