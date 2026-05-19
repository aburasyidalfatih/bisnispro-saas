import { z } from "zod"

export const sliderSchema = z.object({
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  imageUrl: z.string().min(1, "Gambar harus diunggah"),
  buttonText: z.string().optional().nullable(),
  buttonLink: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export type SliderInput = z.infer<typeof sliderSchema>
