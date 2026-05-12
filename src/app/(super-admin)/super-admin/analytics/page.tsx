import { ComingSoon } from "@/components/shared/coming-soon"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analitik Pendapatan & Platform</h1>
        <p className="text-muted-foreground mt-1">Pantau statistik lengkap mengenai pendapatan, pertumbuhan tenant, dan penggunaan platform.</p>
      </div>

      <ComingSoon 
        title="Modul Analitik" 
        icon={BarChart3} 
        description="Fitur pelaporan komprehensif dan analitik pendapatan Super Admin sedang dalam tahap pengembangan." 
      />
    </div>
  )
}
