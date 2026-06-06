"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Award, Users, Save, Search, Download, FileSpreadsheet, Info } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function NilaiPage() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id

  const [loading, setLoading] = useState(true)
  const [fetchingData, setFetchingData] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [metadata, setMetadata] = useState<any>(null)
  const [studentsData, setStudentsData] = useState<any[]>([])
  
  // State untuk Filter / Konteks Nilai
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const defaultSemester = currentMonth >= 6 ? "1" : "2" // Juli-Des = Sem 1, Jan-Jun = Sem 2
  
  const [filter, setFilter] = useState({
    classroomId: "",
    subjectId: "",
    type: "HARIAN_1",
    semester: defaultSemester,
    year: currentYear.toString()
  })

  // State untuk menampung input nilai yang sedang diketik
  const [gradesInput, setGradesInput] = useState<Record<string, { score: string, notes: string }>>({})

  useEffect(() => {
    if (!tenantId) return
    fetchMetadata()
  }, [tenantId])

  const fetchMetadata = async () => {
    try {
      const res = await fetch(`/api/gtk/metadata?tenantId=${tenantId}`)
      if (res.ok) {
        const data = await res.json()
        setMetadata(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchStudents = async () => {
    if (!filter.classroomId || !filter.subjectId) {
      return toast({ title: "Perhatian", description: "Pilih Kelas dan Mata Pelajaran terlebih dahulu", variant: "default" })
    }

    setFetchingData(true)
    try {
      const query = new URLSearchParams({
        tenantId: tenantId!,
        classroomId: filter.classroomId,
        subjectId: filter.subjectId,
        type: filter.type,
        semester: filter.semester,
        year: filter.year
      }).toString()

      const res = await fetch(`/api/gtk/nilai?${query}`)
      if (res.ok) {
        const data = await res.json()
        setStudentsData(data)
        
        // Pindahkan data nilai yang sudah ada dari database ke state input
        const initialGrades: Record<string, { score: string, notes: string }> = {}
        data.forEach((student: any) => {
          const existingGrade = student.grades && student.grades.length > 0 ? student.grades[0] : null
          initialGrades[student.id] = {
            score: existingGrade ? existingGrade.score.toString() : "",
            notes: existingGrade?.notes || ""
          }
        })
        setGradesInput(initialGrades)
      }
    } catch (e) {
      toast({ title: "Gagal", description: "Tidak dapat mengambil data siswa", variant: "destructive" })
    } finally {
      setFetchingData(false)
    }
  }

  const handleGradeChange = (studentId: string, field: "score" | "notes", value: string) => {
    setGradesInput(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }))
  }

  const handleSaveGrades = async () => {
    if (!metadata?.staffId) return toast({ title: "Error", description: "Akses staf tidak valid", variant: "destructive" })
    
    // Siapkan payload
    const payloadGrades = Object.entries(gradesInput).map(([studentId, data]) => ({
      studentId,
      score: data.score,
      notes: data.notes
    })).filter(g => g.score !== "") // Hanya kirim yang ada isinya

    if (payloadGrades.length === 0) {
      return toast({ title: "Info", description: "Belum ada nilai yang diinput", variant: "default" })
    }

    setSaving(true)
    try {
      const payload = {
        tenantId,
        staffId: metadata.staffId,
        ...filter,
        grades: payloadGrades
      }

      const res = await fetch("/api/gtk/nilai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const result = await res.json()
        toast({ title: "Berhasil disimpan", description: `${result.savedCount} data nilai berhasil diperbarui.` })
      } else {
        toast({ title: "Gagal", description: "Terjadi kesalahan saat menyimpan", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Koneksi terputus", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="skeleton h-96 rounded-3xl" />

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" /> Input Nilai Siswa
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola nilai akademik siswa secara kolektif layaknya Spreadsheet.</p>
        </div>
      </div>

      <Card className="glass border-0 shadow-sm overflow-visible z-20">
        <CardContent className="p-5 sm:p-6 grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mata Pelajaran</label>
              <Select value={filter.subjectId} onValueChange={(val) => setFilter({...filter, subjectId: val})}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Pilih Mapel" />
                </SelectTrigger>
                <SelectContent>
                  {metadata?.subjects.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kelas</label>
              <Select value={filter.classroomId} onValueChange={(val) => setFilter({...filter, classroomId: val})}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {metadata?.classrooms.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jenis Penilaian</label>
              <Select value={filter.type} onValueChange={(val) => setFilter({...filter, type: val})}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HARIAN_1">Ulangan Harian 1</SelectItem>
                  <SelectItem value="HARIAN_2">Ulangan Harian 2</SelectItem>
                  <SelectItem value="HARIAN_3">Ulangan Harian 3</SelectItem>
                  <SelectItem value="TUGAS">Nilai Tugas</SelectItem>
                  <SelectItem value="PRAKTEK">Nilai Praktek</SelectItem>
                  <SelectItem value="PTS">PTS (Tengah Semester)</SelectItem>
                  <SelectItem value="PAS">PAS (Akhir Semester)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Semester</label>
              <Select value={filter.semester} onValueChange={(val) => setFilter({...filter, semester: val})}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Ganjil (1)</SelectItem>
                  <SelectItem value="2">Genap (2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end pt-2 border-t mt-2">
            <Button onClick={handleFetchStudents} disabled={fetchingData} className="rounded-xl w-full sm:w-auto">
              {fetchingData ? <span className="animate-pulse">Memuat...</span> : <><Search className="mr-2 h-4 w-4" /> Tampilkan Data Siswa</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {studentsData.length > 0 && (
        <Card className="glass border-0 shadow-sm overflow-hidden z-10">
          <CardHeader className="bg-muted/30 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Daftar Nilai ({studentsData.length} Siswa)
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-1.5">
                <Info className="h-4 w-4" /> Ketik nilai pada kolom untuk menyimpan langsung (Skala 0-100).
              </CardDescription>
            </div>
            <div className="flex gap-2">
               <Button variant="outline" size="sm" className="hidden sm:flex rounded-xl bg-background hover:bg-muted">
                 <Download className="mr-2 h-4 w-4" /> Unduh Format Excel
               </Button>
               <button onClick={handleSaveGrades} disabled={saving} className="rounded-xl shadow-md shadow-primary/20">
                 {saving ? <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                 Simpan Nilai
               </button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-4 font-bold w-16 text-center">No</TableHead>
                  <TableHead className="px-6 py-4 font-bold min-w-[200px]">Nama Siswa</TableHead>
                  <TableHead className="px-6 py-4 font-bold w-48 text-center bg-primary/5 text-primary">Nilai</TableHead>
                  <TableHead className="px-6 py-4 font-bold min-w-[200px]">Catatan / Evaluasi (Opsional)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsData.map((student, index) => (
                  <TableRow key={student.id} className="hover:bg-muted/10 transition-colors group">
                    <TableCell className="px-6 py-4 font-medium text-center text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="px-6 py-4">
                      <p className="font-bold text-foreground">{student.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{student.nisn || '-'}</p>
                    </TableCell>
                    <TableCell className="px-6 py-3 bg-primary/5 group-hover:bg-primary/10 transition-colors">
                      <Input 
                        type="number" 
                        min="0" max="100" step="0.1"
                        placeholder="0-100"
                        className="text-center font-bold text-lg h-12 bg-background border-border shadow-inner"
                        value={gradesInput[student.id]?.score || ""}
                        onChange={(e) => handleGradeChange(student.id, "score", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <Input 
                        placeholder="Catatan..."
                        className="bg-transparent border-transparent hover:border-border focus:border-primary focus:bg-background h-10 transition-all"
                        value={gradesInput[student.id]?.notes || ""}
                        onChange={(e) => handleGradeChange(student.id, "notes", e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <div className="p-4 bg-muted/20 border-t flex items-center justify-between sm:hidden">
            <button onClick={handleSaveGrades} disabled={saving} className="rounded-xl w-full">
              {saving ? <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full mr-2" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan Nilai
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
