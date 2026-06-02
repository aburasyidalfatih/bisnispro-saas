import React from"react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { BookOpen, Save } from"lucide-react"

interface AcademicSettingsProps {
  rawSettings: any
  setRawSettings: React.Dispatch<React.SetStateAction<any>>
  savingOrg: boolean
  tenantId: string | null
  handleSaveOrg: () => Promise<void>
}

export function AcademicSettings({
  rawSettings, setRawSettings, savingOrg, tenantId, handleSaveOrg
}: AcademicSettingsProps) {
  return (
    <Card className="glass border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Tahun Ajaran</CardTitle>
            <CardDescription>Pengaturan Tahun Ajaran & Semester Aktif</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Tahun Ajaran Aktif</Label>
            <Input 
              value={rawSettings.academicYear ||"2024/2025"} 
              onChange={e => setRawSettings((p:any) => ({ ...p, academicYear: e.target.value }))} 
              placeholder="Contoh: 2024/2025" 
              className="rounded-xl h-9 text-sm" 
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Semester Aktif</Label>
            <select 
              value={rawSettings.academicSemester ||"Ganjil"} 
              onChange={e => setRawSettings((p:any) => ({ ...p, academicSemester: e.target.value }))} 
              className="flex h-9 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
        </div>
        <Button className="btn-gradient text-white border-0 rounded-xl w-full gap-2 h-9" onClick={handleSaveOrg} disabled={savingOrg || !tenantId}>
          {savingOrg ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-3.5 w-3.5" />}
          Simpan Tahun Ajaran
        </Button>
      </CardContent>
    </Card>
  )
}
