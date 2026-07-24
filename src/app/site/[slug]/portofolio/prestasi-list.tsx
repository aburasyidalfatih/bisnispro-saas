"use client"

import { useState } from "react"
import Link from "next/link"
import { Trophy, Calendar, Award, Star } from "lucide-react"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { format } from "date-fns"
import { id as dateId } from "date-fns/locale"
import { cn } from "@/lib/utils"

export function PortofolioList({ achievements, base }: { achievements: any[], base: string }) {
  const [activeTab, setActiveTab] = useState<"ALL" | "SISWA" | "GURU" | "SEKOLAH">("ALL")

  const filteredAchievements = achievements.filter((item) => {
    if (activeTab === "ALL") return true
    return item.type === activeTab
  })

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "SISWA":
        return { label: "Klien", color: "bg-blue-500 text-white" }
      case "GURU":
        return { label: "Tim & Staf", color: "bg-emerald-500 text-white" }
      case "SEKOLAH":
        return { label: "Institusi", color: "bg-violet-500 text-white" }
      default:
        return { label: "Klien", color: "bg-blue-500 text-white" }
    }
  }

  const tabs = [
    { id: "ALL", label: "Semua Portofolio" },
    { id: "SISWA", label: "Klien" },
    { id: "GURU", label: "Tim & Staf" },
    { id: "SEKOLAH", label: "Institusi" },
  ]

  return (
    <div className="space-y-8">
      {/* Tabs */}
      {achievements.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300",
                activeTab === tab.id
                  ? "bg-primary text-white shadow-lg scale-105"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filteredAchievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAchievements.map((item: any) => {
              const badge = getTypeBadge(item.type)
              return (
                <Link 
                  href={`${base}/portofolio/${item.slug || item.id}`}
                  key={item.id} 
                  className="group relative flex flex-col bg-white rounded-[2rem] overflow-hidden border border-border shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                >
                  {/* Image & Badge */}
                  <div className="relative aspect-video overflow-hidden">
                    {(!item.imageUrl || item.imageUrl.trim() === "" || item.imageUrl === "null") ? (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center transition-transform duration-700 group-hover:scale-110">
                        <Trophy className="h-20 w-20 text-white/20" />
                      </div>
                    ) : (
                      <OptimizedImage
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute top-4 left-4 bg-primary text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                      {item.level || "NASIONAL"}
                    </div>
                    {/* TYPE BADGE ADDED HERE */}
                    <div className={cn("absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg", badge.color)}>
                      {badge.label}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                       <div className="flex items-center gap-2 mb-2 opacity-80 text-[10px] font-bold">
                          <Calendar className="h-3 w-3" />
                          {item.date ? format(new Date(item.date), "dd MMMM yyyy", { locale: dateId }) : "Baru-baru ini"}
                       </div>
                       <h3 className="text-xl font-bold leading-tight line-clamp-2">
                          {item.title}
                       </h3>
                    </div>
                  </div>
                  
                  {/* Content Details */}
                  <div className="p-8 flex flex-col flex-grow bg-gradient-to-b from-white to-muted/20">
                    <p className="text-muted-foreground text-sm line-clamp-2 mt-auto">
                      {item.description ? item.description.replace(/<[^>]*>?/gm, '') : "Pencapaian luar biasa yang diraih oleh klien kami melalui dedikasi dan kerja keras yang tinggi."}
                    </p>
                    
                    <div className="flex items-center justify-between">
                       <div className="flex -space-x-2">
                          {[1, 2, 3].map((i) => (
                             <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-muted flex items-center justify-center overflow-hidden">
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                             </div>
                          ))}
                       </div>
                       <div className="text-primary font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                          Detail Portofolio <Award className="h-4 w-4" />
                       </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/20 rounded-[3rem] border border-dashed border-border flex flex-col items-center">
            <div className="bg-primary/10 h-24 w-24 rounded-full flex items-center justify-center mb-6">
              <Trophy className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold">Terus Berproses Menuju Juara</h3>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto text-lg leading-relaxed">
              Daftar portofolio sedang dalam proses pembaruan. Nantikan kabar gembira dari klien-siswi terbaik kami segera!
            </p>
          </div>
        )}
    </div>
  )
}
