import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Type } from "lucide-react"
import { AboutFormState } from "./types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

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
            <TabsTrigger value="facilities">Kantor & Cabang</TabsTrigger>
            <TabsTrigger value="extracurriculars">Layanan</TabsTrigger>
            <TabsTrigger value="news">Berita & Info</TabsTrigger>
            <TabsTrigger value="gallery">Galeri</TabsTrigger>
            <TabsTrigger value="other">Lainnya</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="space-y-4 outline-none">
            <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Tombol Aksi Utama (CTA 1)</Label>
                 <Input 
                   value={labels?.hero?.cta1 ?? ""} 
                   onChange={e => updateLabel("hero", "cta1", e.target.value)}
                   placeholder="Hubungi Kami" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Tombol Aksi Kedua (CTA 2)</Label>
                 <Input 
                   value={labels?.hero?.cta2 ?? ""} 
                   onChange={e => updateLabel("hero", "cta2", e.target.value)}
                   placeholder="Tentang Kami" 
                   className="rounded-xl h-9" 
                 />
               </div>
            </div>
          </TabsContent>

          <TabsContent value="programs" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Judul Bagian</Label>
                 <Input 
                   value={labels?.programs?.sectionTitle ?? ""} 
                   onChange={e => updateLabel("programs", "sectionTitle", e.target.value)}
                   placeholder="Program Keahlian Kami" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Tombol Lihat Semua</Label>
                 <Input 
                   value={labels?.programs?.buttonText ?? ""} 
                   onChange={e => updateLabel("programs", "buttonText", e.target.value)}
                   placeholder="Lihat Semua" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5 md:col-span-2">
                 <Label>Deskripsi Singkat</Label>
                 <Textarea 
                   value={labels?.programs?.sectionSubtitle ?? ""} 
                   onChange={e => updateLabel("programs", "sectionSubtitle", e.target.value)}
                   placeholder="Berbagai program keahlian yang dirancang untuk..." 
                   className="rounded-xl resize-none"
                   rows={2}
                 />
               </div>
             </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Judul Bagian</Label>
                 <Input 
                   value={labels?.staff?.sectionTitle ?? ""} 
                   onChange={e => updateLabel("staff", "sectionTitle", e.target.value)}
                   placeholder="Staf & Tenaga Kependidikan" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Tombol Lihat Semua</Label>
                 <Input 
                   value={labels?.staff?.buttonText ?? ""} 
                   onChange={e => updateLabel("staff", "buttonText", e.target.value)}
                   placeholder="Lihat Semua" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5 md:col-span-2">
                 <Label>Deskripsi Singkat</Label>
                 <Textarea 
                   value={labels?.staff?.sectionSubtitle ?? ""} 
                   onChange={e => updateLabel("staff", "sectionSubtitle", e.target.value)}
                   placeholder="Tim pengajar profesional dan berdedikasi..." 
                   className="rounded-xl resize-none"
                   rows={2}
                 />
               </div>
             </div>
          </TabsContent>

          <TabsContent value="facilities" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5 md:col-span-2">
                 <Label>Judul Bagian</Label>
                 <Input 
                   value={labels?.facilities?.sectionTitle ?? ""} 
                   onChange={e => updateLabel("facilities", "sectionTitle", e.target.value)}
                   placeholder="Kantor & Cabang" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5 md:col-span-2">
                 <Label>Deskripsi Singkat</Label>
                 <Textarea 
                   value={labels?.facilities?.sectionSubtitle ?? ""} 
                   onChange={e => updateLabel("facilities", "sectionSubtitle", e.target.value)}
                   placeholder="Fasilitas kantor dan cabang pendukung operasional..." 
                   className="rounded-xl resize-none"
                   rows={2}
                 />
               </div>
             </div>
          </TabsContent>

          <TabsContent value="extracurriculars" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5 md:col-span-2">
                 <Label>Judul Bagian</Label>
                 <Input 
                   value={labels?.extracurriculars?.sectionTitle ?? ""} 
                   onChange={e => updateLabel("extracurriculars", "sectionTitle", e.target.value)}
                   placeholder="Layanan Perusahaan" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5 md:col-span-2">
                 <Label>Deskripsi Singkat</Label>
                 <Textarea 
                   value={labels?.extracurriculars?.sectionSubtitle ?? ""} 
                   onChange={e => updateLabel("extracurriculars", "sectionSubtitle", e.target.value)}
                   placeholder="Berbagai layanan unggulan yang kami tawarkan..." 
                   className="rounded-xl resize-none"
                   rows={2}
                 />
               </div>
             </div>
          </TabsContent>

          <TabsContent value="news" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5 md:col-span-2">
                 <Label>Judul Bagian Berita/Artikel</Label>
                 <Input 
                   value={labels?.news?.sectionTitle ?? ""} 
                   onChange={e => updateLabel("news", "sectionTitle", e.target.value)}
                   placeholder="Artikel & Berita Terbaru" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5 md:col-span-2">
                 <Label>Deskripsi Singkat Berita/Artikel</Label>
                 <Textarea 
                   value={labels?.news?.sectionSubtitle ?? ""} 
                   onChange={e => updateLabel("news", "sectionSubtitle", e.target.value)}
                   placeholder="Ikuti informasi terkini mengenai kegiatan..." 
                   className="rounded-xl resize-none"
                   rows={2}
                 />
               </div>
               <div className="space-y-1.5 md:col-span-2">
                 <Label>Judul Bagian Prestasi</Label>
                 <Input 
                   value={labels?.achievements?.sectionTitle ?? ""} 
                   onChange={e => updateLabel("achievements", "sectionTitle", e.target.value)}
                   placeholder="Prestasi Membanggakan" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5 md:col-span-2">
                 <Label>Deskripsi Singkat Prestasi</Label>
                 <Textarea 
                   value={labels?.achievements?.sectionSubtitle ?? ""} 
                   onChange={e => updateLabel("achievements", "sectionSubtitle", e.target.value)}
                   placeholder="Apresiasi atas dedikasi dan kerja keras..." 
                   className="rounded-xl resize-none"
                   rows={2}
                 />
               </div>
               <div className="space-y-1.5 md:col-span-2">
                 <Label>Judul Bagian Pengumuman</Label>
                 <Input 
                   value={labels?.pengumuman?.sectionTitle ?? ""} 
                   onChange={e => updateLabel("pengumuman", "sectionTitle", e.target.value)}
                   placeholder="Papan Pengumuman" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5 md:col-span-2">
                 <Label>Deskripsi Singkat Pengumuman</Label>
                 <Textarea 
                   value={labels?.pengumuman?.sectionSubtitle ?? ""} 
                   onChange={e => updateLabel("pengumuman", "sectionSubtitle", e.target.value)}
                   placeholder="Informasi resmi dan edaran penting dari perusahaan." 
                   className="rounded-xl resize-none"
                   rows={2}
                 />
               </div>
             </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Judul Bagian</Label>
                 <Input 
                   value={labels?.gallery?.sectionTitle ?? ""} 
                   onChange={e => updateLabel("gallery", "sectionTitle", e.target.value)}
                   placeholder="Dokumentasi Kami" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Tombol Lihat Semua</Label>
                 <Input 
                   value={labels?.gallery?.buttonText ?? ""} 
                   onChange={e => updateLabel("gallery", "buttonText", e.target.value)}
                   placeholder="Lihat Semua" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5 md:col-span-2">
                 <Label>Deskripsi Singkat</Label>
                 <Textarea 
                   value={labels?.gallery?.sectionSubtitle ?? ""} 
                   onChange={e => updateLabel("gallery", "sectionSubtitle", e.target.value)}
                   placeholder="Kumpulan momen dan kegiatan berharga..." 
                   className="rounded-xl resize-none"
                   rows={2}
                 />
               </div>
             </div>
          </TabsContent>

          <TabsContent value="other" className="space-y-4 outline-none">
             <div className="space-y-4">
               <h3 className="font-medium text-sm">Halaman Profil</h3>
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <Label>Badge Sejarah</Label>
                   <Input 
                     value={labels?.profil?.historyBadge ?? ""} 
                     onChange={e => updateLabel("profil", "historyBadge", e.target.value)}
                     placeholder="Sejarah Perusahaan" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Judul Visi & Misi</Label>
                   <Input 
                     value={labels?.profil?.visiMisiTitle ?? ""} 
                     onChange={e => updateLabel("profil", "visiMisiTitle", e.target.value)}
                     placeholder="Visi & Misi" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5 md:col-span-2">
                   <Label>Deskripsi Visi & Misi</Label>
                   <Textarea 
                     value={labels?.profil?.visiMisiDesc ?? ""} 
                     onChange={e => updateLabel("profil", "visiMisiDesc", e.target.value)}
                     placeholder="Arah langkah dan pedoman kami..." 
                     className="rounded-xl resize-none"
                     rows={2}
                   />
                 </div>
                 <div className="space-y-1.5 md:col-span-2">
                   <Label>Teks Default Sejarah (Jika Kosong)</Label>
                   <Textarea 
                     value={labels?.profil?.defaultAbout ?? ""} 
                     onChange={e => updateLabel("profil", "defaultAbout", e.target.value)}
                     placeholder="Belum ada informasi profil sejarah perusahaan." 
                     className="rounded-xl resize-none"
                     rows={2}
                   />
                 </div>
               </div>

               <h3 className="font-medium text-sm pt-4 border-t">Halaman Kontak</h3>
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <Label>Judul Halaman Kontak</Label>
                   <Input 
                     value={labels?.contact?.title ?? ""} 
                     onChange={e => updateLabel("contact", "title", e.target.value)}
                     placeholder="Hubungi Kami" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Judul Form Pesan</Label>
                   <Input 
                     value={labels?.contact?.formTitle ?? ""} 
                     onChange={e => updateLabel("contact", "formTitle", e.target.value)}
                     placeholder="Kirim Pesan" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Tombol WhatsApp</Label>
                   <Input 
                     value={labels?.contact?.btnWa ?? ""} 
                     onChange={e => updateLabel("contact", "btnWa", e.target.value)}
                     placeholder="Chat via WhatsApp" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Tombol Kirim Pesan</Label>
                   <Input 
                     value={labels?.contact?.btnSubmit ?? ""} 
                     onChange={e => updateLabel("contact", "btnSubmit", e.target.value)}
                     placeholder="Kirim Pesan Sekarang" 
                     className="rounded-xl h-9" 
                   />
                 </div>
               </div>

               <h3 className="font-medium text-sm pt-4 border-t">Teks Data Kosong (Empty State)</h3>
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <Label>Kantor & Cabang Kosong</Label>
                   <Input 
                     value={labels?.empty?.facilitiesTitle ?? ""} 
                     onChange={e => updateLabel("empty", "facilitiesTitle", e.target.value)}
                     placeholder="Kantor & Cabang Belum Tersedia" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Program Kosong</Label>
                   <Input 
                     value={labels?.empty?.programsTitle ?? ""} 
                     onChange={e => updateLabel("empty", "programsTitle", e.target.value)}
                     placeholder="Data Program Belum Tersedia" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Berita Kosong</Label>
                   <Input 
                     value={labels?.empty?.newsTitle ?? ""} 
                     onChange={e => updateLabel("empty", "newsTitle", e.target.value)}
                     placeholder="Berita Belum Tersedia" 
                     className="rounded-xl h-9" 
                   />
                 </div>
               </div>

               <h3 className="font-medium text-sm pt-4 border-t">Label Widget Halaman Utama</h3>
               <div className="grid md:grid-cols-3 gap-4">
                 <div className="space-y-1.5">
                   <Label>Kantor & Cabang</Label>
                   <Input 
                     value={labels?.widget?.facilities ?? ""} 
                     onChange={e => updateLabel("widget", "facilities", e.target.value)}
                     placeholder="Kantor & Cabang" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Layanan</Label>
                   <Input 
                     value={labels?.widget?.extracurriculars ?? ""} 
                     onChange={e => updateLabel("widget", "extracurriculars", e.target.value)}
                     placeholder="Layanan Perusahaan" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Prestasi</Label>
                   <Input 
                     value={labels?.widget?.achievements ?? ""} 
                     onChange={e => updateLabel("widget", "achievements", e.target.value)}
                     placeholder="Prestasi Membanggakan" 
                     className="rounded-xl h-9" 
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
