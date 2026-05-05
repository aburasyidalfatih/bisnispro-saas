"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, GraduationCap } from "lucide-react"

interface Program {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
}

interface ProgramsSectionProps {
  programs: Program[]
  base: string
}

const ACCENT_COLORS = [
  { bg: "from-blue-500/10 to-indigo-500/10", border: "hover:border-blue-300", icon: "text-blue-600", badge: "bg-blue-100 text-blue-700" },
  { bg: "from-emerald-500/10 to-teal-500/10", border: "hover:border-emerald-300", icon: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
  { bg: "from-amber-500/10 to-orange-500/10", border: "hover:border-amber-300", icon: "text-amber-600", badge: "bg-amber-100 text-amber-700" },
  { bg: "from-purple-500/10 to-fuchsia-500/10", border: "hover:border-purple-300", icon: "text-purple-600", badge: "bg-purple-100 text-purple-700" },
  { bg: "from-rose-500/10 to-pink-500/10", border: "hover:border-rose-300", icon: "text-rose-600", badge: "bg-rose-100 text-rose-700" },
  { bg: "from-cyan-500/10 to-sky-500/10", border: "hover:border-cyan-300", icon: "text-cyan-600", badge: "bg-cyan-100 text-cyan-700" },
]

export function ProgramsSection({ programs, base }: ProgramsSectionProps) {
  if (!programs || programs.length === 0) return null

  const displayed = programs.slice(0, 6)

  return (
    <section className="py-16 md:py-20 bg-background relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 -right-32 w-96 h-96 rounded-full bg-primary/3 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-4">
            <GraduationCap className="h-3.5 w-3.5" />
            Program Keahlian
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Program Unggulan Kami
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            Berbagai program keahlian yang dirancang untuk membekali siswa dengan kompetensi profesional dan siap menghadapi dunia kerja.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map((program, idx) => {
            const color = ACCENT_COLORS[idx % ACCENT_COLORS.length]

            return (
              <Link
                key={program.id}
                href={`${base}/program`}
                className={`group relative rounded-2xl border bg-background overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${color.border}`}
              >
                {/* Image / Gradient Header */}
                <div className="relative h-44 overflow-hidden">
                  {program.imageUrl ? (
                    <img
                      src={program.imageUrl}
                      alt={program.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${color.bg} flex items-center justify-center`}>
                      <BookOpen className={`h-16 w-16 ${color.icon} opacity-30`} />
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Badge */}
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${color.badge} shadow-sm`}>
                    Program
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {program.name}
                  </h3>
                  {program.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {program.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Selengkapnya <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* See All Link */}
        {programs.length > 6 && (
          <div className="text-center mt-10">
            <Link
              href={`${base}/program`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border hover:bg-muted transition-colors text-sm font-medium"
            >
              Lihat Semua Program <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
