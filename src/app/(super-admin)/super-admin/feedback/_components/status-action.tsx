"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { MoreHorizontal, CheckCircle, Clock, Eye, MessageCircle, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function SystemFeedbackStatusAction({ id, currentStatus, message }: { id: string, currentStatus: string, message: string }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const updateStatus = async (status: string) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/super-admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error("Gagal mengupdate status")

      toast({
        title: "Berhasil",
        description: `Status laporan diubah menjadi ${status}`,
      })
      router.refresh()
    } catch (err) {
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat menyimpan perubahan",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Disalin",
      description: "Pesan berhasil disalin ke clipboard",
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating}>
            <span className="sr-only">Buka menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            <Eye className="mr-2 h-4 w-4" /> Detail Pesan
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStatus("PENDING")} disabled={currentStatus === "PENDING"}>
            <Clock className="mr-2 h-4 w-4" /> Set Pending
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStatus("REVIEWED")} disabled={currentStatus === "REVIEWED"}>
            <MessageCircle className="mr-2 h-4 w-4" /> Set Reviewed
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStatus("RESOLVED")} disabled={currentStatus === "RESOLVED"}>
            <CheckCircle className="mr-2 h-4 w-4" /> Set Resolved
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Detail Pesan / Feedback</DialogTitle>
            <DialogDescription>
              Laporan masuk dari sistem tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-4 rounded-xl max-h-[60vh] overflow-y-auto mt-4 text-sm whitespace-pre-wrap leading-relaxed border shadow-inner">
            {message}
          </div>
          <DialogFooter className="mt-4 sm:justify-between flex-row">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "Tersalin!" : "Copy Pesan"}
            </Button>
            <Button onClick={() => setDialogOpen(false)} className="rounded-xl">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
