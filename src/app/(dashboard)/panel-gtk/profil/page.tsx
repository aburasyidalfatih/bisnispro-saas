import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { User } from "lucide-react"
import { ProfilGTKForm } from "./_components/profil-gtk-form"

export default async function ProfilGTKPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const currentTenant = session.user.tenants?.[0]
  if (!currentTenant) redirect("/dashboard")

  // Ambil data staff berdasarkan userId
  const staff = await db.staff.findFirst({
    where: {
      tenantId: currentTenant.id,
      userId: session.user.id
    }
  })

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Profil Belum Ditautkan</h2>
        <p className="text-muted-foreground max-w-md">
          Akun Anda belum ditautkan dengan data Guru/Tenaga Kependidikan oleh Admin Sekolah. Silakan hubungi Admin untuk sinkronisasi data pertama kali.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto w-full pb-8">
      <ProfilGTKForm 
        staff={staff} 
        sessionImage={session.user.image || undefined}
        sessionEmail={session.user.email || undefined} 
      />
    </div>
  )
}
