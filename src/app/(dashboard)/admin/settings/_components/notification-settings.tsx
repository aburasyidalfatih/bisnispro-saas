import React from"react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Bell, Mail, Phone, ArrowRight } from"lucide-react"
import { cn } from"@/lib/utils"
import { NotifRecentList } from"./notif-recent-list"
import { Button } from "@/components/ui/button"

interface NotificationSettingsProps {
  isAdminRole: boolean
  notifPrefs: Record<string, boolean>
  toggleNotif: (channel: string) => Promise<void>
}

export function NotificationSettings({
  isAdminRole, notifPrefs, toggleNotif
}: NotificationSettingsProps) {
  return (
    <Card className={`glass border-0 ${isAdminRole ?"lg:col-span-2" :""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Preferensi Notifikasi</CardTitle>
              <CardDescription>Aktifkan channel notifikasi yang ingin Anda terima</CardDescription>
            </div>
          </div>
          <a href="/admin/notifications/preferences"
            className="text-xs text-primary hover:underline flex items-center gap-1">
            Pengaturan lanjutan <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle channels */}
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { key:"inapp", name:"In-App", desc:"Notifikasi di dalam aplikasi", icon: Bell, hint: null },
            { key:"email", name:"Email", desc:"Dikirim ke email akun Anda", icon: Mail, hint:"Butuh konfigurasi SMTP" },
            { key:"whatsapp", name:"WhatsApp", desc:"Internal Gateway (Recommended)", icon: Phone, hint:"Butuh konfigurasi WhatsApp" },
          ].map((ch) => {
            const active = notifPrefs[ch.key] ?? false
            return (
              <div key={ch.key}
                className={cn("flex items-center justify-between rounded-xl border-2 px-3 py-3 transition-all duration-200",
                  active ?"border-primary/30 bg-primary/5" :"border-transparent bg-muted/40"
                )}>
                <div className="flex items-center gap-2.5">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                    active ?"bg-primary/10" :"bg-muted")}>
                    <ch.icon className={cn("h-4 w-4", active ?"text-primary" :"text-muted-foreground")} />
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold leading-tight", active ?"text-primary" :"text-foreground")}>{ch.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{ch.desc}</p>
                    {!active && ch.hint && <p className="text-[10px] text-amber-500 leading-tight">{ch.hint}</p>}
                  </div>
                </div>
                <Button onClick={() => toggleNotif(ch.key)}
                  className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ml-2",
                    active ?"bg-primary" :"bg-muted-foreground/30")}
                  role="switch" aria-checked={active}>
                  <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                    active ?"translate-x-4" :"translate-x-0.5")} />
                </Button>
              </div>
            )
          })}
        </div>

        {/* Separator + notifikasi terbaru */}
        <NotifRecentList />
      </CardContent>
    </Card>
  )
}
