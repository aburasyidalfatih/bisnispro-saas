import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { Globe, AlertCircle, Save, ExternalLink, ShieldCheck, ShieldOff } from"lucide-react"
import { cn } from"@/lib/utils"
import { DomainData } from"./types"
import { StatusBadge } from"./status-badge"

interface ActiveUrlCardProps {
  data: DomainData | null
  subdomain: string | null
  subdomainInput: string
  setSubdomainInput: (value: string) => void
  rootDomain: string
  savingSubdomain: boolean
  handleSaveSubdomain: () => Promise<void>
  hasCustomDomain: boolean
  isVerified: boolean
}

export function ActiveUrlCard({
  data,
  subdomain,
  subdomainInput,
  setSubdomainInput,
  rootDomain,
  savingSubdomain,
  handleSaveSubdomain,
  hasCustomDomain,
  isVerified,
}: ActiveUrlCardProps) {
  const customDomain = data?.customDomain

  return (
    <Card className="glass border-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">URL Website Aktif</CardTitle>
            <CardDescription>Domain yang saat ini melayani website Anda</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Subdomain default */}
        <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Domain Utama</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                <span>{subdomain ||"—"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-1 font-bold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AKTIF
            </span>
            {subdomain && (
              <a
                href={`http://${subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-white rounded-lg"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Form Ubah Subdomain */}
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold">Ubah Subdomain</p>
            <p className="text-xs text-muted-foreground mt-1">Anda hanya dapat mengganti subdomain <strong>1 kali</strong>. Pastikan Anda memilih nama yang mudah diingat dan tidak terlalu panjang (cth: <code className="bg-muted px-1 rounded">smpn1</code>).</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center rounded-xl border bg-background px-3 focus-within:ring-1 focus-within:ring-primary">
              <Input
                value={subdomainInput}
                onChange={(e) => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="nama-sekolah"
                className="border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none"
                disabled={data?.hasChangedSubdomain}
              />
              <span className="text-muted-foreground text-sm pl-2 border-l shrink-0">
                .{rootDomain}
              </span>
            </div>
            <ConfirmDialog
              trigger={
                <button
                  className="flex items-center justify-center h-10 px-4 btn-gradient text-white border-0 rounded-xl gap-2 shrink-0"
                  disabled={savingSubdomain || !subdomainInput.trim() || data?.hasChangedSubdomain || subdomainInput === data?.slug}
                >
                  {savingSubdomain ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Ganti Subdomain
                </button>
              }
              title="Yakin ingin mengganti subdomain?"
              description={<span className="block space-y-2">
                <span>Jika Anda mengubah subdomain menjadi <strong>{subdomainInput}.{rootDomain}</strong>:</span>
                <ul className="list-disc pl-5 text-destructive font-medium">
                  <li>Semua link website lama yang sudah disebar (WhatsApp, brosur) akan mati (Error 404).</li>
                  <li>Ranking SEO Google Anda akan mengulang dari awal.</li>
                  <li>Anda TIDAK BISA mengganti subdomain lagi setelah ini.</li>
                </ul>
                <span>Apakah Anda 100% yakin dan mengerti risikonya?</span>
              </span>}
              confirmText="Ya, Ganti Subdomain Sekarang"
              onConfirm={handleSaveSubdomain}
            />
          </div>

          {data?.hasChangedSubdomain && (
            <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium">Anda sudah pernah mengganti subdomain. Batas pergantian telah habis.</p>
            </div>
          )}
        </div>

        {/* Custom domain (jika ada) */}
        {hasCustomDomain && customDomain && (
          <div
            className={cn("flex items-center justify-between rounded-xl border px-4 py-3",
              isVerified ?"border-emerald-500/30 bg-emerald-500/5 shadow-inner" :"border-amber-500/30 bg-amber-500/5"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn("flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm",
                  isVerified ?"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :"bg-amber-500/10 text-amber-600 dark:text-amber-400"
                )}
              >
                {isVerified ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : (
                  <ShieldOff className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Custom Domain</p>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <span>{customDomain.domain}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={customDomain.status} />
                {isVerified && (
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase">Aktif</span>
                )}
              </div>
              {isVerified && (
                <a
                  href={`https://${customDomain.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-white rounded-lg"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
