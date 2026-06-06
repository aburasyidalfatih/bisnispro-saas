import React from"react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Camera, Save } from"lucide-react"
import { cn } from"@/lib/utils"

interface AttendanceSettingsProps {
  rawSettings: any
  setRawSettings: React.Dispatch<React.SetStateAction<any>>
  savingOrg: boolean
  tenantId: string | null
  handleSaveOrg: () => Promise<void>
}

export function AttendanceSettings({
  rawSettings, setRawSettings, savingOrg, tenantId, handleSaveOrg
}: AttendanceSettingsProps) {
  return (
    <Card className="glass border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Camera className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Pengaturan Absensi</CardTitle>
            <CardDescription>Atur kebijakan absensi GTK</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border-2 border-transparent bg-muted/40 px-3 py-3 transition-all duration-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 bg-primary/10">
              <Camera className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-foreground">Wajibkan Foto Selfie</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Guru harus mengambil foto wajah saat check-in</p>
            </div>
          </div>
          <Button onClick={() => setRawSettings((p:any) => ({ ...p, attendanceRequireSelfie: !p.attendanceRequireSelfie }))}
            className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ml-2",
              rawSettings.attendanceRequireSelfie ?"bg-primary" :"bg-muted-foreground/30")}
            role="switch" aria-checked={rawSettings.attendanceRequireSelfie}>
            <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
              rawSettings.attendanceRequireSelfie ?"translate-x-4" :"translate-x-0.5")} />
          </Button>
        </div>
        
        <Button className="btn-gradient text-white border-0 rounded-xl w-full gap-2 h-9" onClick={handleSaveOrg} disabled={savingOrg || !tenantId}>
          {savingOrg ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-3.5 w-3.5" />}
          Simpan Pengaturan Absensi
        </Button>
      </CardContent>
    </Card>
  )
}
