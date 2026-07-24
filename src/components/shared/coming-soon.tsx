import { Card, CardContent } from "@/components/ui/card"
import { Construction, Rocket, Sparkles, Clock } from "lucide-react"

interface ComingSoonProps {
  title: string
  description?: string
  icon?: React.ElementType
}

export function ComingSoon({ title, description, icon: Icon = Construction }: ComingSoonProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6 min-h-[60vh]">
      <Card className="max-w-lg w-full glass border-0 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
        <CardContent className="flex flex-col items-center text-center p-10">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl shadow-orange-500/20">
              <Icon className="h-12 w-12" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1.5 shadow-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white animate-pulse">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20">
            <Clock className="h-3.5 w-3.5" />
            Segera Hadir
          </div>
          
          <h2 className="text-2xl font-bold tracking-tight mb-2">{title}</h2>
          
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            {description || "Modul ini sedang dalam tahap pengembangan aktif oleh tim BisnisPro. Nantikan pembaruannya segera untuk menikmati fitur luar biasa ini!"}
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-xl border border-border/50">
              <Rocket className="h-4 w-4 text-blue-500" />
              <span>Prioritas Pengembangan</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
