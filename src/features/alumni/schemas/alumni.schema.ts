import { z } from "zod"

export const alumniSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  graduationYear: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  currentStatus: z.enum(["KULIAH", "KERJA", "WIRAUSAHA", "MENCARI_KERJA"]).default("KULIAH"),
  institutionName: z.string().optional().nullable(),
  testimonial: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
})

export type AlumniInput = z.infer<typeof alumniSchema>
