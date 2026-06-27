"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getStudentsByClassroom, saveSummativeScore } from "@/features/academic/actions/erapor.action"
import { useToast } from "@/hooks/use-toast"

export function SumatifClient({ tenantId, classrooms, subjects }: any) {
  const { toast } = useToast()
  const [classroomId, setClassroomId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [type, setType] = useState("LINGKUP_MATERI")
  const [semester, setSemester] = useState("1")
  const [year, setYear] = useState(new Date().getFullYear().toString())
  
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  async function loadStudents() {
    if (!classroomId || !subjectId) {
      toast({ title: "Gagal", description: "Silakan pilih Kelas dan Mata Pelajaran terlebih dahulu.", variant: "destructive" })
      return
    }
    setLoadingStudents(true)
    const res = await getStudentsByClassroom(tenantId, classroomId)
    setStudents(res)
    setLoadingStudents(false)
  }

  async function handleSaveScore(studentId: string, scoreStr: string) {
    const score = parseFloat(scoreStr)
    if (isNaN(score) || score < 0 || score > 100) return
    
    const res = await saveSummativeScore(tenantId, {
      studentId,
      subjectId,
      type: type as any,
      semester: parseInt(semester),
      year: parseInt(year),
      score
    })

    if (res.error) {
      toast({ title: "Gagal", description: res.error, variant: "destructive" })
    } else {
      toast({ title: "Berhasil", description: "Tersimpan" })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Penilaian Sumatif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <Label>Kelas</Label>
              <Select value={classroomId} onValueChange={setClassroomId}>
                <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                <SelectContent>
                  {classrooms.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Mata Pelajaran</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((sub: any) => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Jenis Sumatif</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LINGKUP_MATERI">Lingkup Materi</SelectItem>
                  <SelectItem value="AKHIR_SEMESTER">Akhir Semester (SAS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Ganjil (1)</SelectItem>
                  <SelectItem value="2">Genap (2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadStudents} disabled={loadingStudents}>
              {loadingStudents ? "Memuat..." : "Tampilkan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Input Nilai</CardTitle>
            <CardDescription>Tekan Enter setelah mengetik nilai agar tersimpan.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>NIS/NISN</TableHead>
                  <TableHead className="w-[150px]">Nilai (0-100)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => {
                  const existingScore = student.summativeScores?.find(
                    (s: any) => s.subjectId === subjectId && s.type === type && s.semester === parseInt(semester)
                  )?.score || ""
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.fullName}</TableCell>
                      <TableCell>{student.nisn || "-"}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          defaultValue={existingScore}
                          onBlur={(e) => handleSaveScore(student.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveScore(student.id, e.currentTarget.value)
                              e.currentTarget.blur()
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
