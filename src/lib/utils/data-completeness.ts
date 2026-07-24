import { findProvinceByName, findRegencyByName } from "@/lib/data"

export type CompletenessLevel = "complete" | "location" | "incomplete"

export interface CompletenessResult {
  level: CompletenessLevel
  missingFields: string[]
  locationMatch: boolean
}

/**
 * Cek kelengkapan data pengajuan perusahaan.
 * - "complete" (🟢): Semua data lengkap & lokasi cocok dataset
 * - "location" (🟡): Data ada tapi province/regency tidak cocok dataset
 * - "incomplete" (🔴): Ada field wajib yang kosong
 */
export function checkDataCompleteness(app: {
  businessName?: string | null
  businessSlug?: string | null
  npsn?: string | null
  province?: string | null
  regency?: string | null
  adminName?: string | null
  adminEmail?: string | null
  adminPhone?: string | null
  address?: string | null
  logo?: string | null
  employeeCount?: number | null
}): CompletenessResult {
  const missing: string[] = []

  if (!app.businessName?.trim()) missing.push("Nama Perusahaan")
  if (!app.businessSlug?.trim()) missing.push("Subdomain")
  // if (!app.npsn || app.npsn.length !== 8) missing.push("NPSN")
  if (!app.province?.trim()) missing.push("Provinsi")
  if (!app.regency?.trim()) missing.push("Kabupaten/Kota")
  if (!app.adminName?.trim()) missing.push("Nama Admin")
  if (!app.adminEmail?.trim()) missing.push("Email Admin")
  if (!app.adminPhone || app.adminPhone.length < 10) missing.push("No. WhatsApp")
  if (!app.address?.trim()) missing.push("Alamat")
  if (!app.logo?.trim()) missing.push("Logo")
  if (!app.employeeCount || app.employeeCount < 1) missing.push("Jumlah Karyawan")

  if (missing.length > 0) {
    return { level: "incomplete", missingFields: missing, locationMatch: false }
  }

  // Cek apakah province & regency cocok dataset
  const provinceMatch = findProvinceByName(app.province!)
  const regencyMatch = findRegencyByName(app.regency!)
  const locationMatch = !!(provinceMatch && regencyMatch)

  if (!locationMatch) {
    return { level: "location", missingFields: [], locationMatch: false }
  }

  return { level: "complete", missingFields: [], locationMatch: true }
}
