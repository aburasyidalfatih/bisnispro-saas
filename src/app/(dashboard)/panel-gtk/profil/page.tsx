import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Phone, BookOpen, GraduationCap, Info, User, Briefcase } from "lucide-react"

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
          Akun Anda belum ditautkan dengan data Guru/Tenaga Kependidikan oleh Admin Sekolah. Silakan hubungi Admin untuk sinkronisasi data.
        </p>
      </div>
    )
  }

  const initials = staff.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 pb-8">
      {/* Header Profile */}
      <Card className="glass border-0 shadow-lg shadow-primary/5 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent absolute top-0 left-0 right-0" />
        <CardContent className="pt-16 pb-8 px-6 relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl">
            <AvatarImage src={staff.imageUrl || session.user.image || ""} alt={staff.name} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 mt-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{staff.name}</h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold tracking-wide">
                {staff.role}
              </span>
            </div>
            {staff.bio && (
              <p className="text-sm text-muted-foreground mt-4 max-w-xl leading-relaxed">
                {staff.bio}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informasi Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kontak */}
        <Card className="glass border-0 shadow-md">
          <CardHeader className="pb-4 border-b border-border/50">
            <h3 className="font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Informasi Kontak
            </h3>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Email</p>
                <p className="text-sm font-medium">{staff.email || session.user.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Nomor Telepon</p>
                <p className="text-sm font-medium">{staff.phone || "Belum diatur"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Akademik */}
        <Card className="glass border-0 shadow-md">
          <CardHeader className="pb-4 border-b border-border/50">
            <h3 className="font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Data Akademik
            </h3>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Mata Pelajaran</p>
                <p className="text-sm font-medium">{staff.subject || "Belum diatur"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Pendidikan Terakhir</p>
                <p className="text-sm font-medium">{staff.education || "Belum diatur"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Badge */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-600/90 dark:text-blue-400 leading-relaxed">
          <strong>Pemberitahuan:</strong> Data profil ini disinkronisasi secara terpusat. Jika terdapat kesalahan informasi pada data akademik atau kontak, silakan hubungi Admin Sekolah Anda untuk melakukan pembaruan.
        </p>
      </div>
    </div>
  )
}
