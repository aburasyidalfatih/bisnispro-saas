"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface ExportButtonProps {
  data: any[]
}

export function ExportFeedbackButton({ data }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return

    const headers = ["ID", "Tanggal", "Nama Pengirim", "Email Pengirim", "Tenant", "Tipe", "Pesan", "Status"]
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

  return (
    <Button onClick={handleExport} variant="outline" size="sm" className="ml-auto">
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  )
}
