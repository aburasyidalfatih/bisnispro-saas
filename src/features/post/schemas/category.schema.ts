import * as z from "zod"

export const categorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter").max(50, "Nama kategori maksimal 50 karakter"),
  slug: z.string().min(2, "Slug minimal 2 karakter").max(50, "Slug maksimal 50 karakter").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh berisi huruf kecil, angka, dan strip (-)"),
  description: z.string().max(200, "Deskripsi maksimal 200 karakter").optional().or(z.literal("")),
})
