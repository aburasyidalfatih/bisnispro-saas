"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getStudentsByClassroom, saveFormativeScore } from "@/features/academic/actions/erapor.action"
import { toast } from "sonner"

export function FormatifClient({ tenantId, classrooms, subjects, learningObjectives }: any) {
  const [classroomId, setClassroomId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [objectiveId, setObjectiveId] = useState("")
  
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  
  const filteredObjectives = learningObjectives.filter((obj: any) => obj.subjectId === subjectId)

  async function loadStudents() {
    if (!classroomId || !objectiveId) {
      toast.error("Silakan pilih Kelas, Mata Pelajaran, dan TP terlebih dahulu.")
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
    
    const res = await saveFormativeScore(tenantId, {
      studentId,
      objectiveId,
      score
    })

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Tersimpan")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Penilaian</CardTitle>
          <CardDescription>Pilih rombongan belajar dan Tujuan Pembelajaran (TP).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <Label>Kelas / Rombel</Label>
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
              <Label>Tujuan Pembelajaran (TP)</Label>
              <Select value={objectiveId} onValueChange={setObjectiveId} disabled={!subjectId}>
                <SelectTrigger><SelectValue placeholder="Pilih TP" /></SelectTrigger>
                <SelectContent>
                  {filteredObjectives.map((obj: any) => (
                    <SelectItem key={obj.id} value={obj.id}>{obj.code} - {obj.description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadStudents} disabled={loadingStudents}>
              {loadingStudents ? "Memuat..." : "Tampilkan Siswa"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Input Nilai Formatif</CardTitle>
            <CardDescription>Tekan Enter atau klik di luar kotak untuk menyimpan nilai secara otomatis.</CardDescription>
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
                  const existingScore = student.formativeScores?.find((s: any) => s.objectiveId === objectiveId)?.score || ""
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
