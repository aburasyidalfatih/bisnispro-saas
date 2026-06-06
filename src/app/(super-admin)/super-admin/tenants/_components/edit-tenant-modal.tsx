import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface EditTenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: any | null;
  onSuccess: () => void;
}

export function EditTenantModal({ open, onOpenChange, tenant, onSuccess }: EditTenantModalProps) {
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    domain: "",
    plan: "free",
    studentQuota: 0,
    aiTokens: 0,
    isActive: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tenant && open) {
      setEditForm({
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain || "",
        plan: tenant.plan,
        studentQuota: tenant.studentQuota || 0,
        aiTokens: tenant.aiTokens || 0,
        isActive: tenant.isActive
      })
    }
  }, [tenant, open])

  const handleUpdate = async () => {
    if (!tenant) return
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/tenants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tenant.id, ...editForm }),
      })
      if (res.ok) {
        toast({ title: "Berhasil", description: "Data tenant berhasil diperbarui." })
        onOpenChange(false)
        onSuccess()
      } else {
        const data = await res.json()
        toast({ title: "Gagal", description: data.error || "Gagal mengupdate tenant", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Data Tenant</DialogTitle>
          <DialogDescription>Perbarui informasi institusi dan lisensi.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nama Sekolah</Label>
            <Input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Subdomain (Slug)</Label>
              <Input value={editForm.slug} onChange={(e) => setEditForm({...editForm, slug: e.target.value})} className="rounded-xl font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label>Custom Domain</Label>
              <Input value={editForm.domain} onChange={(e) => setEditForm({...editForm, domain: e.target.value})} placeholder="myschool.sch.id" className="rounded-xl font-mono text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Paket (Plan)</Label>
              <select 
                value={editForm.plan} 
                onChange={(e) => setEditForm({...editForm, plan: e.target.value})}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="free">FREE</option>
                <option value="lite">LITE</option>
                <option value="pro">PRO</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Kuota Siswa</Label>
              <Input type="number" value={editForm.studentQuota} onChange={(e) => setEditForm({...editForm, studentQuota: Number(e.target.value)})} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Kuota Token AI</Label>
            <Input type="number" value={editForm.aiTokens} onChange={(e) => setEditForm({...editForm, aiTokens: Number(e.target.value)})} className="rounded-xl" />
            <p className="text-[10px] text-muted-foreground">Isi manual untuk memberikan kuota token AI gratis/bonus (misal: 1000).</p>
          </div>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border">
            <div className="space-y-0.5">
              <Label>Status Aktif</Label>
              <p className="text-[10px] text-muted-foreground">Matikan jika tenant menunggak atau suspend.</p>
            </div>
            <Button 
              onClick={() => setEditForm({...editForm, isActive: !editForm.isActive})}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                editForm.isActive ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", editForm.isActive ? "right-1" : "left-1")} />
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl" disabled={loading}>Batal</Button>
          <Button onClick={handleUpdate} disabled={loading} className="rounded-xl btn-gradient text-white border-0 px-8">
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
