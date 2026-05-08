"use client"

import Link from "next/link"
import { ArrowRight, Trophy, Medal, Star, Globe } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useRouting } from "@/components/providers/routing-provider"
import Image from "next/image"

interface Achievement {
  id: string
  title: string
  description?: string | null
  date: string | Date
  level: string
  imageUrl?: string | null
}

interface AchievementsSectionProps {
  achievements: Achievement[]
}

const LEVEL_CONFIG: Record<string, { icon: typeof Trophy; color: string; bg: string; label: string }> = {
  INTERNASIONAL: { icon: Globe, color: "text-amber-500", bg: "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200", label: "Internasional" },
  NASIONAL: { icon: Star, color: "text-rose-500", bg: "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200", label: "Nasional" },
  PROVINSI: { icon: Medal, color: "text-blue-500", bg: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200", label: "Provinsi" },
  KABUPATEN: { icon: Trophy, color: "text-emerald-500", bg: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200", label: "Kabupaten/Kota" },
  LOKAL: { icon: Trophy, color: "text-purple-500", bg: "bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-200", label: "Lokal" },
}

function getLevelConfig(level: string) {
  return LEVEL_CONFIG[level.toUpperCase()] || LEVEL_CONFIG.LOKAL
}

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const { resolveHref } = useRouting()

  if (!achievements || achievements.length === 0) return null

  const displayed = achievements.slice(0, 6)

  return (
    <section className="py-16 md:py-20 bg-primary/5 relative overflow-hidden">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-400/3 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold tracking-wider uppercase mb-4">
              <Trophy className="h-3.5 w-3.5" />
              Prestasi
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">
              Prestasi Membanggakan
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">
              Deretan pencapaian siswa dan sekolah kami di berbagai kompetisi dan ajang bergengsi.
            </p>
          </div>
          <Link href={resolveHref("/prestasi")} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map((achievement) => {
            const config = getLevelConfig(achievement.level)
            const Icon = config.icon

            return (
              <Link
                key={achievement.id}
                href={resolveHref(`/prestasi/${achievement.id}`)}
                className={`group rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${config.bg}`}
              >
                <div className="flex items-start gap-4">
                  {achievement.imageUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border bg-white shadow-sm">
                      <Image src={achievement.imageUrl} alt={`Prestasi: ${achievement.title}`} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="64px" />
                    </div>
                  ) : (
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-white/80 shadow-sm border`}>
                      <Icon className={`h-7 w-7 ${config.color}`} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${config.color} bg-white/60 border`}>
                        <Icon className="h-2.5 w-2.5" />
                        {config.label}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-1 line-clamp-2 leading-snug">{achievement.title}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {format(new Date(achievement.date), "dd MMMM yyyy", { locale: idLocale })}
                    </p>
                    {achievement.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{achievement.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>


      </div>
    </section>
  )
}
