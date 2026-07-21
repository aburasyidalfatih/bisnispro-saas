import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { MonitorSmartphone, ExternalLink, QrCode, PlayCircle, Settings, Users, BookOpen, Crown, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import SchoolTvClient from "./_components/school-tv-client"

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
  const sessionTenant = (session?.user as any)?.tenants?.[0]
  if (!sessionTenant?.id) return redirect("/login")

  const tenant = await db.tenant.findUnique({
    where: { id: sessionTenant.id },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      settings: true
    }
  })

  if (!tenant || !tenant.slug) return redirect("/login")
  
  const tvUrl = getTvUrl(tenant.slug)
  
  // Check feature access
  const plan = tenant.plan?.toLowerCase() || "free"
  const setting = await db.platformSetting.findUnique({
    where: { key: "PLAN_FEATURE_ACCESS" }
  })
  const allPlans = setting?.value ? JSON.parse(setting.value) : {}
  const planAccess = allPlans[plan] || {}

  const isPremium = ["pro", "lite", "premium"].includes(plan)

  if (!isPremium || !planAccess.school_tv) {
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

  const staff = await db.staff.findMany({
    where: {
      tenantId: tenant.id,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      role: true
    },
    orderBy: {
      name: 'asc'
    }
  })

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

      <SchoolTvClient 
        initialSettings={tenant.settings || {}}
        tenantSlug={tenant.slug}
        tvUrl={tvUrl}
        staffList={staff}
      />
    </div>
  )
}
