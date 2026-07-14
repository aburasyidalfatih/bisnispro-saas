import { z } from "zod"

export const alumniSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  graduationYear: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  currentStatus: z.string().default("KULIAH"),
  institutionName: z.string().optional().nullable(),
  testimonial: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  pinterest: z.string().optional().nullable(),
})

export type AlumniInput = z.infer<typeof alumniSchema>
