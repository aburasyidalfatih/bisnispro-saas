import { z } from "zod"

// Prisma CUID2 format — lebih relaxed dari cuid() validator
const cuidString = z.string().min(1, "ID tidak valid")

export const inviteSchema = z.object({
  tenantId: cuidString,
  email: z.string().email("Email tidak valid"),
  role: z.enum(["admin", "guru", "orangtua", "siswa"]).default("orangtua"),
})

export const addUserSchema = z.object({
  tenantId: cuidString,
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Email tidak valid"),
  phone: z.string().optional(),
  role: z.enum(["admin", "guru", "orangtua", "siswa"]).default("orangtua"),
  password: z.string().min(8, "Password minimal 8 karakter").optional(),
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
  theme: z.string().min(1).max(50),
})

export type InviteInput = z.infer<typeof inviteSchema>
export type AddUserInput = z.infer<typeof addUserSchema>
export type ImpersonateUserInput = z.infer<typeof impersonateUserSchema>
