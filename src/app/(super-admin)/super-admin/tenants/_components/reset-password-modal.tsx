import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: any | null;
  onSuccess: () => void;
}

export function ResetPasswordModal({ open, onOpenChange, tenant, onSuccess }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("")
  const [reseting, setReseting] = useState(false)

  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) {
      setNewPassword("")
    }
  }

  const handleResetPassword = async () => {
    if (!tenant || !newPassword) return
    setReseting(true)
    try {
      const res = await fetch("/api/super-admin/tenants/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, newPassword }),
      })
      if (res.ok) {
        toast({ title: "Berhasil", description: "Password owner tenant telah direset." })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({ title: "Gagal", description: "Gagal mereset password.", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan.", variant: "destructive" })
    } finally {
      setReseting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password Owner</DialogTitle>
          <DialogDescription>Reset password untuk {tenant?.owner?.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Password Baru</Label>
            <Input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="Minimal 8 karakter"
              className="rounded-xl" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl" disabled={reseting}>Batal</Button>
          <Button 
            onClick={handleResetPassword} 
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white border-0"
            disabled={reseting || !newPassword}
          >
            {reseting ? "Memproses..." : "Reset Sekarang"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
