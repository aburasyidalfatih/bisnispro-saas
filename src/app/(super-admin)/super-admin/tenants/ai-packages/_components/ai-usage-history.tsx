import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Building2 } from "lucide-react"
import { ServerPagination } from "@/components/shared/server-pagination"

export function AiUsageHistory() {
  const [usageLogs, setUsageLogs] = useState<any[]>([])
  const [usageTotalItems, setUsageTotalItems] = useState(0)
  const [usageTotalPages, setUsageTotalPages] = useState(0)
  const [usagePage, setUsagePage] = useState(1)
  const [usageLoading, setUsageLoading] = useState(false)

  const fetchUsageLogs = async (p = 1) => {
    setUsageLoading(true)
    try {
      const res = await fetch(`/api/super-admin/ai-usage?page=${p}&limit=10`)
      const data = await res.json()
      if (data.data) {
        setUsageLogs(data.data)
        setUsageTotalPages(data.totalPages || 0)
        setUsageTotalItems(data.total || 0)
      }
    } catch {
      toast({ title: "Error", description: "Gagal memuat histori penggunaan.", variant: "destructive" })
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
    <div className="space-y-4">
      <Card className="glass border-0 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/30">
                <TableHead className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Waktu</TableHead>
                <TableHead className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Tenant</TableHead>
                <TableHead className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">User</TableHead>
                <TableHead className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Fitur / Penggunaan</TableHead>
                <TableHead className="px-4 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Token Digunakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageLoading && usageLogs.length === 0 ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i} className="border-b">
                    <TableCell className="px-4 py-5" colSpan={5}><div className="skeleton h-10 w-full rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : usageLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-16 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground italic">Belum ada histori penggunaan token.</p>
                  </TableCell>
                </TableRow>
              ) : (
                usageLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/20 transition-all">
                    <TableCell className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-sm">{log.tenant?.name || "-"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm">{log.user?.name || "-"}</TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {log.feature}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <span className="font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                        -{log.tokens.toLocaleString("id-ID")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {usageTotalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/40 bg-muted/10">
            <ServerPagination page={usagePage} totalPages={usageTotalPages} total={usageTotalItems} onPageChange={setUsagePage} />
          </div>
        )}
      </Card>
    </div>
  )
}
