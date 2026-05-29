import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, RefreshCw, Archive, HardDrive, Timer, Server, CheckCircle2, XCircle, Download, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

export function BackupTab() {
  const [backupData, setBackupData] = useState<any>(null)
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupRunning, setBackupRunning] = useState(false)
  const [showBackupLog, setShowBackupLog] = useState(false)

  async function fetchBackupData() {
    setBackupLoading(true)
    try {
      const res = await fetch("/api/super-admin/backup")
      if (res.ok) {
        const data = await res.json()
        setBackupData(data)
      } else {
        toast({ title: "Gagal memuat data backup", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error koneksi", variant: "destructive" })
    } finally {
      setBackupLoading(false)
    }
  }

  useEffect(() => {
    fetchBackupData()
  }, [])

  async function handleManualBackup() {
    setBackupRunning(true)
    try {
      const res = await fetch("/api/super-admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "backup" }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "✅ Backup dimulai", description: data.message })
        setTimeout(() => fetchBackupData(), 10000)
      } else {
        toast({ title: "❌ Gagal", description: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Tidak dapat menjalankan backup", variant: "destructive" })
    } finally {
      setTimeout(() => setBackupRunning(false), 5000)
    }
  }

  async function handleDownloadBackup(filename: string) {
    try {
      const res = await fetch("/api/super-admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "download", filename }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast({ title: "Gagal", description: err.error, variant: "destructive" })
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
      toast({ title: "✅ Download dimulai", description: filename })
    } catch {
      toast({ title: "Error download", variant: "destructive" })
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 outline-none">
      {/* Status Overview */}
      <Card className="glass border-0 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10"><Database className="h-4 w-4 text-emerald-500" /></div>
              <div>
                <CardTitle className="text-lg">Backup Database</CardTitle>
                <CardDescription>Kelola backup otomatis PostgreSQL ke Google Drive</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={fetchBackupData} disabled={backupLoading}>
              <RefreshCw className={cn("h-3.5 w-3.5", backupLoading && "animate-spin")} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {backupLoading && !backupData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
            </div>
          ) : backupData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                <Archive className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-600">{backupData.totalBackupCount || 0}</p>
                <p className="text-xs text-muted-foreground">Backup Lokal</p>
              </div>
              <div className="rounded-xl border-2 border-blue-500/20 bg-blue-500/5 p-4 text-center">
                <HardDrive className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{backupData.totalBackupSize || "0 B"}</p>
                <p className="text-xs text-muted-foreground">Total Ukuran</p>
              </div>
              <div className="rounded-xl border-2 border-purple-500/20 bg-purple-500/5 p-4 text-center">
                <Database className="h-5 w-5 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{backupData.dbSize || "N/A"}</p>
                <p className="text-xs text-muted-foreground">Ukuran Database</p>
              </div>
              <div className="rounded-xl border-2 border-orange-500/20 bg-orange-500/5 p-4 text-center">
                <Timer className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-orange-600">
                  {backupData.backups?.[0]
                    ? new Date(backupData.backups[0].createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                    : "Belum ada"}
                </p>
                <p className="text-xs text-muted-foreground">Backup Terakhir</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Data backup tidak tersedia.</p>
          )}
        </CardContent>
      </Card>

      {/* Infrastruktur Status */}
      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"><Server className="h-4 w-4 text-blue-500" /></div>
            <CardTitle className="text-lg">Status Infrastruktur</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "rclone Terinstal", ok: backupData?.rcloneInstalled, desc: "Tool untuk upload ke Google Drive" },
            { label: "Google Drive Terhubung", ok: backupData?.gdriveConnected, desc: "Remote 'gdrive:' tersedia di rclone" },
            { label: "Cron Terjadwal", ok: backupData?.cronConfigured, desc: "Backup otomatis terdaftar di crontab" },
          ].map(item => (
            <div key={item.label} className={cn(
              "flex items-center justify-between rounded-xl border-2 p-3 transition-all",
              item.ok ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"
            )}>
              <div className="flex items-center gap-3">
                {item.ok
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  : <XCircle className="h-5 w-5 text-amber-500" />
                }
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <span className={cn(
                "text-xs font-semibold px-2 py-1 rounded-lg",
                item.ok ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
              )}>
                {item.ok ? "Aktif" : "Belum"}
              </span>
            </div>
          ))}

          {backupData && !backupData.rcloneInstalled && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mt-2">
              <p className="text-xs text-amber-700 font-medium mb-1">📖 Cara Setup:</p>
              <p className="text-xs text-amber-600">SSH ke VPS → jalankan perintah di bawah ini:</p>
              <code className="block text-[10px] bg-amber-100 p-2 rounded-lg mt-1 font-mono">curl https://rclone.org/install.sh | sudo bash && rclone config</code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aksi */}
      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Download className="h-4 w-4 text-primary" /></div>
            <CardTitle className="text-lg">Aksi</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full gap-2 btn-gradient text-white border-0 rounded-xl h-12 opacity-80 cursor-not-allowed"
            disabled={true}
          >
            <Database className="h-4 w-4" /> Backup Manual via UI Dinonaktifkan
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            Sistem SchoolPro berjalan di dalam Docker yang aman. Backup otomatis sudah dijadwalkan berjalan setiap jam 02:00 WIB. Untuk backup manual seketika, gunakan terminal VPS: <code>./scripts/backup-db.sh</code>
          </p>

          {backupData?.lastBackupLog && (
            <div className="mt-4">
              <button
                onClick={() => setShowBackupLog(!showBackupLog)}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                {showBackupLog ? "Sembunyikan" : "Lihat"} Log Terakhir
              </button>
              {showBackupLog && (
                <pre className="mt-2 rounded-xl bg-slate-950 text-emerald-400 p-4 text-[10px] font-mono overflow-x-auto max-h-48 overflow-y-auto">
                  {backupData.lastBackupLog}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daftar Backup */}
      <Card className="glass border-0 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Archive className="h-4 w-4 text-primary" /></div>
            <CardTitle className="text-lg">Riwayat Backup</CardTitle>
          </div>
          <CardDescription>File backup database yang tersimpan di server VPS.</CardDescription>
        </CardHeader>
        <CardContent>
          {!backupData?.backups?.length ? (
            <div className="text-center py-8">
              <Archive className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Belum ada backup.</p>
              <p className="text-xs text-muted-foreground mt-1">Klik "Jalankan Backup Sekarang" untuk membuat backup pertama.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backupData.backups.map((backup: any, idx: number) => (
                <div
                  key={backup.name}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 transition-all hover:bg-muted/50",
                    idx === 0 && "border-emerald-500/30 bg-emerald-500/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      idx === 0 ? "bg-emerald-500/10" : "bg-muted"
                    )}>
                      <Database className={cn("h-4 w-4", idx === 0 ? "text-emerald-500" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        {backup.name}
                        {idx === 0 && <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-md font-semibold">Terbaru</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(backup.createdAt).toLocaleString("id-ID", {
                          day: "numeric", month: "long", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                        {" · "}{backup.sizeHuman}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1.5 text-xs"
                    onClick={() => handleDownloadBackup(backup.name)}
                  >
                    <Download className="h-3.5 w-3.5" /> Unduh
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
