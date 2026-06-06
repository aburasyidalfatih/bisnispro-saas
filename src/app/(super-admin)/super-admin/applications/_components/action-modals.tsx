import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Application } from "./types"

interface ActionModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  actionType: "APPROVED" | "REVISION" | "REJECTED" | "DELETE" | "RESEND_EMAIL" | null
  selectedApp: Application | null
  adminMessage: string
  setAdminMessage: (msg: string) => void
  isUpdating: boolean
  handleUpdateStatus: () => void
}

export function ActionModal({
  open,
  setOpen,
  actionType,
  selectedApp,
  adminMessage,
  setAdminMessage,
  isUpdating,
  handleUpdateStatus
}: ActionModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass border-0">
        <DialogHeader>
          <DialogTitle>
            {actionType === "APPROVED" ? "Setujui Pendaftaran" : actionType === "REVISION" ? "Minta Revisi" : actionType === "DELETE" ? "Hapus Pengajuan" : actionType === "RESEND_EMAIL" ? "Kirim Ulang Email" : "Tolak Pendaftaran"}
          </DialogTitle>
          <DialogDescription>
            {actionType === "DELETE" 
              ? "Apakah Anda yakin ingin menghapus pengajuan ini? Data yang dihapus tidak dapat dikembalikan."
              : `Tindakan ini akan mengirimkan notifikasi ke email `}
            {actionType !== "DELETE" && <strong className="text-primary">{selectedApp?.adminEmail}</strong>}
          </DialogDescription>
        </DialogHeader>
        {(actionType === "REVISION" || actionType === "REJECTED") && (
          <div className="space-y-3 py-4">
            <Label>Alasan {actionType === "REVISION" ? "Revisi" : "Penolakan"} (Wajib)</Label>
            <Textarea 
              placeholder="Tulis alasan secara detail agar sekolah dapat memperbaikinya..." 
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button variant="outline" 
            className={cn(
              actionType === "APPROVED" ? "bg-emerald-500 hover:bg-emerald-600" : actionType === "REVISION" ? "bg-blue-500 hover:bg-blue-600" : actionType === "RESEND_EMAIL" ? "bg-purple-500 hover:bg-purple-600" : "bg-rose-500 hover:bg-rose-600",
              "text-white"
            )}
            onClick={handleUpdateStatus}
            disabled={isUpdating || ((actionType === "REVISION" || actionType === "REJECTED") && !adminMessage.trim())}
          >
            {isUpdating ? "Memproses..." : actionType === "DELETE" ? "Ya, Hapus" : actionType === "RESEND_EMAIL" ? "Ya, Kirim" : "Konfirmasi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface BulkActionModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  actionType: "APPROVED" | "REVISION" | "REJECTED" | "DELETE" | "RESEND_EMAIL" | null
  selectedIds: string[]
  adminMessage: string
  setAdminMessage: (msg: string) => void
  isUpdating: boolean
  bulkProgress: { show: boolean, current: number, total: number }
  handleUpdateStatus: () => void
}

export function BulkActionModal({
  open,
  setOpen,
  actionType,
  selectedIds,
  adminMessage,
  setAdminMessage,
  isUpdating,
  bulkProgress,
  handleUpdateStatus
}: BulkActionModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass border-0">
        <DialogHeader>
          <DialogTitle>
            Konfirmasi Masal: {actionType === "APPROVED" ? "Setujui" : actionType === "REVISION" ? "Revisi" : actionType === "DELETE" ? "Hapus" : actionType === "RESEND_EMAIL" ? "Kirim Ulang Email" : "Tolak"} ({selectedIds.length} Sekolah)
          </DialogTitle>
          <DialogDescription>
            {actionType === "DELETE" 
              ? `Apakah Anda yakin ingin menghapus ${selectedIds.length} pengajuan secara permanen?`
              : actionType === "RESEND_EMAIL"
              ? `Apakah Anda yakin ingin mengirim ulang email konfirmasi ke ${selectedIds.length} pengajuan yang dipilih secara masal?`
              : `Tindakan ini akan diproses untuk seluruh ${selectedIds.length} pengajuan yang dipilih secara masal.`}
          </DialogDescription>
        </DialogHeader>
        
        {bulkProgress.show ? (
          <div className="py-8 space-y-4">
            <div className="flex justify-between text-sm font-medium">
              <span>Memproses...</span>
              <span>{bulkProgress.current} / {bulkProgress.total}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">Mohon jangan tutup jendela ini hingga proses selesai.</p>
          </div>
        ) : (
          <>
            {(actionType === "REVISION" || actionType === "REJECTED") && (
              <div className="space-y-3 py-4">
                <Label>Alasan (Akan dikirim ke semua)</Label>
                <Textarea 
                  placeholder="Tulis alasan..." 
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isUpdating}>Batal</Button>
              <Button variant="outline" 
                className={cn(
                  actionType === "APPROVED" ? "bg-emerald-500 hover:bg-emerald-600" : actionType === "REVISION" ? "bg-blue-500 hover:bg-blue-600" : actionType === "RESEND_EMAIL" ? "bg-purple-500 hover:bg-purple-600" : "bg-rose-500 hover:bg-rose-600",
                  "text-white"
                )}
                onClick={handleUpdateStatus}
                disabled={isUpdating || ((actionType === "REVISION" || actionType === "REJECTED") && !adminMessage.trim())}
              >
                {isUpdating ? "Memproses..." : actionType === "DELETE" ? "Ya, Hapus Masal" : actionType === "RESEND_EMAIL" ? "Kirim Masal" : "Proses Masal"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
