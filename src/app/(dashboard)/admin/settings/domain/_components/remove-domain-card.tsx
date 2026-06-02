import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { Trash2 } from"lucide-react"
import { DomainData } from"./types"

interface RemoveDomainCardProps {
  data: DomainData | null
  hasCustomDomain: boolean
  removing: boolean
  handleRemove: () => Promise<void>
}

export function RemoveDomainCard({
  data,
  hasCustomDomain,
  removing,
  handleRemove,
}: RemoveDomainCardProps) {
  if (!hasCustomDomain) return null

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
            <Trash2 className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-lg text-destructive">Hapus Custom Domain</CardTitle>
            <CardDescription>
              Website akan kembali menggunakan subdomain default
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-xl border border-destructive/20 p-4">
          <div>
            <p className="font-medium text-sm">{data?.domain}</p>
            <p className="text-xs text-muted-foreground">
              Custom domain akan dihapus dan tidak bisa diakses lagi
            </p>
          </div>
          <ConfirmDialog
            trigger={
              <Button
                variant="destructive"
                size="sm"
                className="rounded-lg text-xs"
                disabled={removing}
              >
                {removing ?"Menghapus..." :"Hapus Domain"}
              </Button>
            }
            title="Hapus custom domain?"
            description={`Domain ${data?.domain} akan dihapus. Website akan kembali menggunakan subdomain default. Tindakan ini tidak dapat dibatalkan.`}
            confirmText="Ya, hapus domain"
            onConfirm={handleRemove}
          />
        </div>
      </CardContent>
    </Card>
  )
}
