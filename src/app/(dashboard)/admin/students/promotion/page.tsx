"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { useRouter } from"next/navigation"
import { useToast } from"@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { Checkbox } from"@/components/ui/checkbox"
import { ChevronLeft, TrendingUp, Loader2, Users, AlertCircle, ArrowRight } from"lucide-react"
import Link from"next/link"

export default function PromotionPage() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id
  const router = useRouter()
  const { toast } = useToast()

  const [classrooms, setClassrooms] = useState<any[]>([])
  const [sourceClassroomId, setSourceClassroomId] = useState<string>("")
  const [targetClassroomId, setTargetClassroomId] = useState<string>("")
  const [targetStatus, setTargetStatus] = useState<string>("CLASSROOM") // CLASSROOM, GRADUATED, INACTIVE

  const [students, setStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Fetch Classrooms
  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/classrooms?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => setClassrooms(data))
      .catch(console.error)
  }, [tenantId])

  // Fetch Students when source class changes
  useEffect(() => {
    if (!tenantId || !sourceClassroomId) {
      setStudents([])
      setSelectedStudents([])
      return
    }
    
    const fetchStudents = async () => {
      setLoadingStudents(true)
      try {
        const res = await fetch(`/api/students?tenantId=${tenantId}&classroomId=${sourceClassroomId}&take=1000`)
        const data = await res.json()
        setStudents(data.data || [])
        // Default select all
        setSelectedStudents((data.data || []).map((s: any) => s.id))
      } catch (e) {
        toast({ title:"Gagal memuat siswa", variant:"destructive" })
      } finally {
        setLoadingStudents(false)
      }
    }
    
    fetchStudents()
  }, [tenantId, sourceClassroomId, toast])

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map(s => s.id))
    }
  }

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      toast({ title:"Pilih minimal 1 siswa", variant:"destructive" })
      return
    }

    if (targetStatus ==="CLASSROOM" && !targetClassroomId) {
      toast({ title:"Pilih kelas tujuan", variant:"destructive" })
      return
    }

    if (targetStatus ==="CLASSROOM" && targetClassroomId === sourceClassroomId) {
      toast({ title:"Kelas tujuan tidak boleh sama dengan kelas asal", variant:"destructive" })
      return
    }

    setProcessing(true)
    try {
      const res = await fetch("/api/students/promotion", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({
          studentIds: selectedStudents,
          targetClassroomId: targetStatus ==="CLASSROOM" ? targetClassroomId : null,
          status: targetStatus
        })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      toast({ title:"Mutasi Berhasil", description: `${json.count} siswa berhasil diproses.` })
      
      // Reset after success
      setSourceClassroomId("")
      setTargetClassroomId("")
      setStudents([])
      setSelectedStudents([])
    } catch (e: any) {
      toast({ title:"Mutasi Gagal", description: e.message, variant:"destructive" })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/admin/students">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Mutasi & Kenaikan Kelas</h1>
          <p className="text-sm text-muted-foreground">Pindahkan siswa ke kelas baru atau ubah status kelulusan secara massal.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Kontrol Utama */}
        <div className="md:col-span-4 space-y-6">
          <Card className="glass border-0 shadow-sm border-t-4 border-t-indigo-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" /> Kelas Asal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={sourceClassroomId} onValueChange={setSourceClassroomId}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Pilih Kelas Asal" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sourceClassroomId && (
                <p className="text-xs text-muted-foreground mt-2 font-medium">
                  {students.length} siswa ditemukan
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90 md:rotate-0" />
            </div>
          </div>

          <Card className="glass border-0 shadow-sm border-t-4 border-t-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" /> Tujuan Mutasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={targetStatus} onValueChange={setTargetStatus}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Pilih Tujuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLASSROOM">Pindah ke Kelas Lain</SelectItem>
                  <SelectItem value="GRADUATED">Lulus (Alumni)</SelectItem>
                  <SelectItem value="INACTIVE">Nonaktif (Keluar/DO)</SelectItem>
                </SelectContent>
              </Select>

              {targetStatus ==="CLASSROOM" && (
                <div className="pt-2">
                  <label className="text-xs font-semibold mb-1.5 block">Pilih Kelas Tujuan:</label>
                  <Select value={targetClassroomId} onValueChange={setTargetClassroomId}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="-- Kelas Tujuan --" />
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms.map(c => (
                        <SelectItem key={c.id} value={c.id} disabled={c.id === sourceClassroomId}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {targetStatus ==="GRADUATED" && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Siswa yang diluluskan akan dihapus dari daftar kelas aktif dan ditandai sebagai Alumni.
                </div>
              )}
            </CardContent>
          </Card>

          <Button 
            onClick={handleSubmit} 
            disabled={processing || selectedStudents.length === 0 || (targetStatus ==="CLASSROOM" && !targetClassroomId)}
            className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20"
          >
            {processing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Proses {selectedStudents.length} Siswa
          </Button>
        </div>

        {/* Daftar Siswa */}
        <div className="md:col-span-8">
          <Card className="glass border-0 shadow-sm h-full flex flex-col">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Daftar Siswa untuk Diproses</CardTitle>
                <div className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {selectedStudents.length} / {students.length} Terpilih
                </div>
              </div>
            </CardHeader>
            
            <div className="p-0 flex-1 overflow-hidden">
              {loadingStudents ? (
                <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : !sourceClassroomId ? (
                <div className="py-20 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Pilih kelas asal terlebih dahulu.</p>
                </div>
              ) : students.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                  <p>Tidak ada siswa di kelas ini.</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <Checkbox 
                            checked={selectedStudents.length === students.length && students.length > 0} 
                            onCheckedChange={toggleSelectAll} 
                          />
                        </th>
                        <th className="p-3 text-left font-semibold text-muted-foreground uppercase text-xs tracking-wider">Nama Lengkap</th>
                        <th className="p-3 text-left font-semibold text-muted-foreground uppercase text-xs tracking-wider">NIS</th>
                        <th className="p-3 text-left font-semibold text-muted-foreground uppercase text-xs tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {students.map(student => (
                        <tr 
                          key={student.id} 
                          className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedStudents.includes(student.id) ? 'bg-primary/5' : ''}`}
                          onClick={() => toggleStudent(student.id)}
                        >
                          <td className="p-3 text-center">
                            <Checkbox checked={selectedStudents.includes(student.id)} />
                          </td>
                          <td className="p-3 font-medium">{student.name}</td>
                          <td className="p-3 font-mono text-xs text-muted-foreground">{student.nis ||"-"}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-200">
                              Aktif
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
