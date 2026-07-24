import * as z from "zod"

export const eventSchema = z.object({
  title: z.string().min(3, "Judul acara minimal 3 karakter").max(100, "Judul maksimal 100 karakter"),
  description: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  contactPerson: z.string().optional().or(z.literal("")),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.string().default("PUBLISHED"),
  publishedAt: z.coerce.date().nullable().optional(),
})

