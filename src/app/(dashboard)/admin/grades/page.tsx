"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GraduationCap, Search, Download, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

const TYPE_ORDER = ["HARIAN", "PTS", "PAS", "PRAKTEK"]
const TYPE_LABELS: Record<string, string> = { HARIAN: "Harian", PTS: "PTS", PAS: "PAS", PRAKTEK: "Praktik" }

const getScoreColor = (score: number) =>
  score >= 85 ? "text-emerald-600" : score >= 70 ? "text-blue-600" : score >= 60 ? "text-amber-600" : "text-red-600"

export default function AdminGradesPage() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]

  const [classrooms, setClassrooms] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [semester, setSemester] = useState(String(new Date().getMonth() <= 5 ? 2 : 1))
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!tenant) return
    Promise.all([
      fetch(`/api/classrooms?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/subjects?tenantId=${tenant.id}`).then(r => r.json()),
    ]).then(([cls, subj]) => {
      setClassrooms(cls.classrooms || [])
      setSubjects(subj.subjects || [])
    })
  }, [tenant?.id])

  const loadGrades = async () => {
    if (!tenant) return
    setLoading(true)
    const params = new URLSearchParams({ tenantId: tenant.id, semester, year })
    if (selectedClass) params.set("classroomId", selectedClass)
    const res = await fetch(`/api/grades?${params}`)
    const data = await res.json()
    setGrades(data.grades || [])
    setLoading(false)
  }

  useEffect(() => { if (tenant) loadGrades() }, [selectedClass, selectedSubject, semester, year, tenant?.id])

  // Group by student
  const byStudent: Record<string, { student: any; grades: any[] }> = {}
  grades.forEach(g => {
    if (selectedSubject && g.subject.id !== selectedSubject) return
    const sid = g.student.id
    if (!byStudent[sid]) byStudent[sid] = { student: g.student, grades: [] }
    byStudent[sid].grades.push(g)
  })

  const entries = Object.values(byStudent).filter(e =>
    !search || e.student.name.toLowerCase().includes(search.toLowerCase()) || (e.student.nis || "").includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">E-Rapor</h1>
          <p className="text-muted-foreground">Rekap nilai akademik siswa</p>
        </div>
      </div>

      {/* Filter */}
      <Card className="glass border-0">
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-xs">Kelas</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Semua Kelas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Kelas</SelectItem>
                  {classrooms.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Mata Pelajaran</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Semua Mapel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Mapel</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Tahun</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0, 1, 2].map(d => {
                    const y = String(new Date().getFullYear() - d)
                    return <SelectItem key={y} value={y}>{y}/{Number(y) + 1}</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Cari siswa..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : entries.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Belum ada data nilai untuk filter ini</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map(({ student, grades: sg }) => {
            const subjectMap: Record<string, any[]> = {}
            sg.forEach(g => {
              const sn = g.subject.name
              if (!subjectMap[sn]) subjectMap[sn] = []
              subjectMap[sn].push(g)
            })
            const overallAvg = sg.reduce((a: number, b: any) => a + b.score, 0) / sg.length

            return (
              <Card key={student.id} className="glass border-0">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{student.name}</CardTitle>
                        {student.nis && <p className="text-xs text-muted-foreground">{student.nis}</p>}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-sm font-bold", getScoreColor(overallAvg))}>
                      Rata-rata: {Math.round(overallAvg * 10) / 10}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 text-muted-foreground font-normal">Mata Pelajaran</th>
                          {TYPE_ORDER.map(t => (
                            <th key={t} className="text-center py-2 text-muted-foreground font-normal px-2">{TYPE_LABELS[t]}</th>
                          ))}
                          <th className="text-center py-2 text-muted-foreground font-normal">Rata-rata</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(subjectMap).map(([subjectName, mapelGrades]) => {
                          const avg = mapelGrades.reduce((a, b) => a + b.score, 0) / mapelGrades.length
                          return (
                            <tr key={subjectName} className="border-b border-border/30 last:border-0">
                              <td className="py-2 font-medium">{subjectName}</td>
                              {TYPE_ORDER.map(t => {
                                const g = mapelGrades.find(g => g.type === t)
                                return (
                                  <td key={t} className={cn("text-center py-2 px-2 font-mono", g ? getScoreColor(g.score) : "text-muted-foreground/30")}>
                                    {g ? g.score : "—"}
                                  </td>
                                )
                              })}
                              <td className={cn("text-center py-2 font-bold", getScoreColor(avg))}>
                                {Math.round(avg * 10) / 10}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
