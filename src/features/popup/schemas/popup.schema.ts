import { z } from "zod"

export const popupSchema = z.object({
  title: z.string().min(1, "Judul harus diisi"),
  content: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  buttonText: z.string().optional().nullable(),
  buttonLink: z.string().optional().nullable(),
  isActive: z.boolean().default(false),
  displayOnce: z.boolean().default(true),
})

export type PopupInput = z.infer<typeof popupSchema>
