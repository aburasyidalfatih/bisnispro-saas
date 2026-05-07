"use client"

import Link from "next/link"
import { ArrowRight, Users } from "lucide-react"
import { useRouting } from "@/components/providers/routing-provider"

interface StaffMember {
  id: string
  name: string
  role: string
  imageUrl?: string | null
  bio?: string | null
}

interface StaffHighlightProps {
  staff: StaffMember[]
}

export function StaffHighlight({ staff }: StaffHighlightProps) {
  const { resolveHref } = useRouting()

  if (!staff || staff.length === 0) return null

  const displayed = staff.slice(0, 6)

  return (
    <section className="py-16 md:py-20 bg-muted/30 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 text-sky-600 text-xs font-bold tracking-wider uppercase mb-4">
              <Users className="h-3.5 w-3.5" />
              Tenaga Pendidik
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">Guru & Tenaga Kependidikan</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">
              Tim pengajar profesional dan berdedikasi yang siap membimbing siswa menuju kesuksesan.
            </p>
          </div>
          <Link href={resolveHref("/gtk")} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
          {displayed.map((member) => (
            <Link key={member.id} href={resolveHref(`/gtk/${member.id}`)} className="group text-center">
              <div className="relative mx-auto w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-border bg-muted mb-4 shadow-sm group-hover:shadow-xl group-hover:border-primary/30 transition-all duration-300">
                {member.imageUrl ? (
                  <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center">
                    <span className="text-4xl font-bold text-sky-300">{member.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/0 group-hover:ring-primary/20 transition-all duration-300" />
              </div>
              <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{member.name}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{member.role}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
