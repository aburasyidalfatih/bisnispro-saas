"use client"

import { useEffect, useState, use, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft, CheckCircle, UploadCloud, FileText, X,
  Loader2, AlertCircle, ExternalLink, ArrowRight
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"

interface Requirement {
  id: string
  nama: string
  isWajib: boolean
  tipeFile: string | null
}

interface UploadedFile {
  id: string
  requirementId: string
  fileUrl: string
  status: string // MENUNGGU, DITERIMA, DITOLAK
}

export default function PpdbBerkasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()

  const [applicant, setApplicant] = useState<any>(null)
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Fetch applicant + requirements + berkas
  const fetchData = async () => {
    setLoading(true)
    try {
      const applicantRes = await fetch(`/api/ppdb/pendaftar/${id}`)
      const applicantData = await applicantRes.json()
      setApplicant(applicantData)

      if (applicantData?.periodeId) {
        const [reqRes, berkasRes] = await Promise.all([
          fetch(`/api/ppdb/persyaratan?periodeId=${applicantData.periodeId}`),
          fetch(`/api/ppdb/berkas?pendaftarId=${id}`)
        ])
        const [reqs, berkas] = await Promise.all([reqRes.json(), berkasRes.json()])
        setRequirements(Array.isArray(reqs) ? reqs : [])
        setUploadedFiles(Array.isArray(berkas) ? berkas : [])
      }
    } catch (e) {
      toast({ title: "Gagal memuat data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const getUploaded = (reqId: string) => uploadedFiles.find(f => f.requirementId === reqId)

  const handleFileSelect = async (requirementId: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 10MB per file", variant: "destructive" })
      return
    }

    setUploadingId(requirementId)
    try {
      // 1. Upload file ke storage
      const tenantId = session?.user?.tenants?.[0]?.id
      const fd = new FormData()
      fd.append("file", file)
      fd.append("tenantId", tenantId || "")
      fd.append("subDir", "ppdb-berkas")

      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok || !uploadData.url) throw new Error(uploadData.error || "Upload gagal")

      // 2. Simpan URL ke database
      const saveRes = await fetch("/api/ppdb/berkas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendaftarId: id, requirementId, fileUrl: uploadData.url })
      })

      if (!saveRes.ok) throw new Error("Gagal menyimpan berkas")

      toast({ title: "Berhasil!", description: "Berkas berhasil diunggah" })
      fetchData() // Refresh list
    } catch (err: any) {
      toast({ title: "Gagal mengunggah", description: err.message, variant: "destructive" })
    } finally {
      setUploadingId(null)
      // Reset input
      const input = fileInputRefs.current[requirementId]
      if (input) input.value = ""
    }
  }

  const handleDelete = async (berkasId: string) => {
    try {
      await fetch(`/api/ppdb/berkas?id=${berkasId}`, { method: "DELETE" })
      toast({ title: "Berkas dihapus" })
      fetchData()
    } catch {
      toast({ title: "Gagal menghapus", variant: "destructive" })
    }
  }

  const handleFinish = () => {
    // Cek semua berkas wajib sudah diupload
    const missingRequired = requirements.filter(r => r.isWajib && !getUploaded(r.id))
    if (missingRequired.length > 0) {
      toast({
        title: "Berkas belum lengkap",
        description: `Masih ada ${missingRequired.length} berkas wajib yang belum diunggah.`,
        variant: "destructive"
      })
      return
    }
    toast({ title: "Berkas selesai!", description: "Semua berkas sudah diunggah. Menunggu verifikasi panitia." })
    router.push(`/ortu/ppdb/status/${id}`)
  }

  const uploadedCount = requirements.filter(r => getUploaded(r.id)).length
  const requiredCount = requirements.filter(r => r.isWajib).length
  const uploadedRequiredCount = requirements.filter(r => r.isWajib && getUploaded(r.id)).length
  const allRequiredDone = uploadedRequiredCount >= requiredCount

  const isImage = (url: string) => /\.(jpg|jpeg|png|webp|gif)$/i.test(url)

  if (loading) {
    return (
      <div className="pb-10 font-sans">
        <div className="bg-primary rounded-b-[2.5rem] pt-6 pb-24 px-6 relative z-0">
          <div className="h-8 w-32 skeleton bg-white/20 rounded-full" />
        </div>
        <div className="-mt-14 relative z-10 px-5 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl skeleton" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="pb-10 font-sans">
      {/* Top Header Mobile Style */}
      <div className="bg-primary rounded-b-[2.5rem] pt-6 pb-24 px-6 relative z-0">
        <div className="flex items-center gap-3 text-primary-foreground mb-4">
          <Link href={`/ortu/ppdb/status/${id}`} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
             <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-bold text-lg">Upload Berkas</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm flex items-center gap-2">
          <span className="truncate max-w-[150px]">{applicant?.namaLengkap}</span> · <span className="font-mono text-[10px]">{applicant?.noPendaftaran}</span>
        </p>
      </div>

      <div className="-mt-14 relative z-10 px-5 space-y-6">

      {/* Progress Bar */}
      <Card className="glass border-0">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Progress Upload</p>
            <p className="text-sm font-bold text-primary">{uploadedCount} / {requirements.length} berkas</p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: requirements.length > 0 ? `${(uploadedCount / requirements.length) * 100}%` : "0%" }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
            <span>{uploadedRequiredCount} dari {requiredCount} berkas wajib selesai</span>
            {allRequiredDone && (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Semua wajib terpenuhi
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* No requirements state */}
      {requirements.length === 0 ? (
        <Card className="glass border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="font-semibold text-muted-foreground">Belum ada persyaratan berkas</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Admin belum mengatur persyaratan untuk gelombang ini.
            </p>
            <Button className="mt-6 rounded-xl" variant="outline" onClick={() => router.push(`/ortu/ppdb/status/${id}`)}>
              Kembali ke Status
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requirements.map((req, idx) => {
            const uploaded = getUploaded(req.id)
            const isUploading = uploadingId === req.id
            const statusColor = uploaded
              ? uploaded.status === "DITERIMA" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : uploaded.status === "DITOLAK" ? "bg-red-500/10 text-red-600 border-red-500/20"
              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              : ""

            return (
              <Card key={req.id} className={cn(
                "glass border-0 overflow-hidden transition-all",
                uploaded ? "ring-1 ring-emerald-500/20" : ""
              )}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Number / Status */}
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm",
                      uploaded
                        ? uploaded.status === "DITERIMA" ? "bg-emerald-500 text-white"
                        : uploaded.status === "DITOLAK" ? "bg-red-500 text-white"
                        : "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {uploaded
                        ? uploaded.status === "DITERIMA" ? <CheckCircle className="h-4 w-4" />
                        : uploaded.status === "DITOLAK" ? <X className="h-4 w-4" />
                        : <FileText className="h-4 w-4" />
                        : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{req.nama}</p>
                        {req.isWajib ? (
                          <Badge variant="outline" className="text-[10px] text-red-500 border-red-200">Wajib</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">Opsional</Badge>
                        )}
                        {uploaded && (
                          <Badge className={cn("text-[10px]", statusColor)}>{uploaded.status}</Badge>
                        )}
                      </div>
                      {req.tipeFile && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{req.tipeFile}</p>
                      )}

                      {/* Preview file */}
                      {uploaded && (
                        <div className="mt-3 rounded-xl border overflow-hidden bg-muted/30">
                          {isImage(uploaded.fileUrl) ? (
                            <div className="relative group">
                              <img
                                src={uploaded.fileUrl}
                                alt={req.nama}
                                className="w-full max-h-40 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a href={uploaded.fileUrl} target="_blank" rel="noreferrer">
                                  <Button size="sm" variant="secondary" className="rounded-lg h-7 text-xs gap-1">
                                    <ExternalLink className="h-3 w-3" /> Buka
                                  </Button>
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">Berkas diunggah</p>
                                <p className="text-[10px] text-muted-foreground truncate">{uploaded.fileUrl.split("/").pop()}</p>
                              </div>
                              <a href={uploaded.fileUrl} target="_blank" rel="noreferrer">
                                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Input
                      ref={el => { fileInputRefs.current[req.id] = el }}
                      type="file"
                      accept={req.tipeFile || "image/*,application/pdf"}
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.[0]) handleFileSelect(req.id, e.target.files[0])
                      }}
                    />
                    <Button
                      variant={uploaded ? "outline" : "default"}
                      size="sm"
                      className={cn(
                        "rounded-xl flex-1 gap-2 text-xs h-9",
                        !uploaded && "btn-gradient text-white border-0"
                      )}
                      onClick={() => fileInputRefs.current[req.id]?.click()}
                      disabled={isUploading || uploaded?.status === "DITERIMA"}
                    >
                      {isUploading ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengunggah...</>
                      ) : uploaded ? (
                        <><UploadCloud className="h-3.5 w-3.5" /> Ganti File</>
                      ) : (
                        <><UploadCloud className="h-3.5 w-3.5" /> Upload Berkas</>
                      )}
                    </Button>
                    {uploaded && uploaded.status !== "DITERIMA" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(uploaded.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {uploaded?.status === "DITOLAK" && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600">Berkas ditolak oleh panitia. Silakan unggah ulang dengan file yang sesuai.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Footer CTA */}
      {requirements.length > 0 && (
        <div className="space-y-3">
          {!allRequiredDone && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <b>{requiredCount - uploadedRequiredCount} berkas wajib</b> belum diunggah. Lengkapi semua untuk melanjutkan.
              </p>
            </div>
          )}
          <Button
            className={cn(
              "w-full h-12 rounded-xl font-bold gap-2 text-white border-0",
              allRequiredDone ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20" : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            onClick={handleFinish}
            disabled={!allRequiredDone}
          >
            {allRequiredDone
              ? <><CheckCircle className="h-5 w-5" /> Selesai & Lanjutkan</>
              : <>Lengkapi Semua Berkas Wajib ({uploadedRequiredCount}/{requiredCount})</>
            }
          </Button>
          {allRequiredDone && (
            <p className="text-center text-xs text-muted-foreground">
              Berkas Anda akan diverifikasi oleh panitia PPDB dalam 1-3 hari kerja.
            </p>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
