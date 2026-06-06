import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { ShieldCheck, Copy, AlertCircle, RefreshCw } from"lucide-react"
import { DomainData } from"./types"
import { StatusBadge } from"./status-badge"

interface DnsGuideCardProps {
  data: DomainData | null
  hasCustomDomain: boolean
  isVerified: boolean
  rootDomain: string
  verifying: boolean
  handleVerify: () => Promise<void>
  copyToClipboard: (text: string, label: string) => void
}

export function DnsGuideCard({
  data,
  hasCustomDomain,
  isVerified,
  rootDomain,
  verifying,
  handleVerify,
  copyToClipboard,
}: DnsGuideCardProps) {
  if (!hasCustomDomain || !data?.customDomain) return null

  const customDomain = data.customDomain

  return (
    <Card className="glass border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Verifikasi & Konfigurasi DNS</CardTitle>
              <CardDescription>
                Tambahkan record berikut di panel DNS domain Anda
              </CardDescription>
            </div>
          </div>
          <StatusBadge status={customDomain.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Step 1: CNAME */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
              1
            </span>
            <p className="text-sm font-semibold">Tambahkan CNAME Record</p>
          </div>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/50">
                  <TableHead className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Type</TableHead>
                  <TableHead className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Name</TableHead>
                  <TableHead className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Value</TableHead>
                  <TableHead className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">TTL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">CNAME</code>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono">@</code>
                      <Button
                        onClick={() => copyToClipboard("@","Name")}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono">
                        {rootDomain ||"schoolpro.id"}
                      </code>
                      <Button
                        onClick={() =>
                          copyToClipboard(
                            rootDomain ||"schoolpro.id","CNAME value"
                          )
                        }
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">3600</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Jika domain root tidak mendukung CNAME, gunakan{""}
            <strong>ALIAS</strong> atau <strong>ANAME</strong> record (tergantung provider DNS Anda).
          </p>
        </div>

        {/* Step 2: TXT Verification */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
              2
            </span>
            <p className="text-sm font-semibold">Tambahkan TXT Record untuk Verifikasi</p>
          </div>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/50">
                  <TableHead className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Type</TableHead>
                  <TableHead className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Name</TableHead>
                  <TableHead className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">TXT</code>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono">_smp-verify</code>
                      <Button
                        onClick={() =>
                          copyToClipboard("_smp-verify","TXT Name")
                        }
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono break-all">{customDomain.verifyToken}</code>
                      <Button
                        onClick={() => copyToClipboard(customDomain.verifyToken,"TXT Value")}
                        className="text-muted-foreground hover:text-primary shrink-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pesan error jika gagal */}
        {customDomain.status ==="failed" && customDomain.failReason && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Verifikasi Gagal</p>
              <p className="text-xs text-muted-foreground whitespace-pre-line">
                {customDomain.failReason}
              </p>
            </div>
          </div>
        )}

        {/* Verified info */}
        {isVerified && customDomain.verifiedAt && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Domain terverifikasi
              </p>
              <p className="text-xs text-muted-foreground">
                Diverifikasi pada{""}
                {new Date(customDomain.verifiedAt).toLocaleDateString("id-ID", {
                  day:"numeric",
                  month:"long",
                  year:"numeric",
                  hour:"2-digit",
                  minute:"2-digit",
                })}
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Verify button */}
        {!isVerified && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                3
              </span>
              <p className="text-sm font-semibold">Verifikasi Domain</p>
            </div>
            <p className="text-xs text-muted-foreground pl-8">
              Setelah menambahkan DNS record, klik tombol di bawah. Propagasi DNS bisa memakan
              waktu hingga 24 jam.
            </p>
            <button
              className="justify-center items-center flex btn-gradient text-white border-0 rounded-xl gap-2 w-full"
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {verifying ?"Memeriksa DNS..." :"Verifikasi Sekarang"}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
