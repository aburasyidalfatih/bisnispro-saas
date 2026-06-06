"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Cpu, HardDrive, Server, Activity, RefreshCw, 
  Trash2, Layers, CheckCircle2, AlertCircle, Clock 
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useConfirm } from "@/components/providers/confirm-provider"

interface PM2Process {
  name: string
  status: string
  cpu: number
  memory: number
  uptime: number
}

interface ServiceStatus {
  name: string
  type: string
  status: "online" | "offline"
  meta: string
}

interface SystemMetrics {
  ram: {
    total: number
    used: number
    free: number
    usagePercentage: number
  }
  cpu: {
    cores: number
    model: string
    loadAverage: number[]
    usagePercentage: number
  }
  disk: {
    total: number
    used: number
    free: number
    usagePercentage: number
  }
  os: {
    platform: string
    release: string
    uptime: number
  }
  pm2: PM2Process[]
  services: ServiceStatus[]
  timestamp: number
}

export function SystemHealth() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const { confirm } = useConfirm()

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/super-admin/system")
      const data = await res.json()
      setMetrics(data)
    } catch (error) {
      console.error("Failed to fetch system metrics")
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = async () => {
    if (!(await confirm({ 
      title: "Bersihkan Cache Redis?", 
      description: "Ini akan memaksa sistem mengambil data segar dari database." 
    }))) return
    
    setClearing(true)
    try {
      const res = await fetch("/api/super-admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-cache" }),
      })
      
      if (res.ok) {
        toast({ title: "Berhasil", description: "Cache Redis telah dibersihkan." })
      } else {
        throw new Error("Gagal membersihkan cache")
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setClearing(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 15000)
    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const parts = []
    if (d > 0) parts.push(`${d}d`)
    if (h > 0) parts.push(`${h}h`)
    if (m > 0) parts.push(`${m}m`)
    return parts.join(" ") || "< 1m"
  }

  const formatRelativeTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return formatUptime(seconds)
  }

  if (loading && !metrics) {
    return (
      <Card className="glass border-0">
        <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="glass border-0 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-500" />
                Kesehatan Sistem (VPS Host)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Pemantauan sumber daya server secara real-time.</CardDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 rounded-xl bg-white/50 border-orange-200 text-orange-600 hover:bg-orange-50 gap-2 text-xs"
                onClick={handleClearCache}
                disabled={clearing}
              >
                {clearing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Clear Redis</span><span className="sm:hidden">Cache</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-xl"
                onClick={() => { setLoading(true); fetchMetrics(); }} 
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-4">
            {/* RAM Usage */}
            <div className="space-y-3 bg-background/50 p-4 rounded-xl border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <HardDrive className="h-4 w-4 text-emerald-500" />
                  Memori (RAM)
                </div>
                <span className="text-sm font-semibold">{metrics.ram.usagePercentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    metrics.ram.usagePercentage > 85 ? "bg-red-500" : metrics.ram.usagePercentage > 70 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${metrics.ram.usagePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Terpakai: {formatBytes(metrics.ram.used)}</span>
                <span>Total: {formatBytes(metrics.ram.total)}</span>
              </div>
            </div>

            {/* CPU Usage */}
            <div className="space-y-3 bg-background/50 p-4 rounded-xl border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  CPU ({metrics.cpu.cores} Cores)
                </div>
                <span className="text-sm font-semibold">~{metrics.cpu.usagePercentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    metrics.cpu.usagePercentage > 85 ? "bg-red-500" : metrics.cpu.usagePercentage > 70 ? "bg-amber-500" : "bg-blue-500"
                  )}
                  style={{ width: `${metrics.cpu.usagePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="truncate max-w-[150px] max-w-full" title={metrics.cpu.model}>{metrics.cpu.model}</span>
                <span>Load: {metrics.cpu.loadAverage[0].toFixed(2)}</span>
              </div>
            </div>

            {/* Disk Usage */}
            {metrics.disk && (
              <div className="space-y-3 bg-background/50 p-4 rounded-xl border border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <HardDrive className="h-4 w-4 text-violet-500" />
                    Penyimpanan (Disk)
                  </div>
                  <span className="text-sm font-semibold">{metrics.disk.usagePercentage}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      metrics.disk.usagePercentage > 85 ? "bg-red-500" : metrics.disk.usagePercentage > 70 ? "bg-amber-500" : "bg-violet-500"
                    )}
                    style={{ width: `${metrics.disk.usagePercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Terpakai: {formatBytes(metrics.disk.used)}</span>
                  <span>Total: {formatBytes(metrics.disk.total)}</span>
                </div>
              </div>
            )}

            {/* Status Host */}
            <div className="space-y-3 bg-background/50 p-4 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <Activity className="h-4 w-4 text-orange-500" />
                Status Host
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-medium">{formatUptime(metrics.os.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform</span>
                  <span className="font-medium">{metrics.os.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Check</span>
                  <span className="font-medium">{new Date(metrics.timestamp).toLocaleTimeString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PM2 Processes */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        {metrics.pm2.map((proc) => (
          <Card key={proc.name} className="glass border-0 overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl",
                  proc.status === "online" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                )}>
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{proc.name}</h3>
                    {proc.status === "online" ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {proc.cpu}%</span>
                    <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> {formatBytes(proc.memory)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatRelativeTime(proc.uptime)}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={cn(
                "rounded-lg text-[10px] px-2 py-0.5",
                proc.status === "online" ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" : "border-red-500/30 text-red-600 bg-red-500/5"
              )}>
                {proc.status.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Services Dependencies */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {metrics.services?.map((svc) => (
          <Card key={svc.name} className="glass border-0 overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  svc.status === "online" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                )}>
                  {svc.type === "database" ? <HardDrive className="h-5 w-5" /> : 
                   svc.type === "cache" ? <Server className="h-5 w-5" /> : 
                   <Activity className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{svc.name}</h3>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                    {svc.status === "online" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertCircle className="h-3 w-3 text-red-500" />}
                    <span>{svc.meta}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={cn(
                "rounded-lg text-[10px] px-2 py-0.5",
                svc.status === "online" ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" : "border-red-500/30 text-red-600 bg-red-500/5"
              )}>
                {svc.status.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: string }) {
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
      {children}
    </div>
  )
}
