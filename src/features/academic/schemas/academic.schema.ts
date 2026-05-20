import { z } from "zod"

export const subjectSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1, "Nama mata pelajaran wajib diisi").max(100),
  code: z.string().max(20).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
})
