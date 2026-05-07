import { z } from "zod"

export const staffSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  role: z.string().min(1, "Jabatan harus diisi"),
  bio: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  email: z.string().email("Email tidak valid").optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
  phone: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
})

export type StaffInput = z.infer<typeof staffSchema>
