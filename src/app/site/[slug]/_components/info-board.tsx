"use client"

import Link from "next/link"
import { CalendarDays, Megaphone, Newspaper, ArrowRight, MapPin, Clock } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useRouting } from "@/components/providers/routing-provider"

interface InfoBoardProps {
  events: any[]
  posts: any[]
}

export function InfoBoard({ events, posts }: InfoBoardProps) {
  const { resolveHref } = useRouting()

  // Agenda Kegiatan (Events)
  const agenda = (events || []).slice(0, 4)

  // Pengumuman (Posts with type PENGUMUMAN or just fallback to some posts if none)
  let pengumuman = (posts || []).filter((p) => p.type === "PENGUMUMAN").slice(0, 4)
  if (pengumuman.length === 0) {
    pengumuman = (posts || []).slice(0, 4)
  }

  // Artikel & Berita (Posts with type BERITA or BLOG_GURU, excluding pengumuman)
  let artikel = (posts || []).filter((p) => p.type !== "PENGUMUMAN").slice(0, 4)
  if (artikel.length === 0 && posts && posts.length > 0) {
     artikel = (posts || []).slice(0, 4)
  }

  return (
    <section className="py-16 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Column 1: Agenda Kegiatan */}
          <div className="bg-background rounded-[2rem] p-6 md:p-8 border shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-6 w-6 text-emerald-600" />
                <h3 className="font-bold text-lg">Agenda Kegiatan</h3>
              </div>
              <Link href={resolveHref("/agenda")} className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                Lihat Semua <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="space-y-6 flex-1">
              {agenda.length > 0 ? agenda.map((item, idx) => (
                <Link key={idx} href={resolveHref("/agenda")} className="flex gap-4 group cursor-pointer">
                  <div className="flex flex-col items-center justify-center bg-muted/50 rounded-xl px-4 py-2 min-w-[70px] border border-transparent group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-colors h-fit">
                    <span className="text-2xl font-black text-foreground group-hover:text-emerald-700 leading-none mb-1">
                      {format(new Date(item.startDate), "dd")}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-emerald-600">
                      {format(new Date(item.startDate), "MMM", { locale: idLocale })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.startDate), "HH:mm")} WIB
                      </div>
                      {item.location && (
                        <div className="flex items-center gap-1 truncate max-w-full">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Belum ada agenda kegiatan.
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Pengumuman Terbaru */}
          <div className="bg-background rounded-[2rem] p-6 md:p-8 border shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
              <div className="flex items-center gap-3">
                <Megaphone className="h-6 w-6 text-emerald-600" />
                <h3 className="font-bold text-lg">Pengumuman Terbaru</h3>
              </div>
              <Link href={resolveHref("/berita?type=pengumuman")} className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                Lihat Semua <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="space-y-6 flex-1">
              {pengumuman.length > 0 ? pengumuman.map((item, idx) => {
                const badgeColors = ["bg-blue-600", "bg-amber-600", "bg-emerald-600", "bg-purple-600"];
                const badgeColor = badgeColors[idx % badgeColors.length];
                
                return (
                  <Link key={idx} href={resolveHref(`/berita/${item.id}`)} className="flex gap-4 group cursor-pointer">
                    <div className="flex flex-col items-center justify-center bg-muted/50 rounded-xl px-4 py-2 min-w-[70px] border border-transparent group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-colors h-fit">
                      <span className="text-2xl font-black text-foreground group-hover:text-emerald-700 leading-none mb-1">
                        {format(new Date(item.createdAt), "dd")}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-emerald-600">
                        {format(new Date(item.createdAt), "MMM", { locale: idLocale })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className={`text-[9px] font-bold text-white px-2 py-0.5 rounded uppercase w-fit mb-1.5 ${badgeColor}`}>
                        {item.category?.name || item.type || "INFO"}
                      </span>
                      <h4 className="font-semibold text-sm mb-1 group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {item.excerpt || item.content?.replace(/<[^>]*>?/gm, '').substring(0, 50) || "Silakan baca selengkapnya..."}
                      </p>
                    </div>
                  </Link>
                )
              }) : (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Belum ada pengumuman.
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Artikel & Berita */}
          <div className="bg-background rounded-[2rem] p-6 md:p-8 border shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
              <div className="flex items-center gap-3">
                <Newspaper className="h-6 w-6 text-emerald-600" />
                <h3 className="font-bold text-lg">Artikel & Berita</h3>
              </div>
              <Link href={resolveHref("/berita")} className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                Lihat Semua <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="space-y-6 flex-1">
              {artikel.length > 0 ? artikel.map((item, idx) => (
                <Link key={idx} href={resolveHref(`/berita/${item.id}`)} className="flex gap-4 group cursor-pointer">
                  <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 border bg-muted">
                    {item.featuredImage ? (
                      <img 
                        src={item.featuredImage} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                        <Newspaper className="h-5 w-5 text-emerald-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1.5 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {format(new Date(item.createdAt), "dd MMM yyyy", { locale: idLocale })}
                    </p>
                  </div>
                </Link>
              )) : (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Belum ada artikel.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
