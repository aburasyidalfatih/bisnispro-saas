"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GraduationCap, TrendingUp, BarChart3, Download, Loader2, BookOpen } from "lucide-react"
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"

interface Grade {
  id: string; type: string; semester: number; year: number; score: number; notes: string | null
  subject: { name: string; code: string | null }
  staff: { name: string }
}

const TYPE_LABELS: Record<string, string> = {
  HARIAN: "Harian", PTS: "PTS", PAS: "PAS", PRAKTEK: "Praktik"
}

const getScoreColor = (score: number) =>
  score >= 85 ? "text-emerald-600" : score >= 70 ? "text-blue-600" : score >= 60 ? "text-amber-600" : "text-red-600"

const getScoreBg = (score: number) =>
  score >= 85 ? "bg-emerald-500/10 border-emerald-300 text-emerald-700" :
  score >= 70 ? "bg-blue-500/10 border-blue-300 text-blue-700" :
  score >= 60 ? "bg-amber-500/10 border-amber-300 text-amber-700" :
  "bg-red-500/10 border-red-300 text-red-700"

export default function OrtuRaporPage() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]

  const [children, setChildren] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState("")
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [gradesLoading, setGradesLoading] = useState(false)
  const [semester, setSemester] = useState(String(new Date().getMonth() <= 5 ? 2 : 1))
  const [year, setYear] = useState(String(new Date().getFullYear()))

  useEffect(() => {
    if (!tenant) return
    fetch(`/api/ortu/children?tenantId=${tenant.id}`)
      .then(r => r.json())
      .then(d => {
        const kids = d.children || []
        setChildren(kids)
        if (kids.length > 0) setSelectedChild(kids[0].id)
        setLoading(false)
      })
  }, [tenant?.id])

  useEffect(() => {
    if (!selectedChild || !tenant) return
    setGradesLoading(true)
    fetch(`/api/ortu/grades?tenantId=${tenant.id}&studentId=${selectedChild}&semester=${semester}&year=${year}`)
      .then(r => r.json())
      .then(d => { setGrades(d.grades || []); setGradesLoading(false) })
  }, [selectedChild, semester, year])

  // Group grades by subject
  const bySubject: Record<string, Grade[]> = {}
  grades.forEach(g => {
    const key = g.subject.name
    if (!bySubject[key]) bySubject[key] = []
    bySubject[key].push(g)
  })

  // Calculate averages per subject
  const averages = Object.entries(bySubject).map(([name, gs]) => {
    const avg = gs.reduce((a, b) => a + b.score, 0) / gs.length
    return { name: name.length > 8 ? name.slice(0, 8) + "…" : name, avg: Math.round(avg * 10) / 10, fullName: name }
  })

  const overallAvg = averages.length > 0
    ? Math.round(averages.reduce((a, b) => a + b.avg, 0) / averages.length * 10) / 10
    : 0

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nilai & Rapor</h1>
        <p className="text-muted-foreground">Pantau perkembangan nilai akademik putra/putri Anda</p>
      </div>

      {/* Filter */}
      <div className="grid gap-4 sm:grid-cols-3">
        {children.length > 1 && (
          <div className="space-y-2">
            <Label>Anak</Label>
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{children.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>Semester</Label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Semester 1 (Ganjil)</SelectItem>
              <SelectItem value="2">Semester 2 (Genap)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tahun</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[0, 1, 2].map(d => {
                const y = String(new Date().getFullYear() - d)
                return <SelectItem key={y} value={y}>{y}/{Number(y) + 1}</SelectItem>
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {gradesLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : grades.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Belum ada nilai yang tersedia untuk periode ini</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Rata-rata & Radar */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="glass border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rata-rata Keseluruhan</p>
                    <p className={cn("text-3xl font-bold", getScoreColor(overallAvg))}>{overallAvg}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[
                    { label: "Mapel", val: averages.length },
                    { label: "A (≥85)", val: averages.filter(a => a.avg >= 85).length },
                    { label: "B (70–84)", val: averages.filter(a => a.avg >= 70 && a.avg < 85).length },
                    { label: "D (<60)", val: averages.filter(a => a.avg < 60).length },
                  ].map(s => (
                    <div key={s.label} className="text-center rounded-lg bg-muted/40 p-2">
                      <p className="text-lg font-bold">{s.val}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {averages.length >= 3 && (
              <Card className="glass border-0">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Radar Nilai</CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-2">
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={averages}>
                      <PolarGrid className="stroke-muted/50" />
                      <PolarAngleAxis dataKey="name" className="text-[10px]" />
                      <Radar dataKey="avg" fill="hsl(var(--primary))" fillOpacity={0.25} stroke="hsl(var(--primary))" strokeWidth={2} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontSize: "12px" }} formatter={(v: any) => [v, "Nilai"]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Per Mata Pelajaran */}
          <Card className="glass border-0">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Detail Per Mata Pelajaran</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(bySubject).map(([subjectName, subjectGrades]) => {
                const avg = subjectGrades.reduce((a, b) => a + b.score, 0) / subjectGrades.length
                return (
                  <div key={subjectName} className="rounded-xl border border-border/50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                      <p className="text-sm font-semibold">{subjectName}</p>
                      <Badge variant="outline" className={cn("text-xs font-bold", getScoreBg(avg))}>
                        Rata-rata: {Math.round(avg * 10) / 10}
                      </Badge>
                    </div>
                    <div className="px-4 py-2 space-y-1.5">
                      {subjectGrades.map(g => (
                        <div key={g.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground text-xs">{TYPE_LABELS[g.type] || g.type}</span>
                          <span className={cn("font-bold text-base", getScoreColor(g.score))}>{g.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
