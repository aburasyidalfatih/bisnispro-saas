import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { MonitorSmartphone, ExternalLink, QrCode, PlayCircle, Settings, Users, BookOpen, Crown, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "School TV Display | SchoolPro",
}

function getTvUrl(slug: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://schoolpro.id"
  try {
    const url = new URL(appUrl)
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return `${url.protocol}//${slug}.localhost:${url.port || '3000'}/tv`
    }
    return `${url.protocol}//${slug}.${url.hostname.replace(/^www\./, "")}/tv`
  } catch {
    return `https://${slug}.schoolpro.id/tv`
  }
}

export default async function SchoolTvSettingsPage() {
  const session = await auth()
  const tenant = session?.user?.tenants?.[0]
  if (!tenant) return redirect("/login")
  
  const tvUrl = getTvUrl(tenant.slug)
  const isPremium = ["pro", "lite", "premium"].includes(tenant.plan?.toLowerCase() || "")

  if (!isPremium) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 pt-12 text-center">
        <div className="h-24 w-24 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 border-4 border-amber-500/20">
          <MonitorSmartphone className="h-12 w-12 text-amber-500" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Fitur Terkunci (Premium)</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
          Fitur <strong className="text-foreground">School TV Digital Signage</strong> ini dirancang khusus untuk memajang informasi jadwal kelas dan profil sekolah Anda di lobi menggunakan Smart TV.
          <br/><br/>
          Fitur eksklusif ini hanya tersedia untuk <b>Paket Lite</b> dan <b>Paket Pro</b>. Silakan *upgrade* layanan Anda untuk membuka kunci fitur ini.
        </p>
        <Link href="/admin/billing">
          <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-full shadow-lg shadow-amber-500/30 group">
            <Crown className="h-5 w-5 mr-2" />
            Upgrade Sekarang
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MonitorSmartphone className="h-8 w-8 text-emerald-500" />
            School TV Display
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Pusat informasi digital interaktif untuk lobi dan koridor sekolah Anda.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Access Link */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <PlayCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Layar TV Sekolah Aktif</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Hubungkan komputer mini atau Smart TV di lobi sekolah ke URL di bawah ini, dan tekan <b>F11</b> untuk memutar layar penuh.
              </p>
            </div>
            
            <div className="bg-muted p-3 rounded-lg w-full flex items-center justify-center border font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
              {tvUrl}
            </div>

            <Link href={tvUrl} target="_blank" className="w-full">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="lg">
                <ExternalLink className="h-4 w-4 mr-2" />
                Buka TV Display Sekarang
              </Button>
            </Link>
          </div>
        </div>

        {/* Card 2: Features Info */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Fitur Otomatis Layar TV
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Jadwal Kelas Real-Time</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Sistem secara otomatis menampilkan kelas yang sedang belajar menit ini juga.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Guru Piket Dinamis</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Menarik data 2 guru yang sedang tidak ada jam mengajar secara acak untuk bertugas hari ini.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <QrCode className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Barcode Donasi (QR)</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Otomatis menampilkan QR Code donasi jika Anda memiliki kampanye yang sedang aktif.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground italic text-center">
                * Konfigurasi Teks Berjalan (Marquee) akan tersedia pada pembaruan berikutnya. Saat ini sistem memutar teks sambutan sekolah secara otomatis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
