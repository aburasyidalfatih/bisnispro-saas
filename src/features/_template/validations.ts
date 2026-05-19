import { z } from "zod";

export const createSampleSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
});

export type CreateSampleInput = z.infer<typeof createSampleSchema>;
