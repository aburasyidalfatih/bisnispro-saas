import { z } from "zod"

export const facilitySchema = z.object({
  name: z.string().min(1, "Nama fasilitas harus diisi"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  access: z.string().optional().nullable(),
})
