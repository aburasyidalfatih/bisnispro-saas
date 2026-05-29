import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link2, Unlink, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { MetaConnection } from "./types"

interface AdsConnectionProps {
  metaConn: MetaConnection | null
  showConnect: boolean
  setShowConnect: (show: boolean) => void
  connectForm: { accessToken: string; accountId: string }
  setConnectForm: (form: any) => void
  connecting: boolean
  handleConnect: () => void
  handleDisconnect: () => void
}

export function AdsConnection({
  metaConn,
  showConnect,
  setShowConnect,
  connectForm,
  setConnectForm,
  connecting,
  handleConnect,
  handleDisconnect
}: AdsConnectionProps) {
  return (
    <>
      {/* ======== CONNECTION ======== */}
      <Card className={cn("glass border-0", metaConn?.connected && "ring-1 ring-emerald-500/20")}>
        <CardContent className="p-5">
          {metaConn?.connected ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <Link2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{metaConn.accountName}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">Terhubung</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">ID: {metaConn.accountId}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnect} className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50">
                <Unlink className="h-3.5 w-3.5 mr-1.5" /> Putuskan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10">
                    <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Hubungkan Meta Ads</p>
                    <p className="text-xs text-muted-foreground">Lihat & kelola kampanye Facebook/Instagram Ads.</p>
                  </div>
                </div>
                <Button onClick={() => setShowConnect(!showConnect)} className="rounded-xl btn-gradient text-white">
                  <Link2 className="h-4 w-4 mr-1.5" /> Hubungkan
                </Button>
              </div>
              {showConnect && (
                <div className="border rounded-xl p-4 space-y-3 bg-card">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Access Token</Label>
                    <Input type="password" placeholder="Dari Graph API Explorer atau System User"
                      value={connectForm.accessToken} onChange={e => setConnectForm((p: any) => ({ ...p, accessToken: e.target.value }))}
                      className="rounded-xl font-mono text-xs" />
                    <p className="text-[10px] text-muted-foreground">
                      Buat di <a href="https://developers.facebook.com/tools/explorer/" target="_blank" className="text-blue-600 underline">Graph API Explorer</a> dengan izin ads_read + ads_management
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Ad Account ID</Label>
                    <Input placeholder="Contoh: 123456789" value={connectForm.accountId}
                      onChange={e => setConnectForm((p: any) => ({ ...p, accountId: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleConnect} disabled={connecting} className="rounded-xl btn-gradient text-white flex-1">
                      {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                      Verifikasi & Hubungkan
                    </Button>
                    <Button variant="outline" onClick={() => setShowConnect(false)} className="rounded-xl">Batal</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
