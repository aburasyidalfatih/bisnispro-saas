import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar")
    .regex(/[a-z]/, "Password harus mengandung minimal 1 huruf kecil")
    .regex(/[0-9]/, "Password harus mengandung minimal 1 angka")
    .regex(/[^A-Za-z0-9]/, "Password harus mengandung minimal 1 karakter spesial"),
  tenantName: z.string().max(100).optional(),
  tenantSlug: z.string().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token harus diisi"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar")
    .regex(/[a-z]/, "Password harus mengandung minimal 1 huruf kecil")
    .regex(/[0-9]/, "Password harus mengandung minimal 1 angka")
    .regex(/[^A-Za-z0-9]/, "Password harus mengandung minimal 1 karakter spesial"),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token harus diisi"),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
