import { z } from "zod"

export const achievementSchema = z.object({
  title: z.string().min(1, "Judul harus diisi"),
  description: z.string().optional().nullable(),
  date: z.string().datetime("Format tanggal tidak valid"),
  level: z.string().default("LOKAL"),
  imageUrl: z.string().optional().nullable(),
})

export type AchievementInput = z.infer<typeof achievementSchema>
