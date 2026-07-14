import React from"react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Type } from"lucide-react"
import { AboutFormState } from"./types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs"
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
            <TabsTrigger value="facilities">Fasilitas</TabsTrigger>
            <TabsTrigger value="extracurriculars">Ekskul</TabsTrigger>
            <TabsTrigger value="news">Berita & Info</TabsTrigger>
            <TabsTrigger value="gallery">Galeri</TabsTrigger>
            <TabsTrigger value="profil">Profil</TabsTrigger>
            <TabsTrigger value="contact">Kontak</TabsTrigger>
            <TabsTrigger value="empty">Data Kosong</TabsTrigger>
            <TabsTrigger value="other">Lainnya</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="space-y-4 outline-none">
            <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Tombol Aksi Utama (CTA 1)</Label>
                 <Input 
                   value={labels?.hero?.cta1 ?? "Hubungi Kami"} onChange={e => updateLabel("hero","cta1", e.target.value)}
                   placeholder="Hubungi Kami" 
                   className="rounded-xl h-9" 
                 />
                 <p className="text-[10px] text-muted-foreground">Default:"Hubungi Kami"</p>
               </div>
               <div className="space-y-1.5">
                 <Label>Tombol Aksi Kedua (CTA 2)</Label>
                 <Input 
                   value={labels?.hero?.cta2 ?? "Tentang Kami"} onChange={e => updateLabel("hero","cta2", e.target.value)}
                   placeholder="Tentang Kami" 
                   className="rounded-xl h-9" 
                 />
                 <p className="text-[10px] text-muted-foreground">Default:"Tentang Kami"</p>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="programs" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Judul Bagian</Label>
                 <Input 
                   value={labels?.programs?.sectionTitle ?? "Program Keahlian Kami"} onChange={e => updateLabel("programs","sectionTitle", e.target.value)}
                   placeholder="Program Keahlian Kami" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Teks Tombol Aksi</Label>
                 <Input 
                   value={labels?.programs?.buttonText ?? "Lihat Semua"} onChange={e => updateLabel("programs","buttonText", e.target.value)}
                   placeholder="Lihat Semua" 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
             <div className="space-y-1.5">
               <Label>Deskripsi Singkat</Label>
               <Input 
                 value={labels?.programs?.sectionSubtitle ?? "Berbagai program keahlian yang dirancang untuk membekali siswa dengan kompetensi profesional dan siap menghadapi dunia kerja."} onChange={e => updateLabel("programs","sectionSubtitle", e.target.value)}
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
                   value={labels?.staff?.sectionTitle ?? "Guru & Tenaga Kependidikan"} onChange={e => updateLabel("staff","sectionTitle", e.target.value)}
                   placeholder="Guru & Tenaga Kependidikan" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Teks Tombol Aksi</Label>
                 <Input 
                   value={labels?.staff?.buttonText ?? "Lihat Semua"} onChange={e => updateLabel("staff","buttonText", e.target.value)}
                   placeholder="Lihat Semua" 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
             <div className="space-y-1.5">
               <Label>Deskripsi Singkat</Label>
               <Input 
                 value={labels?.staff?.sectionSubtitle ?? "Tim pengajar profesional dan berdedikasi yang siap membimbing siswa menuju kesuksesan."} onChange={e => updateLabel("staff","sectionSubtitle", e.target.value)}
                 placeholder="Tim pengajar profesional dan berdedikasi yang siap membimbing siswa menuju kesuksesan." 
                 className="rounded-xl h-9" 
               />
             </div>
           </TabsContent>

           <TabsContent value="facilities" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Judul Bagian</Label>
                 <Input 
                   value={labels?.facilities?.sectionTitle ?? "Fasilitas Sekolah"} onChange={e => updateLabel("facilities", "sectionTitle", e.target.value)}
                   placeholder="Fasilitas Sekolah" 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
             <div className="space-y-1.5">
               <Label>Deskripsi Singkat</Label>
               <Input 
                 value={labels?.facilities?.sectionSubtitle ?? "Sarana dan prasarana pendukung pendidikan berkualitas untuk kenyamanan seluruh siswa."} onChange={e => updateLabel("facilities", "sectionSubtitle", e.target.value)}
                 placeholder="Sarana dan prasarana pendukung pendidikan berkualitas untuk kenyamanan seluruh siswa." 
                 className="rounded-xl h-9" 
               />
             </div>
           </TabsContent>

           <TabsContent value="extracurriculars" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Judul Bagian</Label>
                 <Input 
                   value={labels?.extracurriculars?.sectionTitle ?? "Ekstrakurikuler"} onChange={e => updateLabel("extracurriculars", "sectionTitle", e.target.value)}
                   placeholder="Ekstrakurikuler" 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
             <div className="space-y-1.5">
               <Label>Deskripsi Singkat</Label>
               <Input 
                 value={labels?.extracurriculars?.sectionSubtitle ?? "Wadah bagi siswa untuk mengeksplorasi minat, mengasah kepemimpinan, dan membangun kerjasama."} onChange={e => updateLabel("extracurriculars", "sectionSubtitle", e.target.value)}
                 placeholder="Wadah bagi siswa untuk mengeksplorasi minat, mengasah kepemimpinan, dan membangun kerjasama." 
                 className="rounded-xl h-9" 
               />
             </div>
           </TabsContent>

           <TabsContent value="news" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Judul Bagian Berita</Label>
                 <Input 
                   value={labels?.news?.sectionTitle ?? "Artikel & Berita Terbaru"} onChange={e => updateLabel("news", "sectionTitle", e.target.value)}
                   placeholder="Artikel & Berita Terbaru" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Deskripsi Berita</Label>
                 <Input 
                   value={labels?.news?.sectionSubtitle ?? "Ikuti informasi terkini mengenai kegiatan, prestasi, dan pengumuman sekolah."} onChange={e => updateLabel("news", "sectionSubtitle", e.target.value)}
                   placeholder="Ikuti informasi terkini mengenai kegiatan, prestasi, dan pengumuman sekolah." 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
             <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
               <div className="space-y-1.5">
                 <Label>Judul Bagian Prestasi</Label>
                 <Input 
                   value={labels?.achievements?.sectionTitle ?? "Prestasi Membanggakan"} onChange={e => updateLabel("achievements", "sectionTitle", e.target.value)}
                   placeholder="Prestasi Membanggakan" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Deskripsi Prestasi</Label>
                 <Input 
                   value={labels?.achievements?.sectionSubtitle ?? "Apresiasi atas dedikasi dan kerja keras siswa-siswi."} onChange={e => updateLabel("achievements", "sectionSubtitle", e.target.value)}
                   placeholder="Apresiasi atas dedikasi dan kerja keras siswa-siswi." 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
             <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
               <div className="space-y-1.5">
                 <Label>Judul Bagian Agenda</Label>
                 <Input 
                   value={labels?.agenda?.sectionTitle ?? "Agenda Sekolah"} onChange={e => updateLabel("agenda", "sectionTitle", e.target.value)}
                   placeholder="Agenda Sekolah" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Deskripsi Agenda</Label>
                 <Input 
                   value={labels?.agenda?.sectionSubtitle ?? "Jadwal kegiatan akademik dan non-akademik di waktu mendatang."} onChange={e => updateLabel("agenda", "sectionSubtitle", e.target.value)}
                   placeholder="Jadwal kegiatan akademik dan non-akademik di waktu mendatang." 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
             <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
               <div className="space-y-1.5">
                 <Label>Judul Bagian Alumni</Label>
                 <Input 
                   value={labels?.alumni?.sectionTitle ?? "Jejak Alumni"} onChange={e => updateLabel("alumni", "sectionTitle", e.target.value)}
                   placeholder="Jejak Alumni" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Deskripsi Alumni</Label>
                 <Input 
                   value={labels?.alumni?.sectionSubtitle ?? "Kisah inspiratif para lulusan yang telah berkiprah di masyarakat."} onChange={e => updateLabel("alumni", "sectionSubtitle", e.target.value)}
                   placeholder="Kisah inspiratif para lulusan yang telah berkiprah di masyarakat." 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
             <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
               <div className="space-y-1.5">
                 <Label>Judul Pengumuman</Label>
                 <Input 
                   value={labels?.pengumuman?.sectionTitle ?? "Papan Pengumuman"} onChange={e => updateLabel("pengumuman", "sectionTitle", e.target.value)}
                   placeholder="Papan Pengumuman" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Deskripsi Pengumuman</Label>
                 <Input 
                   value={labels?.pengumuman?.sectionSubtitle ?? "Informasi resmi dan edaran penting dari sekolah."} onChange={e => updateLabel("pengumuman", "sectionSubtitle", e.target.value)}
                   placeholder="Informasi resmi dan edaran penting dari sekolah." 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
           </TabsContent>

          <TabsContent value="gallery" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Judul Bagian</Label>
                 <Input 
                   value={labels?.gallery?.sectionTitle ?? "Dokumentasi Kami"} onChange={e => updateLabel("gallery","sectionTitle", e.target.value)}
                   placeholder="Dokumentasi Kami" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Teks Tombol Aksi</Label>
                 <Input 
                   value={labels?.gallery?.buttonText ?? "Lihat Semua"} onChange={e => updateLabel("gallery","buttonText", e.target.value)}
                   placeholder="Lihat Semua" 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
             <div className="space-y-1.5">
               <Label>Deskripsi Singkat</Label>
               <Input 
                 value={labels?.gallery?.sectionSubtitle ?? "Kumpulan momen dan kegiatan berharga yang telah kami abadikan."} onChange={e => updateLabel("gallery","sectionSubtitle", e.target.value)}
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
                     value={labels?.contact?.sectionTitle ?? "Hubungi Kami"} onChange={e => updateLabel("contact","sectionTitle", e.target.value)}
                     placeholder="Hubungi Kami" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Deskripsi Kontak</Label>
                   <Input 
                     value={labels?.contact?.sectionSubtitle ?? "Kami siap membantu Anda. Jangan ragu untuk menghubungi kami."} onChange={e => updateLabel("contact","sectionSubtitle", e.target.value)}
                     placeholder="Kami siap membantu Anda. Jangan ragu untuk menghubungi kami." 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Tombol WhatsApp</Label>
                   <Input 
                     value={labels?.contact?.btnWa ?? "Chat via WhatsApp"} onChange={e => updateLabel("contact","btnWa", e.target.value)}
                     placeholder="Chat via WhatsApp" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Tombol Kirim Pesan</Label>
                   <Input 
                     value={labels?.contact?.btnEmail ?? "Kirim Email"} onChange={e => updateLabel("contact","btnEmail", e.target.value)}
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
                     value={labels?.widget?.facilities ?? "Fasilitas Sekolah"} onChange={e => updateLabel("widget","facilities", e.target.value)}
                     placeholder="Fasilitas Sekolah" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Ekstrakurikuler</Label>
                   <Input 
                     value={labels?.widget?.extracurriculars ?? "Kegiatan Ekstrakurikuler"} onChange={e => updateLabel("widget","extracurriculars", e.target.value)}
                     placeholder="Kegiatan Ekstrakurikuler" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Prestasi</Label>
                   <Input 
                     value={labels?.widget?.achievements ?? "Prestasi Membanggakan"} onChange={e => updateLabel("widget","achievements", e.target.value)}
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
                     value={form.settings?.profilCtaTitle ?? "Jadilah Bagian dari Kami"} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, profilCtaTitle: e.target.value } }))} 
                     placeholder="Jadilah Bagian dari Kami" 
                     className="rounded-xl h-9" 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label>Deskripsi Ajakan</Label>
                   <Textarea 
                     value={form.settings?.profilCtaDescription ?? "Pintu kami selalu terbuka untuk Anda yang ingin berkonsultasi..."} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, profilCtaDescription: e.target.value } }))}
                     placeholder="Pintu kami selalu terbuka untuk Anda yang ingin berkonsultasi..." 
                     rows={3}
                     className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-y min-h-[36px]" 
                   />
                 </div>
               </div>
             </div>
           </TabsContent>

           <TabsContent value="profil" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Teks Default Sejarah</Label>
                 <Input 
                   value={labels?.profil?.defaultAbout ?? "Belum ada informasi profil sejarah sekolah."} onChange={e => updateLabel("profil","defaultAbout", e.target.value)}
                   placeholder="Belum ada informasi profil sejarah sekolah." 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Badge Sejarah</Label>
                 <Input 
                   value={labels?.profil?.historyBadge ?? "Sejarah Sekolah"} onChange={e => updateLabel("profil","historyBadge", e.target.value)}
                   placeholder="Sejarah Sekolah" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Judul Visi & Misi</Label>
                 <Input 
                   value={labels?.profil?.visiMisiTitle ?? "Visi & Misi"} onChange={e => updateLabel("profil","visiMisiTitle", e.target.value)}
                   placeholder="Visi & Misi" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Deskripsi Visi & Misi</Label>
                 <Input 
                   value={labels?.profil?.visiMisiDesc ?? "Arah langkah dan pedoman kami dalam menyelenggarakan pendidikan unggul."} onChange={e => updateLabel("profil","visiMisiDesc", e.target.value)}
                   placeholder="Arah langkah dan pedoman kami dalam menyelenggarakan pendidikan unggul." 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Label Statistik 1 (Pengajar)</Label>
                 <Input 
                   value={labels?.profil?.stat1 ?? "Tenaga Pendidik"} onChange={e => updateLabel("profil","stat1", e.target.value)}
                   placeholder="Tenaga Pendidik" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Label Statistik 2 (Alumni)</Label>
                 <Input 
                   value={labels?.profil?.stat2 ?? "Lulusan Sukses"} onChange={e => updateLabel("profil","stat2", e.target.value)}
                   placeholder="Lulusan Sukses" 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
           </TabsContent>

           <TabsContent value="contact" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Judul Kontak</Label>
                 <Input 
                   value={labels?.contact?.title ?? "Hubungi Kami"} onChange={e => updateLabel("contact","title", e.target.value)}
                   placeholder="Hubungi Kami" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Judul Form</Label>
                 <Input 
                   value={labels?.contact?.formTitle ?? "Kirim Pesan"} onChange={e => updateLabel("contact","formTitle", e.target.value)}
                   placeholder="Kirim Pesan" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Label Nama Lengkap</Label>
                 <Input 
                   value={labels?.contact?.labelName ?? "Nama Lengkap"} onChange={e => updateLabel("contact","labelName", e.target.value)}
                   placeholder="Nama Lengkap" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Tombol Submit Form</Label>
                 <Input 
                   value={labels?.contact?.btnSubmit ?? "Kirim Pesan Sekarang"} onChange={e => updateLabel("contact","btnSubmit", e.target.value)}
                   placeholder="Kirim Pesan Sekarang" 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
           </TabsContent>

           <TabsContent value="empty" className="space-y-4 outline-none">
             <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Fasilitas Kosong (Judul)</Label>
                 <Input 
                   value={labels?.empty?.facilitiesTitle ?? "Fasilitas Belum Tersedia"} onChange={e => updateLabel("empty","facilitiesTitle", e.target.value)}
                   placeholder="Fasilitas Belum Tersedia" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Fasilitas Kosong (Deskripsi)</Label>
                 <Input 
                   value={labels?.empty?.facilitiesDesc ?? "Daftar fasilitas dan sarana prasarana sekolah..."} onChange={e => updateLabel("empty","facilitiesDesc", e.target.value)}
                   placeholder="Daftar fasilitas dan sarana prasarana sekolah..." 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Program Kosong (Judul)</Label>
                 <Input 
                   value={labels?.empty?.programsTitle ?? "Data Program Belum Tersedia"} onChange={e => updateLabel("empty","programsTitle", e.target.value)}
                   placeholder="Data Program Belum Tersedia" 
                   className="rounded-xl h-9" 
                 />
               </div>
               <div className="space-y-1.5">
                 <Label>Berita Kosong (Judul)</Label>
                 <Input 
                   value={labels?.empty?.newsTitle ?? "Berita Belum Tersedia"} onChange={e => updateLabel("empty","newsTitle", e.target.value)}
                   placeholder="Berita Belum Tersedia" 
                   className="rounded-xl h-9" 
                 />
               </div>
             </div>
           </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
