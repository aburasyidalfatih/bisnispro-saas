"use client"

import { useEffect, useState } from"react"
import { useSession } from"next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import {
  Globe, ExternalLink, Users, FileText, Image, Phone,
  Briefcase, Info, LayoutTemplate, ArrowRight, Eye, Trophy,
  CheckCircle, AlertCircle, ShieldCheck, ShieldOff, Download,
  Building2, Award, GraduationCap, Activity, Megaphone, BookOpen,
  BarChart3, MessageSquare, SlidersHorizontal, Handshake, CalendarDays, Sparkles
} from"lucide-react"
import { cn, getRootDomain } from"@/lib/utils"
import Link from "next/link"
import { ActivityHeatmap } from "./_components/activity-heatmap"
import { RecentActivity } from "./_components/recent-activity"

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
  plan?: string
  diskUsage?: number
  maxStorage?: number
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
  desc: string
  value: string | number
  icon: React.ReactNode
  status?:"ok" |"warn" |"empty"
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
  const [rank, setRank] = useState<number | null>(null)
  const [totalTenants, setTotalTenants] = useState<number | null>(null)
  const [score, setScore] = useState<number>(0)

  useEffect(() => {
    if (typeof window !=="undefined") {
      const host = window.location.host
      const protocol = window.location.protocol
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
      fetch(`/api/public/leaderboard`).then(r => r.json()).catch(() => [])
    ]).then(([website, domain, leaderboard]) => {
      setData({ ...website, domain: domain.domain || null, customDomain: domain.customDomain || null })
      
      if (Array.isArray(leaderboard)) {
        setTotalTenants(leaderboard.length)
        const myIndex = leaderboard.findIndex((item: any) => item.tenantId === tenantId)
        if (myIndex !== -1) {
          setRank(myIndex + 1)
          setScore(leaderboard[myIndex].totalScore || 0)
        }
      }
      
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [tenantId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    )
  }

  const base ="/admin/website"

  // Priority: custom domain (verified) → subdomain → fallback /site/[slug]
  const customDomainUrl = data?.customDomain?.status ==="verified" && data.domain
    ? `https://${data.domain}` : null
  const subdomainUrl = slug ? `http://${slug}.${rootDomain}` : null
  const fallbackUrl = slug ? `${appUrl}/site/${slug}` : null
  const websiteUrl = customDomainUrl || subdomainUrl || fallbackUrl

  // Consider it full if it's at least 99% of max capacity
  const isStorageFull = typeof data?.diskUsage === "number" && typeof data?.maxStorage === "number" && data.maxStorage > 0 && data.diskUsage >= (data.maxStorage * 0.99);
  
  const maxStorageMb = data?.maxStorage ? Math.round(data.maxStorage / (1024 * 1024)) : 0;
  const maxStorageStr = maxStorageMb >= 1024 ? `${(maxStorageMb / 1024).toFixed(1)} GB` : `${maxStorageMb} MB`;

  const getColStatus = (count?: number | null):"ok" |"warn" |"empty" => {
    if (!count || count === 0) return"empty"
    if (count >= 5) return"ok"
    return"warn"
  }

  // Hitung kelengkapan konten
  const sections: StatItem[] = [
    {
      label:"Profil Lembaga",
      desc:"Isi logo, alamat, dan nomor telepon sekolah.",
      value: data?.about ?"Lengkap" :"Belum diisi",
      icon: <Info className="h-5 w-5" />,
      status: data?.about ?"ok" :"empty",
      href: `${base}/about`,
    },
    {
      label:"Sambutan",
      desc:"Tambahkan kata sambutan dari Kepala Sekolah.",
      value: data?.about ?"Lengkap" :"Belum diisi", // Assuming sambutan is part of about
      icon: <Users className="h-5 w-5" />,
      status: data?.about ?"ok" :"empty",
      href: `${base}/about?tab=principal`,
    },
    {
      label:"Slider Banner",
      desc:"Unggah foto terbaik untuk banner utama website.",
      value: data?._count?.sliders ? `${data._count.sliders} slide` :"Belum ada",
      icon: <SlidersHorizontal className="h-5 w-5" />,
      status: getColStatus(data?._count?.sliders),
      href: `${base}/sliders`,
    },
    {
      label:"Artikel & Pos",
      desc:"Berita, artikel, atau publikasi kegiatan terbaru.",
      value: data?._count?.posts ? `${data._count.posts} postingan` :"Belum ada",
      icon: <FileText className="h-5 w-5" />,
      status: getColStatus(data?._count?.posts),
      href: `${base}/posts`,
    },
    {
      label:"Galeri Foto",
      desc:"Dokumentasi visual lingkungan & acara sekolah.",
      value: Array.isArray(data?.gallery) && data.gallery.length > 0 ? `${data.gallery.length} foto` :"Belum ada",
      icon: <Image className="h-5 w-5" />,
      status: getColStatus(data?.gallery?.length),
      href: `${base}/gallery`,
    },
    {
      label:"Fasilitas Sekolah",
      desc:"Daftar sarana & prasarana pendukung pembelajaran.",
      value: data?._count?.facilities ? `${data._count.facilities} fasilitas` :"Belum ada",
      icon: <Building2 className="h-5 w-5" />,
      status: getColStatus(data?._count?.facilities),
      href: `${base}/facilities`,
    },
    {
      label:"Guru & Staf (GTK)",
      desc:"Profil pendidik dan tenaga kependidikan.",
      value: data?._count?.staff ? `${data._count.staff} profil` :"Belum ada",
      icon: <Users className="h-5 w-5" />,
      status: getColStatus(data?._count?.staff),
      href: `${base}/gtk`,
    },
    {
      label:"Prestasi",
      desc:"Penghargaan dan piala yang diraih oleh siswa.",
      value: data?._count?.achievements ? `${data._count.achievements} prestasi` :"Belum ada",
      icon: <Award className="h-5 w-5" />,
      status: getColStatus(data?._count?.achievements),
      href: `${base}/achievements`,
    },
    {
      label:"Alumni Success",
      desc:"Testimoni dan rekam jejak kelulusan siswa.",
      value: data?._count?.alumni ? `${data._count.alumni} alumni` :"Belum ada",
      icon: <GraduationCap className="h-5 w-5" />,
      status: getColStatus(data?._count?.alumni),
      href: `${base}/alumni`,
    },
    {
      label:"Ekstrakurikuler",
      desc:"Kegiatan pengembangan bakat dan minat siswa.",
      value: data?._count?.extracurriculars ? `${data._count.extracurriculars} kegiatan` :"Belum ada",
      icon: <Activity className="h-5 w-5" />,
      status: getColStatus(data?._count?.extracurriculars),
      href: `${base}/extracurriculars`,
    },
    {
      label:"Program Unggulan",
      desc:"Kurikulum khusus atau program andalan sekolah.",
      value: data?._count?.programs ? `${data._count.programs} program` :"Belum ada",
      icon: <BookOpen className="h-5 w-5" />,
      status: getColStatus(data?._count?.programs),
      href: `${base}/programs`,
    },
    {
      label:"Popup Pengumuman",
      desc:"Banner informasi penting yang muncul di depan.",
      value: data?._count?.popups ? `${data._count.popups} banner` :"Belum ada",
      icon: <Megaphone className="h-5 w-5" />,
      status: data?._count?.popups && data._count.popups > 0 ?"ok" :"empty",
      href: `${base}/popups`,
    },
    {
      label:"Mitra Kerjasama",
      desc:"Logo partner, institusi, atau perusahaan afiliasi.",
      value: data?._count?.partnerships ? `${data._count.partnerships} mitra` :"Belum ada",
      icon: <Handshake className="h-5 w-5" />,
      status: getColStatus(data?._count?.partnerships),
      href: `${base}/partners`,
    },
    {
      label:"Agenda Kegiatan",
      desc:"Jadwal acara, event, atau kalender kegiatan mendatang.",
      value: data?._count?.events ? `${data._count.events} agenda` :"Belum ada",
      icon: <CalendarDays className="h-5 w-5" />,
      status: getColStatus(data?._count?.events),
      href: `${base}/events`,
    },
    {
      label:"Pusat Unduhan",
      desc:"Brosur, formulir, kalender akademik untuk diunduh.",
      value: data?._count?.documents ? `${data._count.documents} dokumen` :"Belum ada",
      icon: <Download className="h-5 w-5" />,
      status: getColStatus(data?._count?.documents),
      href: `${base}/documents`,
    },
  ]

  const filledCount = sections.filter(s => s.status !=="empty").length
  const completionPct = Math.round((filledCount / sections.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold tracking-tight">Website</h1>
          <p className="text-muted-foreground mt-1 text-sm">Ringkasan dan status konten website Anda.</p>
        </div>
        
        {/* Storage Warning */}
        {isStorageFull && (
          <div className="flex-1 max-w-lg flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg py-2 px-3 md:mx-4">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-red-700 dark:text-red-400">Penyimpanan Penuh ({maxStorageStr})</p>
              <p className="text-[10px] text-red-600/90 dark:text-red-400/80 leading-tight">Batas maksimal paket Anda telah tercapai. Anda tidak dapat mengunggah media baru.</p>
            </div>
            <Button size="sm" className="h-7 px-3 text-[10px] bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-sm shrink-0" asChild>
              <Link href="/admin/billing">Upgrade</Link>
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {websiteUrl && (
            <a href={websiteUrl} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
              <ExternalLink className="h-4 w-4" /> Lihat Website
            </a>
          )}
        </div>
      </div>

      {/* Domain status + completion — top row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  <p className="text-sm font-semibold font-mono truncate max-w-[160px] max-w-full">
                    {customDomainUrl
                      ? data?.domain
                      : slug ? `${slug}.${rootDomain}` :"—"}
                  </p>
                </div>
              </div>
              {data?.customDomain ? (
                data.customDomain.status ==="verified"
                  ? <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  : <ShieldOff className="h-4 w-4 text-amber-500 shrink-0" />
              ) : null}
            </div>



            {data?.domain && data.customDomain?.status !=="verified" && (
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
                className={cn("h-full rounded-full transition-all", completionPct === 100 ?"bg-emerald-500" :"btn-gradient")}
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
                <p className="text-sm font-semibold truncate w-32">{data?.name ||"—"}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{data?.tagline ||"Belum ada tagline"}</p>
            {websiteUrl && (
              <a href={websiteUrl} target="_blank" rel="noopener"
                className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
                <ExternalLink className="h-3 w-3" /> Buka website
              </a>
            )}
          </CardContent>
        </Card>

        {/* Ranking card */}
        <Link href="/admin/website/leaderboard" className="block">
          <Card className="glass border-0 hover:bg-muted/50 transition-colors h-full cursor-pointer relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="w-24 h-24 text-yellow-500 transform translate-x-4 -translate-y-4" />
            </div>
            <CardContent className="p-5 relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Peringkat Nasional</p>
                      <p className="text-sm font-semibold">
                        {rank ? `Ranking #${rank}` :"Belum masuk"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-yellow-600">{score.toLocaleString('id-ID')}</span>
                      <span className="text-xs text-muted-foreground">Poin</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Dari {totalTenants || 0} sekolah yang terdaftar
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-yellow-600 font-medium">
                Lihat Leaderboard <ArrowRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Activity Heatmap & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {tenantId && (
          <>
            <div className="lg:col-span-2">
              <ActivityHeatmap tenantId={tenantId} />
            </div>
            <div className="lg:col-span-1">
              <RecentActivity tenantId={tenantId} />
            </div>
          </>
        )}
      </div>

      {/* Onboarding Steps Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Lengkapi Konten Website</h2>
        </div>
        <p className="text-muted-foreground text-sm md:text-base max-w-3xl">
          Selesaikan seluruh langkah di bawah ini secara berurutan agar website sekolah Anda tampil sempurna dan informatif di mata publik.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 pt-2">
          {sections.map((s, idx) => {
            const isComplete = s.status !== "empty"
            return (
              <Link key={s.href} href={s.href} className={cn(
                "group flex flex-col gap-3 rounded-2xl bg-card p-4 border hover:shadow-md transition-all",
                isComplete ? "border-emerald-500/20 hover:border-emerald-500/40" : "border-border hover:border-primary/50"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-lg transition-transform group-hover:scale-105",
                    isComplete ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                  )}>
                    {idx + 1}
                  </div>
                  <h3 className="font-semibold text-sm leading-tight">{s.label}</h3>
                </div>
                
                <p className="text-xs text-muted-foreground flex-1 line-clamp-2 leading-relaxed">
                  {s.desc}
                </p>
                
                <div className={cn("mt-2 pt-3 border-t flex items-center justify-between",
                  isComplete ? "border-emerald-500/10" : "border-border/50"
                )}>
                  <div className="flex items-center gap-1.5">
                    {isComplete ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className={cn("text-[11px] font-bold uppercase tracking-wider",
                      isComplete ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {isComplete ? "Sudah Lengkap" : "Belum Lengkap"}
                    </span>
                  </div>
                  
                  {!isComplete && (
                    <div className="text-xs font-semibold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all">
                      Isi Sekarang <ArrowRight className="h-3 w-3" />
                    </div>
                  )}
                  {isComplete && (
                    <div className="text-xs font-medium text-muted-foreground">
                      {s.value}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

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
            <Link href={`${base}/about`} className="text-xs text-primary hover:underline flex items-center gap-1">
              Edit <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label:"Telepon", value: data?.phone },
              { label:"Email", value: data?.email },
              { label:"WhatsApp", value: data?.whatsapp },
              { label:"Instagram", value: data?.instagram ? `@${data.instagram}` : null },
              { label:"Facebook", value: data?.facebook },
              { label:"Alamat", value: data?.address },
            ].map(item => (
              <div key={item.label} className={cn("rounded-xl px-3 py-2.5 text-sm",
                item.value ?"bg-muted/40" :"bg-muted/20"
              )}>
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
                <p className={cn("font-medium truncate", item.value ?"text-foreground" :"text-muted-foreground/50 italic text-xs")}>
                  {item.value ||"Belum diisi"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
