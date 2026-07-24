import { z } from "zod"

// Prisma CUID2 format — lebih relaxed dari cuid() validator
const cuidString = z.string().min(1, "ID tidak valid")

export const inviteSchema = z.object({
  tenantId: cuidString,
  email: z.string().email("Email tidak valid"),
  role: z.enum(["admin", "staf", "orangtua", "klien"]).default("orangtua"),
})

export const addUserSchema = z.object({
  tenantId: cuidString,
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Email tidak valid"),
  phone: z.string().optional(),
  role: z.enum(["admin", "staf", "orangtua", "klien"]).default("orangtua"),
  password: z.string().min(8, "Password minimal 8 karakter").optional(),
})

export const editUserSchema = z.object({
  tenantUserId: cuidString,
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Email tidak valid"),
  phone: z.string().nullable().optional(),
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal('')),
})

export const deleteUserSchema = z.object({
  tenantUserId: cuidString,
})

export const impersonateUserSchema = z.object({
  userId: cuidString,
  tenantId: cuidString,
})

export const impersonateTenantSchema = z.object({
  tenantId: cuidString,
})

export const themeSchema = z.object({
  tenantId: cuidString,
  theme: z.string().min(1).max(50).optional(),
  template: z.string().min(1).max(50).optional(),
  settings: z.any().optional(),
})

export type InviteInput = z.infer<typeof inviteSchema>
export type AddUserInput = z.infer<typeof addUserSchema>
export type ImpersonateUserInput = z.infer<typeof impersonateUserSchema>
