import * as z from "zod"

export const eventSchema = z.object({
  title: z.string().min(3, "Judul acara minimal 3 karakter").max(100, "Judul maksimal 100 karakter"),
  description: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  contactPerson: z.string().optional().or(z.literal("")),
  startDate: z.coerce.date({
    required_error: "Tanggal mulai wajib diisi",
    invalid_type_error: "Format tanggal tidak valid",
  }),
  endDate: z.coerce.date({
    required_error: "Tanggal selesai wajib diisi",
    invalid_type_error: "Format tanggal tidak valid",
  }),
})
