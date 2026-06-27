"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createLearningObjective } from "@/features/academic/actions/erapor.action"
import { toast } from "sonner"

export function TpClient({ tenantId, subjects, initialObjectives }: any) {
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [semester, setSemester] = useState("1")
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [formSubjectId, setFormSubjectId] = useState("")

  const filteredObjectives = selectedSubject === "all" 
    ? initialObjectives 
    : initialObjectives.filter((obj: any) => obj.subjectId === selectedSubject)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formSubjectId) return toast.error("Silakan pilih mata pelajaran")
    
    setLoading(true)
    const res = await createLearningObjective(tenantId, {
      subjectId: formSubjectId,
      code,
      description,
      semester: parseInt(semester),
      year: parseInt(year)
    })
    
    setLoading(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Tujuan Pembelajaran berhasil ditambahkan")
      setCode("")
      setDescription("")
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Form Tambah TP */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Tambah TP Baru</CardTitle>
          <CardDescription>Buat kode TP dan deskripsi capaian kompetensinya.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Mata Pelajaran</Label>
              <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Mapel" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sub: any) => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label>Kode TP</Label>
              <Input placeholder="Contoh: TP1, TP.MTK.1" value={code} onChange={e => setCode(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Deskripsi Capaian</Label>
              <Input placeholder="Siswa mampu memahami..." value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
              <div className="flex flex-col gap-2">
                <Label>Tahun Ajaran</Label>
                <Input type="number" value={year} onChange={e => setYear(e.target.value)} required />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Menyimpan..." : "Simpan TP"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabel Data TP */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar TP</CardTitle>
            <CardDescription>Semua Tujuan Pembelajaran yang terdaftar</CardDescription>
          </div>
          <div className="w-[200px]">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Mapel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mapel</SelectItem>
                {subjects.map((sub: any) => (
                  <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Smt/Thn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredObjectives.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                    Belum ada data Tujuan Pembelajaran.
                  </TableCell>
                </TableRow>
              ) : (
                filteredObjectives.map((obj: any) => (
                  <TableRow key={obj.id}>
                    <TableCell className="font-medium">{obj.code}</TableCell>
                    <TableCell>{obj.subject?.name}</TableCell>
                    <TableCell>{obj.description}</TableCell>
                    <TableCell>{obj.semester} / {obj.year}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
