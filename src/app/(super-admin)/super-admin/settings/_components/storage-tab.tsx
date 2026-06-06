import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HardDrive, Cloud, Save, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SettingsForm } from "../constants"

interface StorageTabProps {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  handleSaveBatch: (fields: string[], overrides?: Record<string, string>) => Promise<void>;
  saving: boolean;
}

export function StorageTab({ form, setForm, handleSaveBatch, saving }: StorageTabProps) {
  const [showS3Secret, setShowS3Secret] = useState(false)

  return (
    <div className="grid gap-6 lg:grid-cols-2 outline-none">
      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10"><HardDrive className="h-4 w-4 text-orange-500" /></div>
            <CardTitle className="text-lg">Tipe Penyimpanan</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Pilih Provider Storage</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => {
                  setForm({...form, STORAGE_PROVIDER: "local"})
                  handleSaveBatch(['STORAGE_PROVIDER'], { STORAGE_PROVIDER: "local" })
                }}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-200 gap-2",
                  form.STORAGE_PROVIDER === "local" ? "border-orange-500 bg-orange-500/10 text-orange-600" : "border-border hover:bg-muted text-muted-foreground"
                )}
              >
                <HardDrive className="h-6 w-6" />
                <span className="font-semibold text-sm">Lokal (VPS Disk)</span>
              </Button>
              <Button
                onClick={() => {
                  setForm({...form, STORAGE_PROVIDER: "s3"})
                  handleSaveBatch(['STORAGE_PROVIDER'], { STORAGE_PROVIDER: "s3" })
                }}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-200 gap-2",
                  form.STORAGE_PROVIDER === "s3" ? "border-orange-500 bg-orange-500/10 text-orange-600" : "border-border hover:bg-muted text-muted-foreground"
                )}
              >
                <Cloud className="h-6 w-6" />
                <span className="font-semibold text-sm">S3 / Cloudflare R2</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2">
              Mengubah penyimpanan ke S3/R2 akan membuat semua <strong>unggahan baru</strong> masuk ke Cloud. File lama akan tetap dibaca dari Lokal.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("glass border-0 transition-opacity", form.STORAGE_PROVIDER === "local" && "opacity-50 pointer-events-none")}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10"><Cloud className="h-4 w-4 text-orange-500" /></div>
            <CardTitle className="text-lg">Kredensial S3 API</CardTitle>
          </div>
          <CardDescription>Gunakan endpoint kompatibel S3 (seperti AWS, DigitalOcean Spaces, atau Cloudflare R2).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>S3 Endpoint</Label>
            <Input value={form.S3_ENDPOINT} onChange={e => setForm({...form, S3_ENDPOINT: e.target.value})} placeholder="https://<account_id>.r2.cloudflarestorage.com" className="rounded-xl font-mono text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Region</Label>
              <Input value={form.S3_REGION} onChange={e => setForm({...form, S3_REGION: e.target.value})} placeholder="auto" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Bucket Name</Label>
              <Input value={form.S3_BUCKET} onChange={e => setForm({...form, S3_BUCKET: e.target.value})} placeholder="schoolpro-assets" className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Access Key ID</Label>
            <Input value={form.S3_ACCESS_KEY} onChange={e => setForm({...form, S3_ACCESS_KEY: e.target.value})} placeholder="Access Key" className="rounded-xl font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label>Secret Access Key</Label>
            <div className="relative">
              <Input type={showS3Secret ? "text" : "password"} value={form.S3_SECRET_KEY} onChange={e => setForm({...form, S3_SECRET_KEY: e.target.value})} placeholder="Secret Key" className="rounded-xl font-mono text-xs pr-10" />
              <Button type="button" onClick={() => setShowS3Secret(!showS3Secret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showS3Secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Public URL / Custom Domain</Label>
            <Input value={form.S3_PUBLIC_URL} onChange={e => setForm({...form, S3_PUBLIC_URL: e.target.value})} placeholder="https://pub-<id>.r2.dev" className="rounded-xl font-mono text-xs" />
            <p className="text-[10px] text-muted-foreground">URL dasar untuk mengakses file dari publik. Jangan akhiri dengan slash (/).</p>
          </div>
          <Button className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-xl mt-2" onClick={() => handleSaveBatch(['S3_ENDPOINT', 'S3_REGION', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET', 'S3_PUBLIC_URL'])} disabled={saving}>
            <Save className="h-4 w-4" /> Simpan Konfigurasi S3
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
