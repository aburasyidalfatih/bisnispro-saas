import * as z from "zod"

export const postSchema = z.object({
  title: z.string().min(3, "Judul artikel minimal 3 karakter").max(100, "Judul maksimal 100 karakter"),
  titleEn: z.string().optional(),
  slug: z.string().min(3, "Slug minimal 3 karakter").max(100, "Slug maksimal 100 karakter").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh berisi huruf kecil, angka, dan strip (-)"),
  content: z.string().min(10, "Konten minimal 10 karakter"),
  contentEn: z.string().optional(),
  featuredImage: z.string().nullable().optional().transform(v => !v ? null : v),
  imageAlt: z.string().max(100, "Alt Text maksimal 100 karakter").nullable().optional().transform(v => !v ? null : v),
  type: z.enum(["EDITORIAL", "BLOG_GURU", "PENGUMUMAN", "PENGUMUMAN_SEMUA", "PENGUMUMAN_GTK", "PENGUMUMAN_ORTU", "PENGUMUMAN_SISWA"]),
  status: z.enum(["DRAFT", "PUBLISHED", "PENDING", "REJECTED", "SCHEDULED"]),
  categoryId: z.string().nullable().optional().transform(v => !v ? null : v),
  seoTitle: z.string().max(60, "SEO Title maksimal 60 karakter").nullable().optional().transform(v => !v ? null : v),
  seoDesc: z.string().max(160, "SEO Description maksimal 160 karakter").nullable().optional().transform(v => !v ? null : v),
  autoShare: z.boolean().optional().default(true),
  publishedAt: z.string().optional().nullable().transform(v => !v ? null : new Date(v))
})
