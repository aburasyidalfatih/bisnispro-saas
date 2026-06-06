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
import { StepDataSiswa } from "./_components/step-data-siswa"
import { StepDataOrangtua } from "./_components/step-data-orangtua"
import { StepAsalSekolah } from "./_components/step-asal-sekolah"

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

  // Step 1: Data Siswa & Alamat
  const [dataSiswa, setDataSiswa] = useState({
    jenisPendaftaran: "Siswa Baru",
    nisn: "",
    nik: "",
    jenisKelamin: "",
    tempatLahir: "",
    tanggalLahir: "",
    noRegistrasiAkta: "",
    agama: "",
    kewarganegaraan: "WNI",
    anakKe: "",
    kebutuhanKhusus: "Tidak",
    alamat: "",
    rtRw: "",
    dusun: "",
    kelurahan: "",
    kecamatan: "",
    kabupaten: "",
    provinsi: "",
    kodePos: "",
    lintang: "",
    bujur: "",
    tempatTinggal: "",
    modaTransportasi: "",
    telepon: "",
    emailPribadi: "",
    tinggiBadan: "",
    beratBadan: "",
  })

  // Step 2: Data Orang Tua
  const [dataOrangtua, setDataOrangtua] = useState({
    namaAyah: "",
    nikAyah: "",
    tahunLahirAyah: "",
    pendidikanAyah: "",
    pekerjaanAyah: "",
    penghasilanAyah: "",
    kebutuhanKhususAyah: "Tidak",
    teleponAyah: "",
    namaIbu: "",
    nikIbu: "",
    tahunLahirIbu: "",
    pendidikanIbu: "",
    pekerjaanIbu: "",
    penghasilanIbu: "",
    kebutuhanKhususIbu: "Tidak",
    teleponIbu: "",
    namaWali: "",
    nikWali: "",
    tahunLahirWali: "",
    pendidikanWali: "",
    pekerjaanWali: "",
    penghasilanWali: "",
    hubunganWali: "",
    teleponWali: "",
    penghasilanOrtuGabungan: "",
  })

  // Step 3: Asal Sekolah
  const [dataSekolah, setDataSekolah] = useState({
    namaSekolahAsal: "",
    npsnSekolahAsal: "",
    alamatSekolahAsal: "",
    tahunLulus: "",
    nomorPesertaUjian: "",
    nomorIjazah: "",
    nomorSKHUN: "",
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
        router.push(`/ortu/ppdb/status/${id}`)
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
    if (currentStep === 1) return dataSiswa.nisn && dataSiswa.nik && dataSiswa.jenisKelamin && dataSiswa.tanggalLahir && dataSiswa.alamat
    if (currentStep === 2) return dataOrangtua.namaAyah && dataOrangtua.namaIbu
    return true
  }

  return (
    <div className="pb-10 font-sans">
      {/* Top Header Mobile Style */}
      <div className="bg-primary rounded-b-[2.5rem] pt-6 pb-24 px-6 relative z-0">
        <div className="flex items-center gap-3 text-primary-foreground mb-4">
          <Link href={`/ortu/ppdb/status/${id}`} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
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
          {currentStep === 1 && <StepDataSiswa dataSiswa={dataSiswa} setDataSiswa={setDataSiswa} />}

          {/* STEP 2: Data Orang Tua */}
          {currentStep === 2 && <StepDataOrangtua dataOrangtua={dataOrangtua} setDataOrangtua={setDataOrangtua} />}

          {/* STEP 3: Asal Sekolah */}
          {currentStep === 3 && <StepAsalSekolah dataSekolah={dataSekolah} setDataSekolah={setDataSekolah} />}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          className="rounded-xl px-6"
          onClick={() => currentStep > 1 ? setCurrentStep(s => s - 1) : router.push(`/ortu/ppdb/status/${id}`)}
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


function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
