import { Globe, ArrowRight, Eye, Trophy, ShieldCheck, ShieldOff, AlertCircle, LayoutTemplate } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { WebsiteData } from "./types"

interface OverviewCardsProps {
  data: WebsiteData | null
  slug: string | null
  rootDomain: string
  customDomainUrl: string | null
  websiteUrl: string | null
  filledCount: number
  totalSections: number
  completionPct: number
  rank: number | null
  score: number
  totalTenants: number | null
}

export function OverviewCards({
  data,
  slug,
  rootDomain,
  customDomainUrl,
  websiteUrl,
  filledCount,
  totalSections,
  completionPct,
  rank,
  score,
  totalTenants
}: OverviewCardsProps) {
  return (
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
              <p className="text-sm font-semibold">{filledCount}/{totalSections} bagian terisi</p>
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
              <p className="text-sm font-semibold truncate w-32">{data?.name || "—"}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{data?.tagline || "Belum ada tagline"}</p>
          {websiteUrl && (
            <a href={websiteUrl} target="_blank" rel="noopener"
              className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
              <ArrowRight className="h-3 w-3" /> Buka website
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
                      {rank ? `Ranking #${rank}` : "Belum masuk"}
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
  )
}
