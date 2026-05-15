"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Award, BookOpen, Loader2 } from "lucide-react"

export default function NilaiSiswaPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await fetch("/api/siswa/nilai")
        if (res.ok) {
          setData(await res.json())
        }
      } catch (e) {
        console.error("Failed to load grades data", e)
      } finally {
        setLoading(false)
      }
    }
    fetchGrades()
  }, [])

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
  }

  const grades = data?.grades || []
  
  // Calculate Average Score
  const totalScore = grades.reduce((acc: number, curr: any) => acc + curr.score, 0)
  const avgScore = grades.length > 0 ? (totalScore / grades.length).toFixed(2) : "0.00"

  // Helper to determine letter grade
  const getLetterGrade = (score: number) => {
    if (score >= 90) return "A"
    if (score >= 85) return "A-"
    if (score >= 80) return "B+"
    if (score >= 75) return "B"
    if (score >= 70) return "C"
    return "D"
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-amber-500 rounded-3xl p-6 text-white shadow-lg shadow-amber-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-amber-100" />
              <span className="text-sm text-amber-100 font-medium">Semester Genap 2025/2026</span>
            </div>
            <h2 className="font-bold text-2xl mt-2">Rata-rata: {avgScore}</h2>
            <p className="text-sm mt-1 text-amber-100">Nilai dari {grades.length} Pelajaran</p>
          </div>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-inner">
            <span className="text-3xl font-black text-amber-500">{getLetterGrade(parseFloat(avgScore))}</span>
          </div>
        </div>
      </div>

      {/* Nilai Mata Pelajaran */}
      <div>
        <h3 className="font-bold text-slate-800 mb-3 ml-1">Nilai Mata Pelajaran</h3>
        <div className="space-y-3">
          {grades.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium text-sm">Belum ada nilai ujian yang diterbitkan.</div>
          ) : (
            grades.map((item: any, idx: number) => {
              const letter = getLetterGrade(item.score)
              return (
                <Card key={idx} className="glass border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                        <BookOpen className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.subject?.name || "Mata Pelajaran"}</h4>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5">{item.type} • Sem {item.semester}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-lg font-black text-slate-800">{item.score}</span>
                      </div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm ${
                        letter.includes('A') ? 'bg-emerald-100 text-emerald-700' :
                        letter.includes('B') ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {letter}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}
