"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Users, FileText, Image, 
  Building2, Award, GraduationCap, Activity, Megaphone, BookOpen,
  SlidersHorizontal, Handshake, CalendarDays, AlertCircle, ExternalLink, Download
} from "lucide-react"
import { getRootDomain } from "@/lib/utils"
import Link from "next/link"
import { ActivityHeatmap } from "./_components/activity-heatmap"
import { RecentActivity } from "./_components/recent-activity"
import { WebsiteData } from "./_components/types"
import { OverviewCards } from "./_components/overview-cards"
import { ContentSteps, StatItem } from "./_components/content-steps"
import { Info } from "lucide-react"

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
    if (typeof window !== "undefined") {
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

  const base = "/admin/website"

  // Priority: custom domain (verified) → subdomain → fallback /site/[slug]
  const customDomainUrl = data?.customDomain?.status === "verified" && data.domain
    ? `https://${data.domain}` : null
  const subdomainUrl = slug ? `http://${slug}.${rootDomain}` : null
  const fallbackUrl = slug ? `${appUrl}/site/${slug}` : null
  const websiteUrl = customDomainUrl || subdomainUrl || fallbackUrl

  // Consider it full if it's at least 99% of max capacity
  const isStorageFull = typeof data?.diskUsage === "number" && typeof data?.maxStorage === "number" && data.maxStorage > 0 && data.diskUsage >= (data.maxStorage * 0.99);
  
  const maxStorageMb = data?.maxStorage ? Math.round(data.maxStorage / (1024 * 1024)) : 0;
  const maxStorageStr = maxStorageMb >= 1024 ? `${(maxStorageMb / 1024).toFixed(1)} GB` : `${maxStorageMb} MB`;

  const getColStatus = (count?: number | null): "ok" | "warn" | "empty" => {
    if (!count || count === 0) return "empty"
    if (count >= 5) return "ok"
    return "warn"
  }

  // Hitung kelengkapan konten
  const sections: StatItem[] = [
    {
      label: "Profil Lembaga",
      desc: "Isi logo, alamat, dan nomor telepon sekolah.",
      value: data?.about ? "Lengkap" : "Belum diisi",
      icon: <Info className="h-5 w-5" />,
      status: data?.about ? "ok" : "empty",
      href: `${base}/about`,
    },
    {
      label: "Sambutan",
      desc: "Tambahkan kata sambutan dari Kepala Sekolah.",
      value: data?.about ? "Lengkap" : "Belum diisi", // Assuming sambutan is part of about
      icon: <Users className="h-5 w-5" />,
      status: data?.about ? "ok" : "empty",
      href: `${base}/about?tab=principal`,
    },
    {
      label: "Slider Banner",
      desc: "Unggah foto terbaik untuk banner utama website.",
      value: data?._count?.sliders ? `${data._count.sliders} slide` : "Belum ada",
      icon: <SlidersHorizontal className="h-5 w-5" />,
      status: getColStatus(data?._count?.sliders),
      href: `${base}/sliders`,
    },
    {
      label: "Artikel & Pos",
      desc: "Berita, artikel, atau publikasi kegiatan terbaru.",
      value: data?._count?.posts ? `${data._count.posts} postingan` : "Belum ada",
      icon: <FileText className="h-5 w-5" />,
      status: getColStatus(data?._count?.posts),
      href: `${base}/posts`,
    },
    {
      label: "Galeri Foto",
      desc: "Dokumentasi visual lingkungan & acara sekolah.",
      value: Array.isArray(data?.gallery) && data.gallery.length > 0 ? `${data.gallery.length} foto` : "Belum ada",
      icon: <Image className="h-5 w-5" />,
      status: getColStatus(data?.gallery?.length),
      href: `${base}/gallery`,
    },
    {
      label: "Fasilitas Sekolah",
      desc: "Daftar sarana & prasarana pendukung pembelajaran.",
      value: data?._count?.facilities ? `${data._count.facilities} fasilitas` : "Belum ada",
      icon: <Building2 className="h-5 w-5" />,
      status: getColStatus(data?._count?.facilities),
      href: `${base}/facilities`,
    },
    {
      label: "Guru & Staf (GTK)",
      desc: "Profil pendidik dan tenaga kependidikan.",
      value: data?._count?.staff ? `${data._count.staff} profil` : "Belum ada",
      icon: <Users className="h-5 w-5" />,
      status: getColStatus(data?._count?.staff),
      href: `${base}/gtk`,
    },
    {
      label: "Prestasi",
      desc: "Penghargaan dan piala yang diraih oleh siswa.",
      value: data?._count?.achievements ? `${data._count.achievements} prestasi` : "Belum ada",
      icon: <Award className="h-5 w-5" />,
      status: getColStatus(data?._count?.achievements),
      href: `${base}/achievements`,
    },
    {
      label: "Alumni Success",
      desc: "Testimoni dan rekam jejak kelulusan siswa.",
      value: data?._count?.alumni ? `${data._count.alumni} alumni` : "Belum ada",
      icon: <GraduationCap className="h-5 w-5" />,
      status: getColStatus(data?._count?.alumni),
      href: `${base}/alumni`,
    },
    {
      label: "Ekstrakurikuler",
      desc: "Kegiatan pengembangan bakat dan minat siswa.",
      value: data?._count?.extracurriculars ? `${data._count.extracurriculars} kegiatan` : "Belum ada",
      icon: <Activity className="h-5 w-5" />,
      status: getColStatus(data?._count?.extracurriculars),
      href: `${base}/extracurriculars`,
    },
    {
      label: "Program Unggulan",
      desc: "Kurikulum khusus atau program andalan sekolah.",
      value: data?._count?.programs ? `${data._count.programs} program` : "Belum ada",
      icon: <BookOpen className="h-5 w-5" />,
      status: getColStatus(data?._count?.programs),
      href: `${base}/programs`,
    },
    {
      label: "Popup Pengumuman",
      desc: "Banner informasi penting yang muncul di depan.",
      value: data?._count?.popups ? `${data._count.popups} banner` : "Belum ada",
      icon: <Megaphone className="h-5 w-5" />,
      status: data?._count?.popups && data._count.popups > 0 ? "ok" : "empty",
      href: `${base}/popups`,
    },
    {
      label: "Mitra Kerjasama",
      desc: "Logo partner, institusi, atau perusahaan afiliasi.",
      value: data?._count?.partnerships ? `${data._count.partnerships} mitra` : "Belum ada",
      icon: <Handshake className="h-5 w-5" />,
      status: getColStatus(data?._count?.partnerships),
      href: `${base}/partners`,
    },
    {
      label: "Agenda Kegiatan",
      desc: "Jadwal acara, event, atau kalender kegiatan mendatang.",
      value: data?._count?.events ? `${data._count.events} agenda` : "Belum ada",
      icon: <CalendarDays className="h-5 w-5" />,
      status: getColStatus(data?._count?.events),
      href: `${base}/events`,
    },
    {
      label: "Pusat Unduhan",
      desc: "Brosur, formulir, kalender akademik untuk diunduh.",
      value: data?._count?.documents ? `${data._count.documents} dokumen` : "Belum ada",
      icon: <Download className="h-5 w-5" />,
      status: getColStatus(data?._count?.documents),
      href: `${base}/documents`,
    },
  ]

  const filledCount = sections.filter(s => s.status !== "empty").length
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

      <OverviewCards
        data={data}
        slug={slug}
        rootDomain={rootDomain}
        customDomainUrl={customDomainUrl}
        websiteUrl={websiteUrl}
        filledCount={filledCount}
        totalSections={sections.length}
        completionPct={completionPct}
        rank={rank}
        score={score}
        totalTenants={totalTenants}
      />

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

      <ContentSteps sections={sections} />
    </div>
  )
}
