"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, User, Users, School, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const STEPS = [
  { id: 1, title: "Data Siswa", icon: User, desc: "Informasi pribadi calon siswa" },
  { id: 2, title: "Data Orang Tua", icon: Users, desc: "Informasi ayah, ibu, dan wali" },
  { id: 3, title: "Asal Sekolah", icon: School, desc: "Riwayat pendidikan sebelumnya" },
]

export default function PpdbFormulirPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [applicant, setApplicant] = useState<any>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Step 1: Data Siswa
  const [dataSiswa, setDataSiswa] = useState({
    nisn: "",
    jenisKelamin: "",
    tempatLahir: "",
    tanggalLahir: "",
    agama: "",
    kewarganegaraan: "WNI",
    alamat: "",
    kelurahan: "",
    kecamatan: "",
    kabupaten: "",
    provinsi: "",
    telepon: "",
    tinggiBadan: "",
    beratBadan: "",
    kebutuhanKhusus: "",
  })

  // Step 2: Data Orang Tua
  const [dataOrangtua, setDataOrangtua] = useState({
    namaAyah: "",
    pekerjaanAyah: "",
    pendidikanAyah: "",
    teleponAyah: "",
    namaIbu: "",
    pekerjaanIbu: "",
    pendidikanIbu: "",
    teleponIbu: "",
    namaWali: "",
    hubunganWali: "",
    teleponWali: "",
    penghasilanOrtu: "",
  })

  // Step 3: Asal Sekolah
  const [dataSekolah, setDataSekolah] = useState({
    namaSekolahAsal: "",
    nisn: "",
    alamatSekolahAsal: "",
    tahunLulus: "",
    nilaiRata: "",
    prestasiAkademik: "",
    prestasiNonAkademik: "",
  })

  useEffect(() => {
    fetch(`/api/ppdb/pendaftar/${id}`)
      .then(r => r.json())
      .then(data => {
        setApplicant(data)
        // Cek localStorage
        const draftStr = localStorage.getItem(`ppdb_draft_${id}`)
        if (draftStr) {
           try {
             const draft = JSON.parse(draftStr)
             setDataSiswa(draft.dataSiswa || dataSiswa)
             setDataOrangtua(draft.dataOrangtua || dataOrangtua)
             setDataSekolah(draft.dataSekolah || dataSekolah)
             setLastSaved(new Date())
           } catch(e) {}
        } else {
           if (data.dataFormulir) setDataSiswa({ ...dataSiswa, ...data.dataFormulir })
           if (data.dataOrangtua) {
             const d = data.dataOrangtua as any
             setDataOrangtua({ ...dataOrangtua, ...d })
             setDataSekolah({ ...dataSekolah, ...d.sekolah })
           }
        }
      })
      .catch(() => {})
  }, [id])

  // Auto-save effect
  useEffect(() => {
    if (!applicant) return
    const timer = setTimeout(() => {
       const draft = { dataSiswa, dataOrangtua, dataSekolah }
       localStorage.setItem(`ppdb_draft_${id}`, JSON.stringify(draft))
       setLastSaved(new Date())
    }, 1500)
    return () => clearTimeout(timer)
  }, [dataSiswa, dataOrangtua, dataSekolah, id, applicant])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/ppdb/pendaftar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataFormulir: { ...dataSiswa },
          dataOrangtua: {
            ...dataOrangtua,
            sekolah: { ...dataSekolah }
          }
        })
      })

      if (res.ok) {
        toast({ title: "Formulir Tersimpan!", description: "Data Anda berhasil disimpan. Lanjutkan ke tahap upload berkas." })
        router.push(`/dashboard/ppdb/portal/status/${id}`)
      } else {
        toast({ title: "Gagal", description: "Terjadi kesalahan saat menyimpan.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Koneksi gagal.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const isStepValid = () => {
    if (currentStep === 1) return dataSiswa.nisn && dataSiswa.jenisKelamin && dataSiswa.tanggalLahir && dataSiswa.alamat
    if (currentStep === 2) return dataOrangtua.namaAyah && dataOrangtua.namaIbu
    return true
  }

  return (
    <div className="pb-10 font-sans">
      {/* Top Header Mobile Style */}
      <div className="bg-primary rounded-b-[2.5rem] pt-6 pb-24 px-6 relative z-0">
        <div className="flex items-center gap-3 text-primary-foreground mb-4">
          <Link href={`/dashboard/ppdb/portal/status/${id}`} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
             <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-bold text-lg">Formulir Pendaftaran</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm flex items-center flex-wrap gap-2">
          <span className="truncate max-w-[150px]">{applicant?.namaLengkap}</span> · <span className="font-mono text-[10px]">{applicant?.noPendaftaran}</span>
          {lastSaved && (
            <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium animate-pulse whitespace-nowrap">
              Disimpan {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </p>
      </div>

      <div className="-mt-14 relative z-10 px-5 space-y-6">
        {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1">
            <button
              onClick={() => currentStep > step.id && setCurrentStep(step.id)}
              className="flex items-center gap-3 group"
            >
              <div className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center border-2 font-bold text-sm shrink-0 transition-all",
                currentStep > step.id ? "bg-emerald-500 border-emerald-500 text-white" :
                currentStep === step.id ? "bg-primary border-primary text-white shadow-lg shadow-primary/30" :
                "border-muted-foreground/30 text-muted-foreground"
              )}>
                {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
              </div>
              <div className="text-left hidden sm:block">
                <p className={cn("text-xs font-bold leading-none", currentStep === step.id ? "text-foreground" : "text-muted-foreground")}>{step.title}</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5 hidden md:block">{step.desc}</p>
              </div>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={cn("h-0.5 flex-1 mx-3 rounded", currentStep > step.id + 1 || (currentStep > step.id) ? "bg-emerald-400" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <Card className="glass border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
          <div className="flex items-center gap-3">
            {(() => { const Icon = STEPS[currentStep - 1].icon; return <Icon className="h-5 w-5 text-primary" /> })()}
            <div>
              <CardTitle className="text-base">{STEPS[currentStep - 1].title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{STEPS[currentStep - 1].desc}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">

          {/* STEP 1: Data Siswa */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="NISN" required>
                  <Input placeholder="1234567890" value={dataSiswa.nisn} onChange={e => setDataSiswa({...dataSiswa, nisn: e.target.value})} className="rounded-xl" />
                </FormField>
                <FormField label="Jenis Kelamin" required>
                  <Select value={dataSiswa.jenisKelamin} onValueChange={v => setDataSiswa({...dataSiswa, jenisKelamin: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Tempat Lahir">
                  <Input placeholder="Kota kelahiran" value={dataSiswa.tempatLahir} onChange={e => setDataSiswa({...dataSiswa, tempatLahir: e.target.value})} className="rounded-xl" />
                </FormField>
                <FormField label="Tanggal Lahir" required>
                  <Input type="date" value={dataSiswa.tanggalLahir} onChange={e => setDataSiswa({...dataSiswa, tanggalLahir: e.target.value})} className="rounded-xl" />
                </FormField>
                <FormField label="Agama">
                  <Select value={dataSiswa.agama} onValueChange={v => setDataSiswa({...dataSiswa, agama: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih agama..." /></SelectTrigger>
                    <SelectContent>
                      {["Islam","Kristen","Katolik","Hindu","Buddha","Konghucu"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="No. Telepon Siswa">
                  <Input placeholder="08xxxxxxxxxx" value={dataSiswa.telepon} onChange={e => setDataSiswa({...dataSiswa, telepon: e.target.value})} className="rounded-xl" />
                </FormField>
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Alamat Lengkap</p>
                <div className="space-y-4">
                  <FormField label="Jalan / RT / RW" required>
                    <Textarea placeholder="Jl. Contoh No. 1, RT 01/02" value={dataSiswa.alamat} onChange={e => setDataSiswa({...dataSiswa, alamat: e.target.value})} className="rounded-xl resize-none" rows={2} />
                  </FormField>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Kelurahan">
                      <Input placeholder="Nama kelurahan" value={dataSiswa.kelurahan} onChange={e => setDataSiswa({...dataSiswa, kelurahan: e.target.value})} className="rounded-xl" />
                    </FormField>
                    <FormField label="Kecamatan">
                      <Input placeholder="Nama kecamatan" value={dataSiswa.kecamatan} onChange={e => setDataSiswa({...dataSiswa, kecamatan: e.target.value})} className="rounded-xl" />
                    </FormField>
                    <FormField label="Kabupaten/Kota">
                      <Input placeholder="Nama kabupaten/kota" value={dataSiswa.kabupaten} onChange={e => setDataSiswa({...dataSiswa, kabupaten: e.target.value})} className="rounded-xl" />
                    </FormField>
                    <FormField label="Provinsi">
                      <Input placeholder="Nama provinsi" value={dataSiswa.provinsi} onChange={e => setDataSiswa({...dataSiswa, provinsi: e.target.value})} className="rounded-xl" />
                    </FormField>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Data Orang Tua */}
          {currentStep === 2 && (
            <div className="space-y-8">
              {/* Ayah */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[9px] font-bold text-blue-600">A</div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data Ayah</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField label="Nama Ayah" required>
                    <Input placeholder="Nama lengkap ayah" value={dataOrangtua.namaAyah} onChange={e => setDataOrangtua({...dataOrangtua, namaAyah: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="No. HP Ayah">
                    <Input placeholder="08xxxxxxxxxx" value={dataOrangtua.teleponAyah} onChange={e => setDataOrangtua({...dataOrangtua, teleponAyah: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="Pekerjaan Ayah">
                    <Input placeholder="Pekerjaan" value={dataOrangtua.pekerjaanAyah} onChange={e => setDataOrangtua({...dataOrangtua, pekerjaanAyah: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="Pendidikan Terakhir">
                    <Select value={dataOrangtua.pendidikanAyah} onValueChange={v => setDataOrangtua({...dataOrangtua, pendidikanAyah: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                      <SelectContent>
                        {["SD","SMP","SMA/SMK","D3","S1","S2","S3","Lainnya"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </div>

              {/* Ibu */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-5 rounded-full bg-pink-500/20 flex items-center justify-center text-[9px] font-bold text-pink-600">I</div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data Ibu</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField label="Nama Ibu" required>
                    <Input placeholder="Nama lengkap ibu" value={dataOrangtua.namaIbu} onChange={e => setDataOrangtua({...dataOrangtua, namaIbu: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="No. HP Ibu">
                    <Input placeholder="08xxxxxxxxxx" value={dataOrangtua.teleponIbu} onChange={e => setDataOrangtua({...dataOrangtua, teleponIbu: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="Pekerjaan Ibu">
                    <Input placeholder="Pekerjaan" value={dataOrangtua.pekerjaanIbu} onChange={e => setDataOrangtua({...dataOrangtua, pekerjaanIbu: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="Pendidikan Terakhir">
                    <Select value={dataOrangtua.pendidikanIbu} onValueChange={v => setDataOrangtua({...dataOrangtua, pendidikanIbu: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                      <SelectContent>
                        {["SD","SMP","SMA/SMK","D3","S1","S2","S3","Lainnya"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </div>

              {/* Wali */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[9px] font-bold text-violet-600">W</div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data Wali <span className="normal-case font-normal">(opsional, isi jika berbeda)</span></p>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <FormField label="Nama Wali">
                    <Input placeholder="Nama wali" value={dataOrangtua.namaWali} onChange={e => setDataOrangtua({...dataOrangtua, namaWali: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="Hubungan">
                    <Input placeholder="Paman, Bibi, dll." value={dataOrangtua.hubunganWali} onChange={e => setDataOrangtua({...dataOrangtua, hubunganWali: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="No. HP Wali">
                    <Input placeholder="08xxxxxxxxxx" value={dataOrangtua.teleponWali} onChange={e => setDataOrangtua({...dataOrangtua, teleponWali: e.target.value})} className="rounded-xl" />
                  </FormField>
                </div>
              </div>

              {/* Penghasilan */}
              <div className="pt-4 border-t border-border/50">
                <FormField label="Penghasilan Orang Tua per Bulan">
                  <Select value={dataOrangtua.penghasilanOrtu} onValueChange={v => setDataOrangtua({...dataOrangtua, penghasilanOrtu: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih range penghasilan..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="&lt; Rp 1.000.000">{"< Rp 1.000.000"}</SelectItem>
                      <SelectItem value="Rp 1.000.000 - Rp 3.000.000">Rp 1.000.000 - Rp 3.000.000</SelectItem>
                      <SelectItem value="Rp 3.000.000 - Rp 5.000.000">Rp 3.000.000 - Rp 5.000.000</SelectItem>
                      <SelectItem value="Rp 5.000.000 - Rp 10.000.000">Rp 5.000.000 - Rp 10.000.000</SelectItem>
                      <SelectItem value="&gt; Rp 10.000.000">{"> Rp 10.000.000"}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </div>
          )}

          {/* STEP 3: Asal Sekolah */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="Nama Sekolah Asal">
                  <Input placeholder="SDN / MIN / SD Contoh" value={dataSekolah.namaSekolahAsal} onChange={e => setDataSekolah({...dataSekolah, namaSekolahAsal: e.target.value})} className="rounded-xl" />
                </FormField>
                <FormField label="Tahun Lulus">
                  <Input type="number" placeholder="2024" value={dataSekolah.tahunLulus} onChange={e => setDataSekolah({...dataSekolah, tahunLulus: e.target.value})} className="rounded-xl" />
                </FormField>
                <FormField label="Nilai Rata-rata Rapor">
                  <Input type="number" step="0.01" placeholder="85.50" value={dataSekolah.nilaiRata} onChange={e => setDataSekolah({...dataSekolah, nilaiRata: e.target.value})} className="rounded-xl" />
                </FormField>
                <FormField label="NISN (Sekolah Asal)">
                  <Input placeholder="Nomor NISN" value={dataSekolah.nisn} onChange={e => setDataSekolah({...dataSekolah, nisn: e.target.value})} className="rounded-xl" />
                </FormField>
              </div>
              <FormField label="Alamat Sekolah Asal">
                <Textarea placeholder="Alamat lengkap sekolah asal..." value={dataSekolah.alamatSekolahAsal} onChange={e => setDataSekolah({...dataSekolah, alamatSekolahAsal: e.target.value})} className="rounded-xl resize-none" rows={2} />
              </FormField>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="Prestasi Akademik">
                  <Textarea placeholder="Contoh: Juara 1 OSN Matematika Tingkat Kota 2023" value={dataSekolah.prestasiAkademik} onChange={e => setDataSekolah({...dataSekolah, prestasiAkademik: e.target.value})} className="rounded-xl resize-none" rows={3} />
                </FormField>
                <FormField label="Prestasi Non-Akademik">
                  <Textarea placeholder="Contoh: Juara 2 Lomba Futsal Antar Sekolah 2023" value={dataSekolah.prestasiNonAkademik} onChange={e => setDataSekolah({...dataSekolah, prestasiNonAkademik: e.target.value})} className="rounded-xl resize-none" rows={3} />
                </FormField>
              </div>

              {/* Summary sebelum submit */}
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Siap Disimpan</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pastikan semua data yang Anda isi sudah benar. Setelah menyimpan, Anda akan lanjut ke tahap <b>Upload Berkas</b>.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          className="rounded-xl px-6"
          onClick={() => currentStep > 1 ? setCurrentStep(s => s - 1) : router.push(`/dashboard/ppdb/portal/status/${id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentStep === 1 ? "Batal" : "Kembali"}
        </Button>

        {currentStep < STEPS.length ? (
          <Button
            className="rounded-xl px-8 btn-gradient text-white border-0 shadow-lg shadow-primary/20 group"
            onClick={() => setCurrentStep(s => s + 1)}
            disabled={!isStepValid()}
          >
            Lanjutkan
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        ) : (
          <Button
            className="rounded-xl px-8 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-500/20 group"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Menyimpan..." : <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Simpan Formulir
            </>}
          </Button>
        )}
      </div>
      </div>
    </div>
  )
}

function FormField({ label, required, children }: { label: string, required?: boolean, children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
