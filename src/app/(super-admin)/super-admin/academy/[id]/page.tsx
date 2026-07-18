"use client"
import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { ChevronLeft, Plus, Save, Trash2, Pencil, PlayCircle, FileText, Settings, Loader2 } from "lucide-react"
import Link from "next/link"

export default function CourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Module state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [currentModule, setCurrentModule] = useState<any>({ title: "", sortOrder: 0 })
  const [isEditingModule, setIsEditingModule] = useState(false)

  // Lesson state
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [currentLesson, setCurrentLesson] = useState<any>({ title: "", videoUrl: "", content: "", duration: 0, sortOrder: 0, moduleId: "" })
  const [isEditingLesson, setIsEditingLesson] = useState(false)

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/super-admin/academy/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data)
      } else {
        toast({ title: "Error", description: "Gagal memuat kelas", variant: "destructive" })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  const handleUpdateCourse = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/super-admin/academy/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: course.title,
          slug: course.slug,
          description: course.description,
          thumbnail: course.thumbnail,
          price: parseInt(course.price.toString()),
          isPublished: course.isPublished
        })
      })
      if (res.ok) {
        toast({ title: "Tersimpan", description: "Pengaturan kelas berhasil diperbarui" })
      } else {
        throw new Error("Gagal menyimpan")
      }
    } catch (e) {
      toast({ title: "Gagal", description: "Gagal menyimpan pengaturan", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveModule = async () => {
    try {
      const url = isEditingModule 
        ? `/api/super-admin/academy/modules/${currentModule.id}`
        : `/api/super-admin/academy/${id}/modules`
      
      const method = isEditingModule ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentModule)
      })

      if (res.ok) {
        toast({ title: "Sukses", description: "Modul berhasil disimpan" })
        setModuleDialogOpen(false)
        fetchCourse()
      } else {
        throw new Error("Gagal menyimpan modul")
      }
    } catch (e) {
      toast({ title: "Error", description: "Gagal menyimpan modul", variant: "destructive" })
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Hapus modul ini beserta seluruh isinya?")) return
    try {
      const res = await fetch(`/api/super-admin/academy/modules/${moduleId}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Dihapus", description: "Modul berhasil dihapus" })
        fetchCourse()
      }
    } catch (e) {}
  }

  const handleSaveLesson = async () => {
    try {
      const url = isEditingLesson 
        ? `/api/super-admin/academy/lessons/${currentLesson.id}`
        : `/api/super-admin/academy/${id}/lessons`
      
      const method = isEditingLesson ? "PUT" : "POST"
      
      const payload = {
        ...currentLesson,
        duration: parseInt(currentLesson.duration.toString() || "0"),
        sortOrder: parseInt(currentLesson.sortOrder.toString() || "0")
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast({ title: "Sukses", description: "Materi berhasil disimpan" })
        setLessonDialogOpen(false)
        fetchCourse()
      } else {
        throw new Error("Gagal menyimpan materi")
      }
    } catch (e) {
      toast({ title: "Error", description: "Gagal menyimpan materi", variant: "destructive" })
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Hapus materi ini?")) return
    try {
      const res = await fetch(`/api/super-admin/academy/lessons/${lessonId}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Dihapus", description: "Materi berhasil dihapus" })
        fetchCourse()
      }
    } catch (e) {}
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
  if (!course) return <div className="p-8 text-center text-red-500">Kelas tidak ditemukan</div>

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/super-admin/academy">
          <Button variant="outline" size="icon" className="rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course Builder</h1>
          <p className="text-muted-foreground text-sm">{course.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-2xl border-0 shadow-xl glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Pengaturan Kelas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Kelas</Label>
                <Input value={course.title} onChange={e => setCourse({...course, title: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Slug URL</Label>
                <Input value={course.slug} onChange={e => setCourse({...course, slug: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Harga (Rp) - 0 untuk Gratis</Label>
                <Input type="number" value={course.price} onChange={e => setCourse({...course, price: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi Lengkap</Label>
                <Textarea value={course.description || ""} onChange={e => setCourse({...course, description: e.target.value})} className="rounded-xl min-h-[100px]" />
              </div>
              <div className="space-y-2">
                <Label>URL Thumbnail (Opsional)</Label>
                <Input value={course.thumbnail || ""} onChange={e => setCourse({...course, thumbnail: e.target.value})} className="rounded-xl" placeholder="https://..." />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label>Status Publikasi</Label>
                  <div className="text-xs text-muted-foreground">Tampilkan di katalog lembaga</div>
                </div>
                <Switch checked={course.isPublished} onCheckedChange={c => setCourse({...course, isPublished: c})} />
              </div>
              <Button className="w-full rounded-xl gap-2 mt-4" onClick={handleUpdateCourse} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan Pengaturan
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-0 shadow-xl glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kurikulum (Silabus)</CardTitle>
                <CardDescription>Atur modul dan materi pembelajaran</CardDescription>
              </div>
              <Button onClick={() => {
                setIsEditingModule(false)
                setCurrentModule({ title: "", sortOrder: course.modules?.length || 0 })
                setModuleDialogOpen(true)
              }} className="rounded-xl gap-2">
                <Plus className="h-4 w-4" /> Modul Baru
              </Button>
            </CardHeader>
            <CardContent>
              {course.modules?.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Belum ada modul. Silakan buat modul pertama.</div>
              ) : (
                <Accordion type="multiple" className="w-full space-y-4">
                  {course.modules?.map((mod: any, mIdx: number) => (
                    <AccordionItem value={mod.id} key={mod.id} className="border rounded-xl px-4 bg-background/50 shadow-sm">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 text-left w-full pr-4">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {mIdx + 1}
                          </span>
                          <span className="font-semibold flex-1">{mod.title}</span>
                          <span className="text-xs text-muted-foreground font-normal">{mod.lessons?.length || 0} Materi</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="space-y-2 pl-11">
                          {mod.lessons?.map((les: any, lIdx: number) => (
                            <div key={les.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors group">
                              <div className="flex items-center gap-3">
                                {les.videoUrl ? <PlayCircle className="h-5 w-5 text-blue-500" /> : <FileText className="h-5 w-5 text-orange-500" />}
                                <div>
                                  <div className="font-medium text-sm">{lIdx + 1}. {les.title}</div>
                                  <div className="text-xs text-muted-foreground">{les.duration} menit</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => {
                                  setIsEditingLesson(true)
                                  setCurrentLesson(les)
                                  setLessonDialogOpen(true)
                                }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteLesson(les.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}

                          <div className="pt-2 flex gap-2">
                            <Button variant="outline" size="sm" className="rounded-lg gap-2" onClick={() => {
                              setIsEditingLesson(false)
                              setCurrentLesson({ title: "", videoUrl: "", content: "", duration: 0, sortOrder: mod.lessons?.length || 0, moduleId: mod.id })
                              setLessonDialogOpen(true)
                            }}>
                              <Plus className="h-3 w-3" /> Tambah Materi
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-lg gap-2 text-muted-foreground" onClick={() => {
                              setIsEditingModule(true)
                              setCurrentModule(mod)
                              setModuleDialogOpen(true)
                            }}>
                              <Pencil className="h-3 w-3" /> Edit Modul
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-lg gap-2 text-destructive" onClick={() => handleDeleteModule(mod.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Modul */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{isEditingModule ? "Edit Modul" : "Modul Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Judul Modul</Label>
              <Input value={currentModule.title} onChange={e => setCurrentModule({...currentModule, title: e.target.value})} className="rounded-xl" placeholder="Contoh: Bab 1 - Pendahuluan" />
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input type="number" value={currentModule.sortOrder} onChange={e => setCurrentModule({...currentModule, sortOrder: e.target.value})} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleSaveModule} className="rounded-xl">Simpan Modul</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Lesson */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditingLesson ? "Edit Materi" : "Materi Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Judul Materi</Label>
              <Input value={currentLesson.title} onChange={e => setCurrentLesson({...currentLesson, title: e.target.value})} className="rounded-xl" placeholder="Contoh: Cara Menambahkan Siswa Baru" />
            </div>
            <div className="space-y-2">
              <Label>URL Video (Opsional - YouTube/Vimeo/MP4)</Label>
              <Input value={currentLesson.videoUrl || ""} onChange={e => setCurrentLesson({...currentLesson, videoUrl: e.target.value})} className="rounded-xl" placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Durasi (Menit)</Label>
              <Input type="number" value={currentLesson.duration} onChange={e => setCurrentLesson({...currentLesson, duration: e.target.value})} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Konten Teks (HTML / Opsional)</Label>
              <Textarea value={currentLesson.content || ""} onChange={e => setCurrentLesson({...currentLesson, content: e.target.value})} className="rounded-xl min-h-[150px]" placeholder="Penjelasan tambahan..." />
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input type="number" value={currentLesson.sortOrder} onChange={e => setCurrentLesson({...currentLesson, sortOrder: e.target.value})} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleSaveLesson} className="rounded-xl">Simpan Materi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
