import { findProvinceByName } from "./indonesia-provinces"
export { provinces, findProvinceByName } from "./indonesia-provinces"
export type { Province } from "./indonesia-provinces"
export type { Regency } from "./regencies-sumatera-jawa"

import { regenciesSumateraJawa } from "./regencies-sumatera-jawa"
import { regenciesLainnya } from "./regencies-lainnya"

/** Seluruh kabupaten/kota di Indonesia */
export const regencies = [...regenciesSumateraJawa, ...regenciesLainnya]

/** Cari kabupaten/kota berdasarkan provinsi ID */
export function getRegenciesByProvince(provinceId: string) {
  return regencies.filter(r => r.provinceId === provinceId)
}

/** Cari kabupaten/kota berdasarkan nama (case-insensitive, partial match) */
export function findRegencyByName(name: string) {
  if (!name) return undefined
  const n = name.trim().toLowerCase()
  // Exact match first
  const exact = regencies.find(r => r.name.toLowerCase() === n)
  if (exact) return exact
  // Partial match (e.g. "Bandung" matches "Kota Bandung" or "Kabupaten Bandung")
  return regencies.find(r => r.name.toLowerCase().includes(n) || n.includes(r.name.toLowerCase()))
}

/** Cari koordinat berdasarkan nama provinsi dan kota/kab */
export function findCoordinates(provinceName: string, regencyName: string): { lat: number; lng: number } | null {
  const province = findProvinceByName(provinceName)
  if (!province) return null

  const provRegencies = getRegenciesByProvince(province.id)
  if (!regencyName) return { lat: province.lat, lng: province.lng }

  const rn = regencyName.trim().toLowerCase()
  const regency = provRegencies.find(r =>
    r.name.toLowerCase() === rn ||
    r.name.toLowerCase().includes(rn) ||
    rn.includes(r.name.toLowerCase().replace(/^(kabupaten|kota)\s+/, ""))
  )

  return regency ? { lat: regency.lat, lng: regency.lng } : { lat: province.lat, lng: province.lng }
}
