"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getStudentsByClassroom } from "@/features/academic/actions/erapor.action"
import { toast } from "sonner"
import { Printer, Loader2 } from "lucide-react"

export function CetakClient({ tenantId, classrooms }: any) {
  const [classroomId, setClassroomId] = useState("")
  const [semester, setSemester] = useState("1")
  const [year, setYear] = useState(new Date().getFullYear().toString())
  
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  async function loadStudents() {
    if (!classroomId) {
      return toast.error("Silakan pilih Kelas terlebih dahulu.")
    }
    setLoadingStudents(true)
    const res = await getStudentsByClassroom(tenantId, classroomId)
    setStudents(res)
    setLoadingStudents(false)
  }

  function handlePrint(studentId: string) {
    toast.info("Fitur cetak PDF sedang dalam pengembangan Tahap 4 (Generator Rapor Diknas).")
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Kelas</CardTitle>
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
              {loadingStudents ? "Memuat..." : "Tampilkan Siswa"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Siswa</CardTitle>
            <CardDescription>Pilih siswa untuk diisi catatan wali kelas atau dicetak rapornya.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>NIS/NISN</TableHead>
                  <TableHead>Jml Formatif</TableHead>
                  <TableHead>Jml Sumatif</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell>{student.nisn || "-"}</TableCell>
                    <TableCell>{student.formativeScores?.length || 0} nilai</TableCell>
                    <TableCell>{student.summativeScores?.length || 0} nilai</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePrint(student.id)}>
                        <Printer className="w-4 h-4 mr-2" />
                        Cetak PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
