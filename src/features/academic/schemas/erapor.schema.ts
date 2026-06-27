import { z } from "zod"

export const learningObjectiveSchema = z.object({
  subjectId: z.string().min(1, "Mata Pelajaran wajib dipilih"),
  code: z.string().min(1, "Kode TP wajib diisi"),
  description: z.string().min(1, "Deskripsi TP wajib diisi"),
  semester: z.coerce.number().min(1).max(2),
  year: z.coerce.number().min(2020),
})

export type LearningObjectiveInput = z.infer<typeof learningObjectiveSchema>

export const formativeScoreSchema = z.object({
  studentId: z.string().min(1, "Siswa wajib dipilih"),
  objectiveId: z.string().min(1, "Tujuan Pembelajaran wajib dipilih"),
  score: z.coerce.number().min(0).max(100),
})

export type FormativeScoreInput = z.infer<typeof formativeScoreSchema>

export const summativeScoreSchema = z.object({
  studentId: z.string().min(1, "Siswa wajib dipilih"),
  subjectId: z.string().min(1, "Mata Pelajaran wajib dipilih"),
  type: z.enum(["LINGKUP_MATERI", "AKHIR_SEMESTER"]),
  score: z.coerce.number().min(0).max(100),
  semester: z.coerce.number().min(1).max(2),
  year: z.coerce.number().min(2020),
})

export type SummativeScoreInput = z.infer<typeof summativeScoreSchema>
