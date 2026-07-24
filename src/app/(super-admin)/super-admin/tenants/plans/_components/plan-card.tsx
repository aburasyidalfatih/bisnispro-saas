import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Zap, Star, CheckCircle2, Users, Edit, HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"
import { SubscriptionPlan } from "./types"

interface PlanCardProps {
  plan: SubscriptionPlan
  pricing: { PRICE_PER_STUDENT: string; MIN_STUDENTS: string }
  onEdit: (plan: SubscriptionPlan) => void
  onToggleActive: (plan: SubscriptionPlan) => void
}

export function PlanCard({ plan, pricing, onEdit, onToggleActive }: PlanCardProps) {
  const feats = Array.isArray(plan.features) ? plan.features : []

  return (
    <Card className={cn("glass border-0 overflow-hidden relative", plan.isPopular && "ring-2 ring-primary/30")}>
      <div className={cn("h-1.5", plan.slug === "free" ? "bg-slate-400" : "bg-gradient-to-r from-primary to-primary/60")} />
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl", plan.slug === "free" ? "bg-slate-100 text-slate-600" : "bg-primary/10 text-primary")}>
              {plan.slug === "free" ? <Zap className="h-5 w-5" /> : <Star className={cn("h-5 w-5", plan.isPopular && "fill-primary")} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>{plan.name}</CardTitle>
                {plan.isPopular && <Badge className="bg-primary/10 text-primary text-[10px] h-5">Populer</Badge>}
                {!plan.isActive && <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">Nonaktif</Badge>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {plan.slug !== "free" && (
              <div className="flex items-center gap-1.5 mr-1">
                <Switch
                  id={`active-${plan.id}`}
                  checked={plan.isActive}
                  onCheckedChange={() => onToggleActive(plan)}
                  className="scale-90"
                />
              </div>
            )}
            <Button variant="outline" size="sm" className="gap-1 rounded-lg h-7 px-2 text-[10px]" onClick={() => onEdit(plan)}>
              <Edit className="h-3 w-3" /> Edit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price */}
        <div className="text-2xl font-bold">
          {plan.slug === "pro" ? (
            <div>
              <span className="text-base text-primary block font-bold">Pay-per-Student</span>
              <span className="text-[10px] font-normal text-muted-foreground block mt-0.5">
                Rp {Number(pricing.PRICE_PER_STUDENT).toLocaleString("id-ID")}/klien/thn · min. {pricing.MIN_STUDENTS}
              </span>
            </div>
          ) : (
            <>
              Rp {plan.price.toLocaleString("id-ID")}
              <span className="text-xs font-normal text-muted-foreground">
                {plan.interval === "MONTHLY" ? " / bulan" : plan.interval === "YEARLY" ? " / tahun" : " / sekali bayar"}
              </span>
            </>
          )}
        </div>

        {/* Quotas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
            <p className="text-[9px] uppercase text-muted-foreground mb-0.5">Kuota Klien</p>
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-primary" />
              <span className="font-bold text-xs truncate">
                {plan.slug === "pro" ? "Sesuai Beli" : plan.maxTeamMembers === 0 ? "Unlimited" : `${plan.maxTeamMembers} klien`}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
            <p className="text-[9px] uppercase text-muted-foreground mb-0.5">Penyimpanan</p>
            <div className="flex items-center gap-1.5">
              <HardDrive className="h-3 w-3 text-primary" />
              <span className="font-bold text-xs truncate">
                {plan.maxStorage === 0 ? "Unlimited" : plan.maxStorage >= 1024 ? `${(plan.maxStorage / 1024).toFixed(1)} GB` : `${plan.maxStorage} MB`}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
            <p className="text-[9px] uppercase text-muted-foreground mb-0.5">Bonus AI (Bln)</p>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-primary" />
              <span className="font-bold text-xs truncate">
                {plan.monthlyAiTokens > 0 ? `${plan.monthlyAiTokens.toLocaleString("id-ID")} Token` : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Features */}
        {feats.length > 0 && (
          <ul className="space-y-1.5">
            {feats.slice(0, 5).map((f: string, i: number) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
            {feats.length > 5 && (
              <li className="text-xs text-muted-foreground pl-6">+ {feats.length - 5} fitur lainnya</li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
