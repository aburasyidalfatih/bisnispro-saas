import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Globe, AlertCircle, Save, Info } from"lucide-react"
import { DomainData } from"./types"

interface ConfigDomainCardProps {
  data: DomainData | null
  domainInput: string
  setDomainInput: (value: string) => void
  saving: boolean
  handleSave: () => Promise<void>
}

export function ConfigDomainCard({
  data,
  domainInput,
  setDomainInput,
  saving,
  handleSave,
}: ConfigDomainCardProps) {
  return (
    <Card className="glass border-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Konfigurasi Domain</CardTitle>
            <CardDescription>Masukkan domain yang ingin Anda hubungkan</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data && data.isCustomDomainEnabled === false && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-4">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Fitur Terkunci</p>
              <p className="text-xs text-muted-foreground">
                {data.lockedMessage ||"Fitur Custom Domain saat ini dinonaktifkan."}
              </p>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label>Custom Domain</Label>
          <div className="flex gap-2">
            <Input
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value.toLowerCase().trim())}
              placeholder="contoh: mybusiness.com"
              className="rounded-xl font-mono"
              disabled={data?.isCustomDomainEnabled === false}
            />
            <button
              className="flex items-center justify-center h-10 px-4 btn-gradient text-white border-0 rounded-xl gap-2 shrink-0"
              onClick={handleSave}
              disabled={saving || !domainInput.trim() || data?.isCustomDomainEnabled === false}
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Masukkan domain tanpa <code className="bg-muted px-1 rounded">https://</code> atau{""}
            <code className="bg-muted px-1 rounded">www.</code>
          </p>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Setelah menyimpan domain, Anda perlu menambahkan DNS record dan melakukan verifikasi.
            Subdomain default tetap aktif selama custom domain belum terverifikasi.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`}>{children}</label>
}
