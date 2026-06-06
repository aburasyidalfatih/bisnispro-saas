"use client"

import { useState, useEffect } from"react"
import { useRouter } from"next/navigation"
import { useSession } from"next-auth/react"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { Textarea } from"@/components/ui/textarea"
import { ArrowLeft, ArrowRight, User, Users, CheckCircle, Loader2 } from"lucide-react"
import { useToast } from"@/hooks/use-toast"
import Link from"next/link"
import { cn } from"@/lib/utils"

const STEPS = [
  { id: 1, title:"Data Siswa", icon: User, desc:"Informasi identitas dan pribadi" },
  { id: 2, title:"Data Orang Tua & Kelas", icon: Users, desc:"Informasi orang tua dan penempatan kelas" },
]

export default function AddStudentManualPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [classrooms, setClassrooms] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name:"",
    nis:"",
    nisn:"",
    gender:"",
    birthPlace:"",
    birthDate:"",
    address:"",
    phone:"",
    email:"",
    fatherName:"",
    motherName:"",
    guardianName:"",
    classroomId:"none",
  })

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/classrooms?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(setClassrooms)
      .catch(() => {})
  }, [tenantId])

  const handleSubmit = async () => {
    if (!tenantId) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/students", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({
          tenantId,
          ...formData,
          classroomId: formData.classroomId ==="none" ? undefined : formData.classroomId
        }),
      })

      if (res.ok) {
        toast({ title:"Berhasil!", description:"Data siswa baru berhasil ditambahkan secara manual." })
        router.push("/admin/students")
      } else {
        const error = await res.json()
        toast({ title:"Gagal Menyimpan", description: error.error ||"Terjadi kesalahan.", variant:"destructive" })
      }
    } catch {
      toast({ title:"Error", description:"Gagal terhubung ke server.", variant:"destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const isStepValid = () => {
    if (currentStep === 1) return formData.name && formData.gender
    return true
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/students">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Tambah Data Siswa (Manual)</h1>
          <p className="text-sm text-muted-foreground">Isi formulir berikut untuk menambahkan siswa baru secara langsung.</p>
        </div>
      </div>

      <div className="relative z-10 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-0">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                className="flex items-center gap-3 group"
              >
                <div className={cn("h-9 w-9 rounded-full flex items-center justify-center border-2 font-bold text-sm shrink-0 transition-all",
                  currentStep > step.id ?"bg-emerald-500 border-emerald-500 text-white" :
                  currentStep === step.id ?"bg-primary border-primary text-white shadow-lg shadow-primary/30" :"border-muted-foreground/30 text-muted-foreground"
                )}>
                  {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                </div>
                <div className="text-left hidden sm:block">
                  <p className={cn("text-xs font-bold leading-none", currentStep === step.id ?"text-foreground" :"text-muted-foreground")}>{step.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-none mt-0.5 hidden md:block">{step.desc}</p>
                </div>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={cn("h-0.5 flex-1 mx-3 rounded", currentStep > step.id + 1 || (currentStep > step.id) ?"bg-emerald-400" :"bg-muted")} />
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
                  <FormField label="Nama Lengkap" required>
                    <Input placeholder="Nama lengkap siswa" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="Jenis Kelamin" required>
                    <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="NIS">
                    <Input placeholder="Nomor Induk Siswa" value={formData.nis} onChange={e => setFormData({...formData, nis: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="NISN">
                    <Input placeholder="10 Digit NISN" value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} className="rounded-xl" maxLength={10} />
                  </FormField>
                  
                  <FormField label="Tempat Lahir">
                    <Input placeholder="Kota/Kab kelahiran" value={formData.birthPlace} onChange={e => setFormData({...formData, birthPlace: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="Tanggal Lahir">
                    <Input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="rounded-xl" />
                  </FormField>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <div className="space-y-4">
                    <FormField label="Alamat Lengkap">
                      <Textarea placeholder="Jl. Merdeka No 1, RT 01/02..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-xl resize-none" rows={3} />
                    </FormField>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 grid md:grid-cols-2 gap-4">
                  <FormField label="No. HP / WhatsApp Siswa">
                    <Input placeholder="08xxxxxxxxxx" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="Email Siswa">
                    <Input type="email" placeholder="siswa@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl" />
                  </FormField>
                </div>
              </div>
            )}

            {/* STEP 2: Data Orang Tua & Kelas */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField label="Nama Ayah">
                    <Input placeholder="Nama ayah kandung" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="Nama Ibu">
                    <Input placeholder="Nama ibu kandung" value={formData.motherName} onChange={e => setFormData({...formData, motherName: e.target.value})} className="rounded-xl" />
                  </FormField>
                  <FormField label="Nama Wali (Opsional)">
                    <Input placeholder="Nama wali" value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} className="rounded-xl" />
                  </FormField>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4" /> Penempatan Kelas</h4>
                  <FormField label="Pilih Kelas">
                    <Select value={formData.classroomId} onValueChange={v => setFormData({...formData, classroomId: v})}>
                      <SelectTrigger className="rounded-xl md:w-1/2"><SelectValue placeholder="Belum ada kelas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Belum ada kelas --</SelectItem>
                        {classrooms.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                {/* Summary sebelum submit */}
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3 mt-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Siap Disimpan</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pastikan semua data identitas siswa sudah benar. Setelah ini, data akan langsung masuk ke tabel utama siswa.
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
            onClick={() => currentStep > 1 ? setCurrentStep(s => s - 1) : router.push("/admin/students")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep === 1 ?"Batal" :"Kembali"}
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
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              {submitting ?"Menyimpan..." :"Simpan Data Siswa"}
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

function BookOpen(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
