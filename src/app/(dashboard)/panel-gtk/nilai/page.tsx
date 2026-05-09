"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Award, Loader2, Save, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const GRADE_TYPES = [
  { value: "HARIAN", label: "Nilai Harian" },
  { value: "PTS", label: "PTS (Penilaian Tengah Semester)" },
  { value: "PAS", label: "PAS (Penilaian Akhir Semester)" },
  { value: "PRAKTEK", label: "Praktik / Proyek" },
]

const getScoreColor = (score: number) => {
  if (score >= 85) return "text-emerald-600"
  if (score >= 70) return "text-blue-600"
  if (score >= 60) return "text-amber-600"
  return "text-red-600"
}

export default function GTKGradesPage() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]

  const [myClasses, setMyClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [staffId, setStaffId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [gradeType, setGradeType] = useState("HARIAN")
  const [semester, setSemester] = useState(String(new Date().getMonth() <= 5 ? 2 : 1))
  const [year, setYear] = useState(String(new Date().getFullYear()))

  const [students, setStudents] = useState<any[]>([])
  const [scores, setScores] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!tenant) return
    Promise.all([
      fetch(`/api/gtk/my-classes?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/subjects?tenantId=${tenant.id}`).then(r => r.json()),
    ]).then(([cls, subj]) => {
      setMyClasses(cls.classrooms || [])
      setStaffId(cls.staffId || "")
      setSubjects(subj.subjects || [])
      setLoading(false)
    })
  }, [tenant?.id])

  useEffect(() => {
    if (!selectedClass) { setStudents([]); return }
    const cls = myClasses.find(c => c.id === selectedClass)
    if (cls) {
      setStudents(cls.students || [])
      // Init scores empty
      const init: Record<string, string> = {}
      cls.students.forEach((s: any) => { init[s.id] = "" })
      setScores(init)
    }
  }, [selectedClass])

  const handleSave = async () => {
    if (!tenant || !selectedClass || !selectedSubject || !staffId || students.length === 0) return
    const entries = students.filter(s => scores[s.id] !== "" && !isNaN(Number(scores[s.id])))
    if (entries.length === 0) {
      toast({ title: "Isi minimal satu nilai terlebih dahulu", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          grades: entries.map(s => ({
            studentId: s.id,
            subjectId: selectedSubject,
            classroomId: selectedClass,
            staffId,
            type: gradeType,
            semester: Number(semester),
            year: Number(year),
            score: Number(scores[s.id]),
          })),
        }),
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      toast({ title: `${d.saved} nilai berhasil disimpan`, description: `${GRADE_TYPES.find(g => g.value === gradeType)?.label}` })
    } catch {
      toast({ title: "Gagal menyimpan nilai", variant: "destructive" })
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-40 rounded-2xl" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Input Nilai</h1>
        <p className="text-muted-foreground">Masukkan nilai siswa per mata pelajaran</p>
      </div>

      {/* Filter */}
      <Card className="glass border-0">
        <CardHeader className="pb-3"><CardTitle className="text-base">Parameter Penilaian</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Kelas</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
              <SelectContent>
                {myClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mata Pelajaran</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger><SelectValue placeholder="Pilih mapel" /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Jenis Penilaian</Label>
            <Select value={gradeType} onValueChange={setGradeType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GRADE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
            <Label>Tahun Ajaran</Label>
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
        </CardContent>
      </Card>

      {/* Daftar Nilai Siswa */}
      {students.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="p-12 text-center">
            <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Pilih kelas terlebih dahulu untuk menampilkan daftar siswa</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-0">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">{students.length} Siswa</CardTitle>
            <Button onClick={handleSave} disabled={saving || !selectedSubject} className="btn-gradient gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Nilai
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {students.map((student, idx) => {
              const score = scores[student.id] || ""
              const numScore = Number(score)
              return (
                <div key={student.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-2.5">
                  <span className="text-xs text-muted-foreground w-7 text-right shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student.name}</p>
                    {student.nis && <p className="text-[11px] text-muted-foreground">{student.nis}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number" min={0} max={100}
                      className={cn("w-20 text-center font-mono h-8 text-sm", score && cn("font-bold", getScoreColor(numScore)))}
                      placeholder="—"
                      value={score}
                      onChange={e => setScores(s => ({ ...s, [student.id]: e.target.value }))}
                    />
                    {score && !isNaN(numScore) && (
                      <Badge className={cn("text-xs",
                        numScore >= 85 ? "bg-emerald-500/15 text-emerald-700 border-emerald-300" :
                        numScore >= 70 ? "bg-blue-500/15 text-blue-700 border-blue-300" :
                        numScore >= 60 ? "bg-amber-500/15 text-amber-700 border-amber-300" :
                        "bg-red-500/15 text-red-700 border-red-300"
                      )} variant="outline">
                        {numScore >= 85 ? "A" : numScore >= 70 ? "B" : numScore >= 60 ? "C" : "D"}
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
