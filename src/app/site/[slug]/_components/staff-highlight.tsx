import Link from "next/link"
import { ArrowRight, Users, GraduationCap } from "lucide-react"
import Image from "next/image"
import { normalizeImageUrl } from "@/lib/utils"

interface StaffMember {
  id: string
  name: string
  role: string
  imageUrl?: string | null
  bio?: string | null
}

interface StaffHighlightProps {
  staff: StaffMember[]
  basePath?: string
}

export function StaffHighlight({ staff, labels, basePath = "" }: StaffHighlightProps & { labels?: any }) {

  if (!staff || staff.length === 0) return null

  // Duplicate the array to guarantee seamless infinite scrolling
  const displayStaff = Array.from({ length: Math.max(4, Math.ceil(12 / staff.length)) }).flatMap(() => staff)
  const l = labels?.staff || {}
  
  // Calculate dynamic duration based on number of items (approx 4 seconds per item)
  const animationDuration = `${Math.max(25, displayStaff.length * 4)}s`;

  return (
    <section className="py-16 md:py-20 bg-muted/30 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 text-sky-600 text-xs font-bold tracking-wider uppercase mb-4">
              <Users className="h-3.5 w-3.5" />
              {l.sectionTitle || "Tenaga Pendidik"}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">
              {l.sectionTitle || "Guru & Tenaga Kependidikan"}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">
              {l.sectionSubtitle || "Tim pengajar profesional dan berdedikasi yang siap membimbing siswa menuju kesuksesan."}
            </p>
          </div>
          <Link href={`${basePath}/gtk`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
            {l.buttonText || "Lihat Semua"} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative flex overflow-hidden group/slider -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-4">
          <div 
            className="flex animate-marquee gap-5 shrink-0 items-center pr-5 group-hover/slider:[animation-play-state:paused]"
            style={{ animationDuration }}
          >
            {displayStaff.map((member, i) => (
              <Link key={`${member.id}-${i}`} href={`${basePath}/gtk/${member.id}`} className="group/card text-center flex-shrink-0 w-[140px] md:w-[160px] max-w-full">
                <div className="relative mx-auto w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-border bg-muted mb-4 shadow-sm group-hover/card:shadow-xl group-hover/card:border-primary/30 transition-all duration-300">
                  {member.imageUrl ? (
                    <Image src={normalizeImageUrl(member.imageUrl)!} alt={`Tenaga Pendidik: ${member.name}`} fill className="object-cover object-top group-hover/card:scale-110 transition-transform duration-500" sizes="(max-width: 768px) 128px, 128px" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center">
                      <span className="text-4xl font-bold text-sky-300">{member.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/0 group-hover/card:ring-primary/20 transition-all duration-300" />
                </div>
                <h3 className="font-bold text-sm line-clamp-1 group-hover/card:text-primary transition-colors px-2">{member.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 px-2">{member.role}</p>
              </Link>
            ))}
          </div>
          
          <div 
            aria-hidden="true" 
            className="flex animate-marquee gap-5 shrink-0 items-center pr-5 group-hover/slider:[animation-play-state:paused]"
            style={{ animationDuration }}
          >
            {displayStaff.map((member, i) => (
              <Link key={`${member.id}-clone-${i}`} href={`${basePath}/gtk/${member.id}`} className="group/card text-center flex-shrink-0 w-[140px] md:w-[160px] max-w-full">
                <div className="relative mx-auto w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-border bg-muted mb-4 shadow-sm group-hover/card:shadow-xl group-hover/card:border-primary/30 transition-all duration-300">
                  {member.imageUrl ? (
                    <Image src={normalizeImageUrl(member.imageUrl)!} alt={`Tenaga Pendidik: ${member.name}`} fill className="object-cover object-top group-hover/card:scale-110 transition-transform duration-500" sizes="(max-width: 768px) 128px, 128px" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center">
                      <span className="text-4xl font-bold text-sky-300">{member.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/0 group-hover/card:ring-primary/20 transition-all duration-300" />
                </div>
                <h3 className="font-bold text-sm line-clamp-1 group-hover/card:text-primary transition-colors px-2">{member.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 px-2">{member.role}</p>
              </Link>
            ))}
          </div>

          {/* Optional: Gradient fades to make it look seamless */}
          <div className="absolute inset-y-0 left-0 w-8 md:w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none opacity-50"></div>
          <div className="absolute inset-y-0 right-0 w-8 md:w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none opacity-50"></div>
        </div>
      </div>
    </section>
  )
}
