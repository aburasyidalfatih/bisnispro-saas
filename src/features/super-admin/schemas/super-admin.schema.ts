import { z } from "zod"

export const platformSettingSchema = z.object({
  key: z.string().min(1, "Key harus diisi").max(100),
  value: z.string(),
})

export const deleteTenantSchema = z.object({
  id: z.string().min(1, "Tenant ID tidak valid"),
})

export const exportSchema = z.object({
  data: z.array(z.record(z.any())).min(1, "Data tidak boleh kosong"),
  columns: z.array(z.object({
    header: z.string(),
    key: z.string(),
    width: z.number().optional(),
  })).min(1, "Columns tidak boleh kosong"),
  filename: z.string().max(100).optional(),
})

export const subscriptionPlanSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama paket harus diisi"),
  slug: z.string().min(1, "Slug harus diisi"),
  description: z.string().optional().nullable(),
  price: z.number().min(0).default(0),
  interval: z.enum(["MONTHLY", "YEARLY", "ONETIME"]).default("YEARLY"),
  features: z.string().optional(), // JSON string from UI
  maxStudents: z.number().min(0).default(0),
  maxStorage: z.number().min(0).default(1024),
  isActive: z.boolean().optional().default(true),
  isPopular: z.boolean().optional().default(false),
  sortOrder: z.number().default(0),
})

export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>
