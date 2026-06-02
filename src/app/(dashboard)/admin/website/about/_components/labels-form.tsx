import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Type } from "lucide-react"
import { AboutFormState } from "./types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LabelsFormProps {
  form: AboutFormState
  setForm: React.Dispatch<React.SetStateAction<AboutFormState>>
}

export function LabelsForm({ form, setForm }: LabelsFormProps) {
  const labels = form.settings?.labels || {}

  const updateLabel = (section: string, key: string, value: string) => {
    setForm(prev => {
      const currentLabels = prev.settings?.labels || {}
      const currentSection = currentLabels[section] || {}
      return {
        ...prev,
        settings: {
          ...prev.settings,
          labels: {
            ...currentLabels,
            [section]: {
              ...currentSection,
              [key]: value
            }
          }
        }
      }
    })
  }

  return (
    <Card className="glass border-0 lg:col-span-2">
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Type className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg">Teks & Label Website (Copywriting)</CardTitle>
            <CardDescription>Sesuaikan judul dan deskripsi setiap bagian pada halaman utama</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="programs" className="space-y-6">
          <TabsList className="bg-muted w-full justify-start overflow-x-auto">
            <TabsTrigger value="hero">Utama (Hero)</TabsTrigger>
            <TabsTrigger value="programs">Program</TabsTrigger>
            <TabsTrigger value="staff">Pengajar</TabsTrigger>
            <TabsTrigger value="gallery">Galeri</TabsTrigger>
            <TabsTrigger value="other">Lainnya</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="space-y-4 outline-none">
            <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Tombol Aksi Utama (CTA 1)</Label>
                 <Input 
                   value={labels?.hero?.cta1 || ""} 
                   onChange={e => updateLabel("hero", "cta1", e.target.value)}
                   placeholder="Hubungi Kami" 
                   className="rounded-xl h-9" 
                 />
                 <p className="text-[10px] text-muted-foreground">Default: "Hubungi Kami"</p>
               </div>
               <div className="space-y-1.5">
                 <Label>Tombol Aksi Kedua (CTA 2)</Label>
                 <Input 
                   value={labels?.hero?.cta2 || ""} 
                   onChange={e => updateLabel("hero", "cta2", e.target.value)}
                   placeholder="Tentang Kami" 
                   className="rounded-xl h-9" 
                 />
                 <p className="text-[10px] text-muted-foreground">Default: "Tentang Kami"</p>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="programs" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Judul Bagian</Label>
                 <Input 
                   value={labels?.programs?.sectionTitle || ""} 
                   onChange={e => updateLabel("programs", "sectionTitle", e.target.value)}
                   placeholder="Program Keahlian Kami" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Teks Tombol Aksi</Label>
                 <Input 
                   value={labels?.programs?.buttonText || ""} 
                   onChange={e => updateLabel("programs", "buttonText", e.target.value)}
                   placeholder="Lihat Semua" 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
             <div className="space-y-1.5">
               <Label>Deskripsi Singkat</Label>
               <Input 
                 value={labels?.programs?.sectionSubtitle || ""} 
                 onChange={e => updateLabel("programs", "sectionSubtitle", e.target.value)}
                 placeholder="Berbagai program keahlian yang dirancang untuk membekali siswa dengan kompetensi profesional dan siap menghadapi dunia kerja." 
                 className="rounded-xl h-9" 
               />
             </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Judul Bagian</Label>
                 <Input 
                   value={labels?.staff?.sectionTitle || ""} 
                   onChange={e => updateLabel("staff", "sectionTitle", e.target.value)}
                   placeholder="Guru & Tenaga Kependidikan" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Teks Tombol Aksi</Label>
                 <Input 
                   value={labels?.staff?.buttonText || ""} 
                   onChange={e => updateLabel("staff", "buttonText", e.target.value)}
                   placeholder="Lihat Semua" 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
             <div className="space-y-1.5">
               <Label>Deskripsi Singkat</Label>
               <Input 
                 value={labels?.staff?.sectionSubtitle || ""} 
                 onChange={e => updateLabel("staff", "sectionSubtitle", e.target.value)}
                 placeholder="Tim pengajar profesional dan berdedikasi yang siap membimbing siswa menuju kesuksesan." 
                 className="rounded-xl h-9" 
               />
             </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Judul Bagian</Label>
                 <Input 
                   value={labels?.gallery?.sectionTitle || ""} 
                   onChange={e => updateLabel("gallery", "sectionTitle", e.target.value)}
                   placeholder="Dokumentasi Kami" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Teks Tombol Aksi</Label>
                 <Input 
                   value={labels?.gallery?.buttonText || ""} 
                   onChange={e => updateLabel("gallery", "buttonText", e.target.value)}
                   placeholder="Lihat Semua" 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
             <div className="space-y-1.5">
               <Label>Deskripsi Singkat</Label>
               <Input 
                 value={labels?.gallery?.sectionSubtitle || ""} 
                 onChange={e => updateLabel("gallery", "sectionSubtitle", e.target.value)}
                 placeholder="Kumpulan momen dan kegiatan berharga yang telah kami abadikan." 
                 className="rounded-xl h-9" 
               />
             </div>
          </TabsContent>

          <TabsContent value="other" className="space-y-6 outline-none">
             <div className="space-y-4">
               <h4 className="text-sm font-semibold">Bagian Kontak & Footer</h4>
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <Label>Judul Bagian Kontak</Label>
                   <Input 
                     value={labels?.contact?.sectionTitle || ""} 
                     onChange={e => updateLabel("contact", "sectionTitle", e.target.value)}
                     placeholder="Hubungi Kami" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Deskripsi Kontak</Label>
                   <Input 
                     value={labels?.contact?.sectionSubtitle || ""} 
                     onChange={e => updateLabel("contact", "sectionSubtitle", e.target.value)}
                     placeholder="Kami siap membantu Anda. Jangan ragu untuk menghubungi kami." 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Tombol WhatsApp</Label>
                   <Input 
                     value={labels?.contact?.btnWa || ""} 
                     onChange={e => updateLabel("contact", "btnWa", e.target.value)}
                     placeholder="Chat via WhatsApp" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Tombol Kirim Pesan</Label>
                   <Input 
                     value={labels?.contact?.btnEmail || ""} 
                     onChange={e => updateLabel("contact", "btnEmail", e.target.value)}
                     placeholder="Kirim Email" 
                     className="rounded-xl h-9" 
                   />
                 </div>
               </div>
             </div>
             
             <div className="space-y-4 border-t pt-4">
               <h4 className="text-sm font-semibold">Label Menu & Widget</h4>
               <div className="grid md:grid-cols-3 gap-4">
                 <div className="space-y-1.5">
                   <Label>Fasilitas</Label>
                   <Input 
                     value={labels?.widget?.facilities || ""} 
                     onChange={e => updateLabel("widget", "facilities", e.target.value)}
                     placeholder="Fasilitas Sekolah" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Ekstrakurikuler</Label>
                   <Input 
                     value={labels?.widget?.extracurriculars || ""} 
                     onChange={e => updateLabel("widget", "extracurriculars", e.target.value)}
                     placeholder="Kegiatan Ekstrakurikuler" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Prestasi</Label>
                   <Input 
                     value={labels?.widget?.achievements || ""} 
                     onChange={e => updateLabel("widget", "achievements", e.target.value)}
                     placeholder="Prestasi Membanggakan" 
                     className="rounded-xl h-9" 
                   />
                 </div>
               </div>
             </div>
             <div className="space-y-4 border-t pt-4 mt-6">
               <h4 className="text-sm font-semibold">Halaman Profil Lembaga (Call to Action)</h4>
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <Label>Judul Ajakan</Label>
                   <Input 
                     value={form.settings?.profilCtaTitle || ""} 
                     onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, profilCtaTitle: e.target.value } }))} 
                     placeholder="Jadilah Bagian dari Kami" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Deskripsi Ajakan</Label>
                   <textarea 
                     value={form.settings?.profilCtaDescription || ""} 
                     onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, profilCtaDescription: e.target.value } }))}
                     placeholder="Pintu kami selalu terbuka untuk Anda yang ingin berkonsultasi..." 
                     rows={3}
                     className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-y min-h-[36px]" 
                   />
                 </div>
               </div>
             </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
