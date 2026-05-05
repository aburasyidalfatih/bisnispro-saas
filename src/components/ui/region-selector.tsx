"use client"

import { useMemo } from "react"
import { Label } from "@/components/ui/label"
import { provinces, getRegenciesByProvince } from "@/lib/data"

interface RegionSelectorProps {
  province: string
  regency: string
  onProvinceChange: (value: string) => void
  onRegencyChange: (value: string) => void
  required?: boolean
}

export function RegionSelector({ province, regency, onProvinceChange, onRegencyChange, required }: RegionSelectorProps) {
  const selectedProvince = useMemo(() => 
    provinces.find(p => p.name === province), [province]
  )

  const filteredRegencies = useMemo(() => 
    selectedProvince ? getRegenciesByProvince(selectedProvince.id) : [], [selectedProvince]
  )

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div className="space-y-2">
        <Label>Provinsi {required && <span className="text-red-500">*</span>}</Label>
        <select
          required={required}
          value={province}
          onChange={(e) => {
            onProvinceChange(e.target.value)
            onRegencyChange("") // Reset regency when province changes
          }}
          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">-- Pilih Provinsi --</option>
          {provinces.map(p => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Kabupaten / Kota {required && <span className="text-red-500">*</span>}</Label>
        <select
          required={required}
          value={regency}
          onChange={(e) => onRegencyChange(e.target.value)}
          disabled={!selectedProvince}
          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">-- Pilih Kabupaten/Kota --</option>
          {filteredRegencies.map(r => (
            <option key={r.id} value={r.name}>{r.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
