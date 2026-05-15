"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Globe, ExternalLink, Users, FileText, Image, Phone,
  Briefcase, Info, LayoutTemplate, ArrowRight, Eye, Trophy,
  CheckCircle, AlertCircle, ShieldCheck, ShieldOff, Download,
  Building2, Award, GraduationCap, Activity, Megaphone, BookOpen,
  BarChart3, MessageSquare, SlidersHorizontal, Handshake, CalendarDays
} from "lucide-react"
import { cn, getRootDomain } from "@/lib/utils"
import Link from "next/link"

interface WebsiteData {
  name: string
  tagline: string
  description: string
  about: string
  logo: string | null
  heroImage: string | null
  address: string | null
  phone: string | null
  email: string | null
  whatsapp: string | null
  instagram: string | null
  facebook: string | null
  youtube: string | null
  services: any[] | null
  gallery: any[] | null
  domain: string | null
  customDomain: { status: string } | null
  _count?: {
    posts: number
    documents: number
    facilities: number
    staff: number
    achievements: number
    alumni: number
    extracurriculars: number
    programs: number
    popups: number
    sliders: number
    events: number
    partnerships: number
    contactSubmissions: number
  }
}

interface StatItem {
  label: string
  value: string | number
  icon: React.ReactNode
  status?: "ok" | "warn" | "empty"
  href: string
}

export default function WebsiteOverviewPage() {
  const { data: session } = useSession()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [data, setData] = useState<WebsiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [rootDomain, setRootDomain] = useState("")
  const [appUrl, setAppUrl] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      let host = window.location.host
      let protocol = window.location.protocol
      setAppUrl(`${protocol}//${host}`)
      setRootDomain(getRootDomain())
    }
  }, [])

  // Resolve tenantId
  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    const s = session?.user?.tenants?.[0]?.slug
    if (id) { setTenantId(id); setSlug(s || null); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const impSlug = match?.[1]
    if (impSlug) {
      setSlug(impSlug)
      fetch(`/api/tenant/by-slug?slug=${impSlug}`)
        .then(r => r.json())
        .then(d => { if (d.id) setTenantId(d.id) })
    }
  }, [session?.user?.tenants])

  // Load website data + domain
  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      fetch(`/api/tenant/website?tenantId=${tenantId}`).then(r => r.json()),
      fetch(`/api/tenant/domain?tenantId=${tenantId}`).then(r => r.json()).catch(() => ({})),
    ]).then(([website, domain]) => {
      setData({ ...website, domain: domain.domain || null, customDomain: domain.customDomain || null })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [tenantId])

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="skeleton h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    )
  }

  const base = "/admin/website"

  // Priority: custom domain (verified) → subdomain → fallback /site/[slug]
  const customDomainUrl = data?.customDomain?.status === "verified" && data.domain
    ? `https://${data.domain}` : null
  const subdomainUrl = slug ? `http://${slug}.${rootDomain}` : null
  const fallbackUrl = slug ? `${appUrl}/site/${slug}` : null
  const websiteUrl = customDomainUrl || subdomainUrl || fallbackUrl

  const getColStatus = (count?: number | null): "ok" | "warn" | "empty" => {
    if (!count || count === 0) return "empty"
    if (count >= 5) return "ok"
    return "warn"
  }

  // Hitung kelengkapan konten
  const sections: StatItem[] = [
    {
      label: "Profil Lembaga",
      value: data?.about ? "Lengkap" : "Belum diisi",
      icon: <Info className="h-5 w-5" />,
      status: data?.about ? "ok" : "empty",
      href: `${base}/about`,
    },
    {
      label: "Artikel & Pos",
      value: data?._count?.posts ? `${data._count.posts} postingan` : "Belum ada",
      icon: <FileText className="h-5 w-5" />,
      status: getColStatus(data?._count?.posts),
      href: `${base}/posts`,
    },

    {
      label: "Galeri",
      value: Array.isArray(data?.gallery) && data.gallery.length > 0 ? `${data.gallery.length} foto` : "Belum ada",
      icon: <Image className="h-5 w-5" />,
      status: getColStatus(data?.gallery?.length),
      href: `${base}/gallery`,
    },
    {
      label: "Pusat Unduhan",
      value: data?._count?.documents ? `${data._count.documents} dokumen` : "Belum ada",
      icon: <Download className="h-5 w-5" />,
      status: getColStatus(data?._count?.documents),
      href: `${base}/documents`,
    },
    {
      label: "Fasilitas",
      value: data?._count?.facilities ? `${data._count.facilities} fasilitas` : "Belum ada",
      icon: <Building2 className="h-5 w-5" />,
      status: getColStatus(data?._count?.facilities),
      href: `${base}/facilities`,
    },
    {
      label: "Guru & Staf (GTK)",
      value: data?._count?.staff ? `${data._count.staff} profil` : "Belum ada",
      icon: <Users className="h-5 w-5" />,
      status: getColStatus(data?._count?.staff),
      href: `${base}/gtk`,
    },
    {
      label: "Prestasi Siswa",
      value: data?._count?.achievements ? `${data._count.achievements} prestasi` : "Belum ada",
      icon: <Award className="h-5 w-5" />,
      status: getColStatus(data?._count?.achievements),
      href: `${base}/achievements`,
    },
    {
      label: "Alumni Success",
      value: data?._count?.alumni ? `${data._count.alumni} alumni` : "Belum ada",
      icon: <GraduationCap className="h-5 w-5" />,
      status: getColStatus(data?._count?.alumni),
      href: `${base}/alumni`,
    },
    {
      label: "Ekstrakurikuler",
      value: data?._count?.extracurriculars ? `${data._count.extracurriculars} kegiatan` : "Belum ada",
      icon: <Activity className="h-5 w-5" />,
      status: getColStatus(data?._count?.extracurriculars),
      href: `${base}/extracurriculars`,
    },
    {
      label: "Program Unggulan",
      value: data?._count?.programs ? `${data._count.programs} program` : "Belum ada",
      icon: <BookOpen className="h-5 w-5" />,
      status: getColStatus(data?._count?.programs),
      href: `${base}/programs`,
    },
    {
      label: "Popup Pengumuman",
      value: data?._count?.popups ? `${data._count.popups} banner` : "Belum ada",
      icon: <Megaphone className="h-5 w-5" />,
      status: data?._count?.popups && data._count.popups > 0 ? "ok" : "empty",
      href: `${base}/popups`,
    },
    {
      label: "Hero Slider",
      value: data?._count?.sliders ? `${data._count.sliders} slide` : "Belum ada",
      icon: <SlidersHorizontal className="h-5 w-5" />,
      status: getColStatus(data?._count?.sliders),
      href: `${base}/sliders`,
    },
    {
      label: "Mitra Kerjasama",
      value: data?._count?.partnerships ? `${data._count.partnerships} mitra` : "Belum ada",
      icon: <Handshake className="h-5 w-5" />,
      status: getColStatus(data?._count?.partnerships),
      href: `${base}/partners`,
    },
    {
      label: "Agenda Kegiatan",
      value: data?._count?.events ? `${data._count.events} agenda` : "Belum ada",
      icon: <CalendarDays className="h-5 w-5" />,
      status: getColStatus(data?._count?.events),
      href: `${base}/events`,
    },
  ]

  const filledCount = sections.filter(s => s.status !== "empty").length
  const completionPct = Math.round((filledCount / sections.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Website</h1>
          <p className="text-muted-foreground mt-1">Ringkasan dan status konten website Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/website/leaderboard">
            <Button variant="outline" className="gap-2 border-yellow-500 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-500 dark:bg-yellow-500/10">
              <Trophy className="h-4 w-4" /> Leaderboard Nasional
            </Button>
          </Link>
          {websiteUrl && (
            <a href={websiteUrl} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Lihat Website
            </a>
          )}
        </div>
      </div>

      {/* Domain status + completion — top row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Domain card */}
        <Card className="glass border-0">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Domain Aktif</p>
                  <p className="text-sm font-semibold font-mono truncate max-w-[160px]">
                    {customDomainUrl
                      ? data?.domain
                      : slug ? `${slug}.${rootDomain}` : "—"}
                  </p>
                </div>
              </div>
              {data?.customDomain ? (
                data.customDomain.status === "verified"
                  ? <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  : <ShieldOff className="h-4 w-4 text-amber-500 shrink-0" />
              ) : null}
            </div>
            {data?.domain && data.customDomain?.status !== "verified" && (
              <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Domain belum diverifikasi
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href="/admin/settings/domain"
                className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors font-medium">
                Kelola domain <ArrowRight className="h-3 w-3" />
              </Link>
              <Link href="/admin/website/poster"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors font-medium">
                🖨️ Cetak Poster QR Code Web
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Completion card */}
        <Card className="glass border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <LayoutTemplate className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kelengkapan Konten</p>
                <p className="text-sm font-semibold">{filledCount}/{sections.length} bagian terisi</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", completionPct === 100 ? "bg-emerald-500" : "btn-gradient")}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{completionPct}% lengkap</p>
          </CardContent>
        </Card>

        {/* Quick preview card */}
        <Card className="glass border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pratinjau Website</p>
                <p className="text-sm font-semibold">{data?.name || "—"}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{data?.tagline || "Belum ada tagline"}</p>
            {websiteUrl && (
              <a href={websiteUrl} target="_blank" rel="noopener"
                className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
                <ExternalLink className="h-3 w-3" /> Buka website
              </a>
            )}
          </CardContent>
        </Card>
      </div>



      {/* Section status cards */}
      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <LayoutTemplate className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Status Konten</CardTitle>
              <CardDescription className="text-xs">Klik bagian untuk mengedit</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {sections.map(s => (
              <Link key={s.href} href={s.href}
                className={cn(
                  "flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all hover:shadow-sm",
                  s.status === "ok" ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40" :
                  s.status === "warn" ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60" :
                  "border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40"
                )}>
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg",
                    s.status === "ok" ? "bg-emerald-500/10 text-emerald-600" :
                    s.status === "warn" ? "bg-amber-500/10 text-amber-600" :
                    "bg-rose-500/10 text-rose-600")}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className={cn("text-xs", 
                      s.status === "ok" ? "text-emerald-600" :
                      s.status === "warn" ? "text-amber-600" :
                      "text-rose-600")}>{s.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.status === "ok" ? <CheckCircle className="h-4 w-4 text-emerald-500" /> :
                   s.status === "warn" ? <AlertCircle className="h-4 w-4 text-amber-500" /> :
                   <AlertCircle className="h-4 w-4 text-rose-500" />}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info kontak ringkas */}
      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Informasi Kontak</CardTitle>
                <CardDescription className="text-xs">Tampil di footer dan halaman kontak website</CardDescription>
              </div>
            </div>
            <Link href={`${base}/contact`} className="text-xs text-primary hover:underline flex items-center gap-1">
              Edit <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Telepon", value: data?.phone },
              { label: "Email", value: data?.email },
              { label: "WhatsApp", value: data?.whatsapp },
              { label: "Instagram", value: data?.instagram ? `@${data.instagram}` : null },
              { label: "Facebook", value: data?.facebook },
              { label: "Alamat", value: data?.address },
            ].map(item => (
              <div key={item.label} className={cn(
                "rounded-xl px-3 py-2.5 text-sm",
                item.value ? "bg-muted/40" : "bg-muted/20"
              )}>
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
                <p className={cn("font-medium truncate", item.value ? "text-foreground" : "text-muted-foreground/50 italic text-xs")}>
                  {item.value || "Belum diisi"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
