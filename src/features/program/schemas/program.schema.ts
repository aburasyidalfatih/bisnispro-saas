import { z } from "zod"

export const programSchema = z.object({
  name: z.string().min(1, "Nama program/jurusan harus diisi"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  focus: z.string().optional().nullable(),
  prospects: z.string().optional().nullable(),
})

export type ProgramInput = z.infer<typeof programSchema>
