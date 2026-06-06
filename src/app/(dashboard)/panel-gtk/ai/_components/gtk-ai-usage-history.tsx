"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2 } from "lucide-react"
import { ServerPagination } from "@/components/shared/server-pagination"

export function GtkAiUsageHistory() {
  const [usageLogs, setUsageLogs] = useState<any[]>([])
  const [usageTotalItems, setUsageTotalItems] = useState(0)
  const [usageTotalPages, setUsageTotalPages] = useState(0)
  const [usagePage, setUsagePage] = useState(1)
  const [usageLoading, setUsageLoading] = useState(false)

  const fetchUsageLogs = async (p = 1) => {
    setUsageLoading(true)
    try {
      const res = await fetch(`/api/gtk/ai/usage?page=${p}&limit=10`)
      const data = await res.json()
      if (data.data) {
        setUsageLogs(data.data)
        setUsageTotalPages(data.totalPages || 0)
        setUsageTotalItems(data.total || 0)
      }
    } catch {
      console.error("Gagal memuat histori penggunaan.")
    } finally {
      setUsageLoading(false)
    }
  }

  useEffect(() => {
    fetchUsageLogs(1)
  }, [])

  useEffect(() => {
    if (usagePage > 1) {
      fetchUsageLogs(usagePage)
    }
  }, [usagePage])

  return (
    <Card className="border-0 shadow-sm glass h-[calc(100vh-220px)] flex flex-col">
      <CardHeader className="border-b border-border/50 bg-muted/20 py-3">
         <CardTitle className="text-base">Riwayat Potongan Token</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-y-auto relative">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50">
                <TableHead className="px-4 py-3 text-left font-semibold text-muted-foreground">Waktu</TableHead>
                <TableHead className="px-4 py-3 text-left font-semibold text-muted-foreground">Fitur</TableHead>
                <TableHead className="px-4 py-3 text-right font-semibold text-muted-foreground">Token Terpotong</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageLoading && usageLogs.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-b">
                    <TableCell className="px-4 py-4" colSpan={3}><div className="skeleton h-6 w-full rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : usageLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="px-4 py-16 text-center">
                    <Building2 className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
                    <p className="text-muted-foreground italic text-sm">Belum ada riwayat penggunaan token.</p>
                  </TableCell>
                </TableRow>
              ) : (
                usageLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-all">
                    <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {log.feature === "AI_CHAT_GTK" ? "Chat Asisten AI" : log.feature}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <span className="font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-md">
                        -{log.tokens.toLocaleString("id-ID")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {usageTotalPages > 1 && (
        <div className="p-4 border-t border-border/50 bg-background">
          <ServerPagination page={usagePage} totalPages={usageTotalPages} total={usageTotalItems} onPageChange={setUsagePage} />
        </div>
      )}
    </Card>
  )
}
