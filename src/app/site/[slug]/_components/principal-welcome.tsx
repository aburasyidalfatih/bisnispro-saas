"use client"

import { Quote } from "lucide-react"

interface PrincipalWelcomeProps {
  tenantName: string
  settings?: any
  staff?: any[]
}

export function PrincipalWelcome({ tenantName, settings, staff = [] }: PrincipalWelcomeProps) {
  const principalStaff = staff.find((s: any) => s.role && s.role.toLowerCase().includes("kepala sekolah"))

  const principalName = principalStaff ? principalStaff.name : (settings?.principalName || "Ir. Sherly Puspita, M.Pd")
  const principalTitle = principalStaff ? principalStaff.role : (settings?.principalTitle || "Kepala Sekolah")
  const principalImage = principalStaff 
    ? (principalStaff.imageUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2076")
    : (settings?.principalImage || "/principal_portrait.png")
  const principalMessage = settings?.principalMessage || `Puji syukur ke hadirat Tuhan YME atas segala rahmat dan karunia-Nya. Selamat datang di website resmi ${tenantName}. Website ini kami hadirkan sebagai sarana informasi dan komunikasi antara sekolah dengan orang tua, peserta didik, serta masyarakat luas.\n\nMelalui media ini, kami berharap seluruh informasi mengenai kegiatan, prestasi, serta program pendidikan dapat tersampaikan secara transparan, cepat, dan akurat. Kami berkomitmen untuk terus meningkatkan kualitas pendidikan dan mencetak generasi penerus bangsa yang unggul dan berkarakter.`
  const principalBadgeYear = settings?.principalBadgeYear || "2015"

  const paragraphs = principalMessage.split("\n").filter((p: string) => p.trim() !== "")

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16 items-center">
          
          {/* Left Column - Image */}
          <div className="relative mx-auto lg:mx-0 max-w-[260px] w-full">
            {/* Subtle decorative frame behind image */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[2.5rem] transform rotate-3 scale-105 opacity-50 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-accent rounded-3xl transform -rotate-2 scale-105 opacity-10" />
            
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-background bg-background aspect-[4/5]">
              <img 
                src={principalImage} 
                alt={principalName} 
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
              />
              {/* Optional: Add a subtle overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-60" />
            </div>
            
            {/* Floating badge */}
            <div className="absolute -bottom-6 -right-6 bg-background rounded-2xl p-4 shadow-xl border flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Quote size={24} className="fill-primary/20" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Berdedikasi</p>
                <p className="text-sm font-bold">Sejak {principalBadgeYear}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-block text-accent font-bold tracking-widest text-sm uppercase">
                Welcome Section
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">
                Sambutan Kepala Sekolah
              </h2>
              {/* Decorative Line */}
              <div className="h-1.5 w-24 bg-gradient-to-r from-accent to-primary rounded-full" />
            </div>

            <div className="space-y-6 text-muted-foreground text-base md:text-lg leading-relaxed relative">
              <Quote size={64} className="absolute -top-6 -left-8 text-primary/5 -z-10 transform -scale-x-100" />
              
              {paragraphs.map((p: string, idx: number) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div className="pt-4 border-t border-border/60 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">{principalName}</h3>
                <p className="text-primary font-medium mt-1">{principalTitle}</p>
              </div>
              {/* Signature (Simulated with a fancy font or just text) */}
              <div className="hidden sm:block opacity-60">
                <span className="font-serif italic text-3xl text-foreground">
                  {principalName.split(' ')[1] || principalName.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
