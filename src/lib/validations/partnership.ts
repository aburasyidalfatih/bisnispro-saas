import * as z from "zod"

export const partnershipSchema = z.object({
  name: z.string().min(1, "Nama kerjasama wajib diisi"),
  imageUrl: z.string().min(1, "Logo wajib diunggah"),
  websiteUrl: z.string().url("URL tidak valid").optional().or(z.literal("")),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
})

export type PartnershipFormValues = z.infer<typeof partnershipSchema>
