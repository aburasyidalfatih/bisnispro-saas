import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trophy, Medal, Award, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export const dynamic = "force-dynamic"

export default async function AffiliateLeaderboardPage() {
  const topAffiliates = await db.affiliateProfile.findMany({
    where: { isActive: true },
    orderBy: { totalEarnings: "desc" },
    take: 10,
    include: {
      user: {
        select: {
          name: true,
          image: true
        }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" /> Leaderboard Afiliasi
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Top 10 Mitra Afiliasi dengan total komisi tertinggi sepanjang masa.</p>
      </div>

      <div className="grid gap-4">
        {topAffiliates.length === 0 ? (
          <Card className="glass border-0">
            <CardContent className="py-10 text-center text-muted-foreground">
              Belum ada data leaderboard saat ini.
            </CardContent>
          </Card>
        ) : (
          topAffiliates.map((profile, index) => {
            const isTop3 = index < 3;
            return (
              <Card 
                key={profile.id} 
                className={cn(
                  "glass border-0 overflow-hidden transition-all duration-300 hover:shadow-md",
                  index === 0 ? "bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border-l-4 border-l-yellow-500" :
                  index === 1 ? "bg-gradient-to-r from-slate-400/10 via-slate-400/5 to-transparent border-l-4 border-l-slate-400" :
                  index === 2 ? "bg-gradient-to-r from-amber-700/10 via-amber-700/5 to-transparent border-l-4 border-l-amber-700" :
                  "border-l-4 border-l-transparent"
                )}
              >
                <CardContent className="p-4 sm:p-6 flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 text-center font-bold text-2xl text-muted-foreground/50">
                    #{index + 1}
                  </div>
                  
                  <div className="relative">
                    {profile.user.image ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-background shadow-sm">
                        <Image src={profile.user.image} alt={profile.user.name || "User"} width={48} height={48} className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border-2 border-background shadow-sm">
                        {(profile.user.name || "U")[0].toUpperCase()}
                      </div>
                    )}
                    
                    {index === 0 && <Medal className="w-6 h-6 text-yellow-500 absolute -bottom-2 -right-2 drop-shadow-sm" fill="currentColor" />}
                    {index === 1 && <Medal className="w-6 h-6 text-slate-400 absolute -bottom-2 -right-2 drop-shadow-sm" fill="currentColor" />}
                    {index === 2 && <Medal className="w-6 h-6 text-amber-700 absolute -bottom-2 -right-2 drop-shadow-sm" fill="currentColor" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={cn("font-bold text-lg truncate", isTop3 ? "text-foreground" : "text-foreground/80")}>
                      {profile.user.name || "Pengguna Tanpa Nama"}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-emerald-500" />
                        Terdaftar sejak {new Date(profile.createdAt).toLocaleDateString("id-ID", { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Komisi</p>
                    <p className={cn(
                      "font-black text-xl",
                      index === 0 ? "text-yellow-600" :
                      index === 1 ? "text-slate-600" :
                      index === 2 ? "text-amber-800" :
                      "text-emerald-600"
                    )}>
                      Rp {profile.totalEarnings.toLocaleString("id-ID")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
