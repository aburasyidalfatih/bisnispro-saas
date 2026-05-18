"use client"

import { useState } from "react"
import { TrendingUp, Users, Info, Building2 } from "lucide-react"

export function CommissionSimulator({ pricePerStudent }: { pricePerStudent: number }) {
  const [schoolCount, setSchoolCount] = useState(3)
  const [studentPerSchool, setStudentPerSchool] = useState(300)
  
  const commissionRate = 0.20 // 20%

  const totalStudents = schoolCount * studentPerSchool
  const totalTagihan = totalStudents * pricePerStudent
  const totalKomisi = totalTagihan * commissionRate

  return (
    <div className="bg-white/80 p-6 rounded-2xl border border-emerald-100 shadow-sm col-span-1 md:col-span-2">
      <h4 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-600" /> Simulasi Penghasilan
      </h4>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-emerald-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" /> Jumlah Sekolah Direferensikan
            </label>
            <span className="bg-emerald-100 text-emerald-800 py-1 px-3 rounded-full font-bold text-sm">
              {schoolCount.toLocaleString("id-ID")} Sekolah
            </span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="50" 
            step="1"
            value={schoolCount} 
            onChange={(e) => setSchoolCount(parseInt(e.target.value))}
            className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        <div className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-emerald-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" /> Rata-rata Siswa per Sekolah
            </label>
            <span className="bg-emerald-100 text-emerald-800 py-1 px-3 rounded-full font-bold text-sm">
              {studentPerSchool.toLocaleString("id-ID")} Siswa
            </span>
          </div>
          <input 
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <p className="text-xs text-emerald-700 mb-1 font-medium">Total Siswa Keseluruhan</p>
            <p className="text-lg font-bold text-emerald-900">
              {totalStudents.toLocaleString("id-ID")} Siswa
            </p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 hidden md:block">
            <p className="text-xs text-emerald-700 mb-1 font-medium">Tagihan / Tahun</p>
            <p className="text-lg font-bold text-emerald-900">
              Rp {(totalTagihan/1000000).toFixed(1)} Juta
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
            Perhitungan di atas menggunakan estimasi Paket Pro (Rp {pricePerStudent.toLocaleString("id-ID")}/siswa). Komisi yang Anda terima akan terus berlanjut (<strong>Lifetime</strong>) setiap tahun selama sekolah tersebut memperpanjang langganannya.
          </p>
        </div>
      </div>
    </div>
  )
}
