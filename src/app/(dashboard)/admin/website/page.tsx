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
import Link from"next/link"

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

  const getColStatus = (count?: number | null):"ok" |"warn" |"empty" => {
    if (!count || count === 0) return"empty"
    if (count >= 5) return"ok"
    return"warn"
  }

  // Hitung kelengkapan konten
  const sections: StatItem[] = [
    {
      label:"Profil Lembaga",
      value: data?.about ?"Lengkap" :"Belum diisi",
      icon: <Info className="h-5 w-5" />,
      status: data?.about ?"ok" :"empty",
      href: `${base}/about`,
    },
    {
      label:"Artikel & Pos",
      value: data?._count?.posts ? `${data._count.posts} postingan` :"Belum ada",
      icon: <FileText className="h-5 w-5" />,
      status: getColStatus(data?._count?.posts),
      href: `${base}/posts`,
    },

    {
      label:"Galeri",
      value: Array.isArray(data?.gallery) && data.gallery.length > 0 ? `${data.gallery.length} foto` :"Belum ada",
      icon: <Image className="h-5 w-5" />,
      status: getColStatus(data?.gallery?.length),
      href: `${base}/gallery`,
    },
    {
      label:"Pusat Unduhan",
      value: data?._count?.documents ? `${data._count.documents} dokumen` :"Belum ada",
      icon: <Download className="h-5 w-5" />,
      status: getColStatus(data?._count?.documents),
      href: `${base}/documents`,
    },
    {
      label:"Fasilitas",
      value: data?._count?.facilities ? `${data._count.facilities} fasilitas` :"Belum ada",
      icon: <Building2 className="h-5 w-5" />,
      status: getColStatus(data?._count?.facilities),
      href: `${base}/facilities`,
    },
    {
      label:"Guru & Staf (GTK)",
      value: data?._count?.staff ? `${data._count.staff} profil` :"Belum ada",
      icon: <Users className="h-5 w-5" />,
      status: getColStatus(data?._count?.staff),
      href: `${base}/gtk`,
    },
    {
      label:"Prestasi Siswa",
      value: data?._count?.achievements ? `${data._count.achievements} prestasi` :"Belum ada",
      icon: <Award className="h-5 w-5" />,
      status: getColStatus(data?._count?.achievements),
      href: `${base}/achievements`,
    },
    {
      label:"Alumni Success",
      value: data?._count?.alumni ? `${data._count.alumni} alumni` :"Belum ada",
      icon: <GraduationCap className="h-5 w-5" />,
      status: getColStatus(data?._count?.alumni),
      href: `${base}/alumni`,
    },
    {
      label:"Ekstrakurikuler",
      value: data?._count?.extracurriculars ? `${data._count.extracurriculars} kegiatan` :"Belum ada",
      icon: <Activity className="h-5 w-5" />,
      status: getColStatus(data?._count?.extracurriculars),
      href: `${base}/extracurriculars`,
    },
    {
      label:"Program Unggulan",
      value: data?._count?.programs ? `${data._count.programs} program` :"Belum ada",
      icon: <BookOpen className="h-5 w-5" />,
      status: getColStatus(data?._count?.programs),
      href: `${base}/programs`,
    },
    {
      label:"Popup Pengumuman",
      value: data?._count?.popups ? `${data._count.popups} banner` :"Belum ada",
      icon: <Megaphone className="h-5 w-5" />,
      status: data?._count?.popups && data._count.popups > 0 ?"ok" :"empty",
      href: `${base}/popups`,
    },
    {
      label:"Hero Slider",
      value: data?._count?.sliders ? `${data._count.sliders} slide` :"Belum ada",
      icon: <SlidersHorizontal className="h-5 w-5" />,
      status: getColStatus(data?._count?.sliders),
      href: `${base}/sliders`,
    },
    {
      label:"Mitra Kerjasama",
      value: data?._count?.partnerships ? `${data._count.partnerships} mitra` :"Belum ada",
      icon: <Handshake className="h-5 w-5" />,
      status: getColStatus(data?._count?.partnerships),
      href: `${base}/partners`,
    },
    {
      label:"Agenda Kegiatan",
      value: data?._count?.events ? `${data._count.events} agenda` :"Belum ada",
      icon: <CalendarDays className="h-5 w-5" />,
      status: getColStatus(data?._count?.events),
      href: `${base}/events`,
    },
  ]

  const filledCount = sections.filter(s => s.status !=="empty").length
  const completionPct = Math.round((filledCount / sections.length) * 100)

  const groupedSections = [
    {
      title:"Utama & Esensial",
      description:"Fondasi informasi lembaga Anda",
      items: sections.filter(s => ["Profil Lembaga","Guru & Staf (GTK)","Fasilitas","Program Unggulan"].includes(s.label))
    },
    {
      title:"Berita & Informasi",
      description:"Update kegiatan dan publikasi",
      items: sections.filter(s => ["Hero Slider","Popup Pengumuman","Artikel & Pos","Agenda Kegiatan","Pusat Unduhan"].includes(s.label))
    },
    {
      title:"Media & Portofolio",
      description:"Dokumentasi dan pencapaian",
      items: sections.filter(s => ["Galeri","Ekstrakurikuler","Prestasi Siswa","Alumni Success","Mitra Kerjasama"].includes(s.label))
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Website</h1>
          <p className="text-muted-foreground mt-1">Ringkasan dan status konten website Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          {websiteUrl && (
            <a href={websiteUrl} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Lihat Website
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
                  <p className="text-sm font-semibold font-mono truncate max-w-[160px]">
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

      {/* Quick Start Banner (Only shows if completion < 50%) */}
      {completionPct < 50 && (
        <Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="max-w-3xl">
              <h2 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Mari Mulai Membangun Website Anda!
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mb-6">
                Website Anda saat ini masih banyak yang kosong. Ikuti 3 langkah dasar ini untuk melengkapi informasi inti sekolah Anda agar siap dilihat oleh publik.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Link href={`${base}/about`} className="group flex flex-col gap-3 rounded-2xl bg-background/60 p-4 border hover:border-primary/50 hover:shadow-md transition-all backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">1</div>
                    <h3 className="font-semibold text-sm">Profil & Kontak</h3>
                  </div>
                  <p className="text-xs text-muted-foreground flex-1">Isi logo, alamat, dan nomor telepon sekolah.</p>
                  <div className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Isi Sekarang <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
                <Link href={`${base}/about?tab=principal`} className="group flex flex-col gap-3 rounded-2xl bg-background/60 p-4 border hover:border-primary/50 hover:shadow-md transition-all backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">2</div>
                    <h3 className="font-semibold text-sm">Sambutan</h3>
                  </div>
                  <p className="text-xs text-muted-foreground flex-1">Tambahkan kata sambutan dari Kepala Sekolah.</p>
                  <div className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Isi Sekarang <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
                <Link href={`${base}/sliders`} className="group flex flex-col gap-3 rounded-2xl bg-background/60 p-4 border hover:border-primary/50 hover:shadow-md transition-all backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">3</div>
                    <h3 className="font-semibold text-sm">Slider Banner</h3>
                  </div>
                  <p className="text-xs text-muted-foreground flex-1">Unggah foto terbaik untuk banner utama website.</p>
                  <div className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Isi Sekarang <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped Section status cards */}
      {groupedSections.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-3">
          <div>
            <h3 className="font-bold text-lg">{group.title}</h3>
            <p className="text-sm text-muted-foreground">{group.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map(s => (
              <Link key={s.href} href={s.href}
                className={cn("flex items-center justify-between rounded-xl border bg-card px-4 py-3.5 transition-all hover:shadow-md hover:-translate-y-0.5",
                  s.status ==="ok" ?"hover:border-emerald-500/40" :
                  s.status ==="warn" ?"hover:border-amber-500/60" :"hover:border-rose-500/40"
                )}>
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    s.status ==="ok" ?"bg-emerald-500/10 text-emerald-600" :
                    s.status ==="warn" ?"bg-amber-500/10 text-amber-600" :"bg-rose-500/10 text-rose-600")}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{s.label}</p>
                    <p className={cn("text-xs font-medium mt-0.5", 
                      s.status ==="ok" ?"text-emerald-600" :
                      s.status ==="warn" ?"text-amber-600" :"text-rose-600")}>{s.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.status ==="ok" ? <CheckCircle className="h-4 w-4 text-emerald-500" /> :
                   s.status ==="warn" ? <AlertCircle className="h-4 w-4 text-amber-500" /> :
                   <AlertCircle className="h-4 w-4 text-rose-500" />}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

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
