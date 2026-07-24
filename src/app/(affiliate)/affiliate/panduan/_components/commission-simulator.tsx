"use client"

import { useState } from "react"
import { TrendingUp, Users, Info, Building2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CommissionSimulator({ pricePerStudent, priceLite }: { pricePerStudent: number, priceLite: number }) {
  const [selectedPlan, setSelectedPlan] = useState<"lite" | "pro">("pro")
  const [schoolCount, setSchoolCount] = useState(3)
  const [studentPerSchool, setStudentPerSchool] = useState(300)
  
  const commissionRate = 0.20 // 20%

  const totalStudents = schoolCount * studentPerSchool
  const totalTagihan = selectedPlan === "pro" ? totalStudents * pricePerStudent : schoolCount * priceLite
  const totalKomisi = totalTagihan * commissionRate

  return (
    <div className="bg-white/80 p-6 rounded-2xl border border-emerald-100 shadow-sm col-span-1 md:col-span-2">
      <h4 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-600" /> Simulasi Penghasilan
      </h4>
      
      <div className="space-y-6">
        {/* Toggle Plan Selection */}
        <div className="flex gap-2">
          <Button 
            onClick={() => setSelectedPlan("lite")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-medium text-sm transition-all", 
              selectedPlan === "lite" 
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md" 
                : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            )}
          >
            {selectedPlan === "lite" && <CheckCircle2 className="w-4 h-4" />}
            Paket Lite
          </Button>
          <Button 
            onClick={() => setSelectedPlan("pro")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-medium text-sm transition-all", 
              selectedPlan === "pro" 
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md" 
                : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            )}
          >
            {selectedPlan === "pro" && <CheckCircle2 className="w-4 h-4" />}
            Paket Pro
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-emerald-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" /> Jumlah Perusahaan Direferensikan
            </label>
            <span className="bg-emerald-100 text-emerald-800 py-1 px-3 rounded-full font-bold text-sm">
              {schoolCount.toLocaleString("id-ID")} Perusahaan
            </span>
          </div>
          <Input 
            type="range" 
            min="1" 
            max="50" 
            step="1"
            value={schoolCount} 
            onChange={(e) => setSchoolCount(parseInt(e.target.value))}
            className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {selectedPlan === "pro" && (
          <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-emerald-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" /> Rata-rata Klien per Perusahaan
              </label>
              <span className="bg-emerald-100 text-emerald-800 py-1 px-3 rounded-full font-bold text-sm">
                {studentPerSchool.toLocaleString("id-ID")} Klien
              </span>
            </div>
            <Input 
              type="range" 
              min="50" 
              max="2000" 
              step="50"
              value={studentPerSchool} 
              onChange={(e) => setStudentPerSchool(parseInt(e.target.value))}
              className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
              <span>50</span>
              <span>1.000</span>
              <span>2.000+</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <p className="text-xs text-emerald-700 mb-1 font-medium">{selectedPlan === "pro" ? "Total Klien Keseluruhan" : "Biaya Langganan/ Perusahaan"}</p>
            <p className="text-lg font-bold text-emerald-900">
              {selectedPlan === "pro" 
                ? `${totalStudents.toLocaleString("id-ID")} Klien` 
                : `Rp ${priceLite.toLocaleString("id-ID")} / Tahun`}
            </p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 hidden md:block">
            <p className="text-xs text-emerald-700 mb-1 font-medium">Omset / Tahun</p>
            <p className="text-lg font-bold text-emerald-900">
              Rp {totalTagihan.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-xl text-white shadow-lg shadow-emerald-500/20 col-span-2 md:col-span-1">
            <p className="text-xs text-emerald-100 mb-1 font-medium">Komisi (20%) / Tahun</p>
            <p className="text-xl font-bold">
              Rp {totalKomisi.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 border border-blue-100">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800 leading-relaxed">
            Perhitungan di atas menggunakan estimasi Paket {selectedPlan === "pro" ? "Pro (Rp " + pricePerStudent.toLocaleString("id-ID") + "/klien)" : "Lite (Rp " + priceLite.toLocaleString("id-ID") + "/tahun flat)"}. Komisi yang Anda terima akan terus berlanjut (<strong>Lifetime</strong>) setiap tahun selama perusahaan tersebut memperpanjang langganannya.
          </p>
        </div>
      </div>
    </div>
  )
}
