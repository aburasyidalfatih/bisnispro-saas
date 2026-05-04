import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { RevisionForm } from "./_components/revision-form"
import Link from "next/link"
import { ArrowLeft, CheckCircle } from "lucide-react"

export default async function RevisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const application = await db.tenantApplication.findUnique({
    where: { id }
  })

  if (!application) {
    return notFound()
  }

  if (application.status !== "REVISION") {
    return (
      <div className="min-h-screen bg-mesh py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center space-y-6 glass p-12 rounded-3xl">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Status Pengajuan Tidak Berlaku</h1>
          <p className="text-muted-foreground text-lg">
            Pengajuan sekolah Anda saat ini berstatus <strong>{application.status}</strong>. 
            Halaman revisi hanya tersedia untuk pengajuan yang dikembalikan oleh admin.
          </p>
          <div className="pt-6">
            <Link href="/" className="inline-flex items-center text-primary font-semibold hover:underline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mesh py-12 px-4 md:py-20">
      <div className="container mx-auto">
        <div className="text-center space-y-4 mb-10">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Revisi <span className="text-gradient">Data Pengajuan</span></h1>
          <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
            Silakan perbaiki data pendaftaran sekolah Anda sesuai dengan catatan yang diberikan oleh tim verifikasi kami.
          </p>
        </div>

        <RevisionForm application={application} />
      </div>
    </div>
  )
}
