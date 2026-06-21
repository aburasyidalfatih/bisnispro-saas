"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle, Clock, Eye, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function SystemFeedbackStatusAction({ id, currentStatus, message }: { id: string, currentStatus: string, message: string }) {
  const [isUpdating, setIsUpdating] = useState(false)
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

  const showDetail = () => {
    // Bisa menggunakan dialog, tapi untuk simpel kita alert pesannya saja
    alert(`Isi Laporan/Saran:\n\n${message}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating}>
          <span className="sr-only">Buka menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={showDetail}>
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
  )
}
