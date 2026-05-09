"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { ChevronLeft, BookOpen, TrendingUp, Award, MessageSquare, Download, Loader2, User } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AkademikParentPage() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id

  const [loading, setLoading] = useState(true)
  const [childrenData, setChildrenData] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [grades, setGrades] = useState<any[]>([])

  // Fetch children
  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/ortu/children?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(data => {
        if (data.children && data.children.length > 0) {
          setChildrenData(data.children)
          setSelectedStudentId(data.children[0].id)
        } else {
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, [tenantId])

  // Fetch grades when selected child changes
  useEffect(() => {
    if (!tenantId || !selectedStudentId) return
    setLoading(true)
    fetch(`/api/ortu/grades?tenantId=${tenantId}&studentId=${selectedStudentId}`)
      .then(r => r.json())
      .then(data => {
        setGrades(data.grades || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantId, selectedStudentId])

  if (loading && childrenData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const selectedChild = childrenData.find(c => c.id === selectedStudentId)

  // Calculate statistics from real grades
  const avgScore = grades.length > 0 
    ? (grades.reduce((acc, g) => acc + g.score, 0) / grades.length).toFixed(1)
    : "0"
  
  // Find notes from grades
  const notes = grades.filter(g => g.notes).map(g => `[${g.subject.name}] ${g.notes}`)

  return (
    <div className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto md:mt-8 md:rounded-3xl md:overflow-hidden md:border md:shadow-2xl md:shadow-indigo-500/10 bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 pt-10 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BookOpen className="h-32 w-32 -mr-10 -mt-10" />
        </div>
        <div className="relative z-10">
          <Link href="/ortu" className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md transition-colors mb-6">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-black text-white">Laporan Akademik</h1>
          <p className="text-indigo-200 mt-1 text-sm">Transkrip Nilai Siswa</p>
        </div>
      </div>

      <div className="px-5 -mt-12 space-y-5 relative z-10">
        
        {/* Pilih Anak */}
        {childrenData.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {childrenData.map((child: any) => (
              <button
                key={child.id}
                onClick={() => setSelectedStudentId(child.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-colors shadow-sm ${
                  selectedStudentId === child.id 
                    ? "bg-indigo-600 text-white" 
                    : "bg-white text-muted-foreground hover:bg-indigo-50"
                }`}
              >
                <User className="h-4 w-4" /> {child.name.split(" ")[0]}
              </button>
            ))}
          </div>
        )}

        {!selectedChild ? (
           <Card className="glass border-0 shadow-sm p-6 text-center text-muted-foreground">
             Belum ada data anak.
           </Card>
        ) : (
          <>
            {/* Kesimpulan Utama */}
            <Card className="glass border-0 shadow-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div>
                      <h3 className="text-xl font-black text-emerald-600">Nilai Rata-rata: {avgScore}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Berdasarkan {grades.length} penilaian tercatat.</p>
                  </div>
                </div>
                
                {notes.length > 0 && (
                  <div className="bg-muted/50 p-4 rounded-2xl border border-border/50 relative">
                    <MessageSquare className="absolute top-4 right-4 h-4 w-4 text-primary/40" />
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Catatan Guru</p>
                    <ul className="text-sm text-foreground/80 italic list-disc list-inside space-y-1">
                      {notes.slice(0, 3).map((note, idx) => <li key={idx}>{note}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Highlight Mata Pelajaran */}
            <div>
              <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-indigo-500" /> Rincian Nilai
                  </h3>
              </div>
              
              <div className="space-y-3">
                  {loading && <div className="text-center text-xs text-muted-foreground py-4">Memuat data nilai...</div>}
                  {!loading && grades.length === 0 && (
                    <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm text-muted-foreground text-sm">
                      Belum ada nilai yang dimasukkan oleh guru untuk ananda {selectedChild.name}.
                    </div>
                  )}
                  {!loading && grades.map((grade, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                        {/* Nilai Besar */}
                        <div className="h-14 w-14 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-lg font-black text-primary">{grade.score}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">{grade.subject.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase font-bold">{grade.type.replace("_", " ")}</span>
                          </div>
                        </div>

                        {/* Indikator Trend */}
                        <div className="shrink-0 flex flex-col items-end">
                          {grade.score >= 80 ? (
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                          ) : grade.score >= 65 ? (
                            <div className="h-1 w-4 bg-amber-500/50 rounded-full my-2" />
                          ) : (
                            <TrendingUp className="h-5 w-5 text-rose-500 rotate-180" />
                          )}
                        </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Tombol Unduh Rapor Lengkap */}
            <div className="pt-4">
              <Button className="w-full rounded-2xl h-14 bg-white hover:bg-muted text-primary border-2 border-primary/20 shadow-none font-bold text-sm">
                  <Download className="mr-2 h-5 w-5" /> Unduh Rapor PDF Lengkap
              </Button>
              <p className="text-center text-[10px] text-muted-foreground mt-3">Rapor resmi yang ditandatangani Kepala Sekolah</p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
