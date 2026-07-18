"use client"

import { Button } from "@/components/ui/button"
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface ExportButtonProps {
  data: any[]
}

export function ExportFeedbackButton({ data }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExportCSV = () => {
    if (!data || data.length === 0) return

    const headers = ["ID", "Tanggal", "Nama Pengirim", "Email Pengirim", "Lembaga", "Tipe", "Pesan", "Status"]
    const rows = data.map(item => [
      item.id,
      format(new Date(item.createdAt), "dd MMM yyyy HH:mm", { locale: id }),
      item.user?.name || "Unknown",
      item.user?.email || "Unknown",
      item.tenant ? `${item.tenant.name} (${item.tenant.slug})` : "Sistem/Non-tenant",
      item.type,
      `"${item.message.replace(/"/g, '""')}"`, // escape quotes for CSV
      item.status
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `feedback_report_${format(new Date(), "yyyyMMdd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = async () => {
    if (!data || data.length === 0) return
    setIsExporting(true)

    try {
      const payload = data.map(item => ({
        id: item.id,
        date: format(new Date(item.createdAt), "dd MMM yyyy HH:mm", { locale: id }),
        senderName: item.user?.name || "Unknown",
        senderEmail: item.user?.email || "Unknown",
        tenant: item.tenant ? `${item.tenant.name} (${item.tenant.slug})` : "Sistem/Non-tenant",
        type: item.type,
        message: item.message,
        status: item.status
      }))

      const res = await fetch("/api/super-admin/feedback/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload })
      })

      if (!res.ok) throw new Error("Gagal generate PDF")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `feedback_report_${format(new Date(), "yyyyMMdd")}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      toast({
        title: "Gagal Ekspor",
        description: "Terjadi kesalahan saat membuat file PDF.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto" disabled={isExporting}>
          {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
          Export CSV (Spreadsheet)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="w-4 h-4 mr-2 text-red-600" />
          Export PDF (Dokumen)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
