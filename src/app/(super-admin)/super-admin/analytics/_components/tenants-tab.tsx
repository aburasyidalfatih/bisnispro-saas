import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnalyticsData } from "./types"
import { SortableHeader } from "./shared-components"

export function TenantsTab({ data }: { data: AnalyticsData }) {
  const [tableSearch, setTableSearch] = useState("")
  const [sortColumn, setSortColumn] = useState<string>("loginCount")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(col)
      setSortOrder("desc")
    }
  }

  const filteredTenants = data.tenantActivity
    .filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase()))
    .sort((a, b) => {
      const valA = (a as any)[sortColumn] ?? 0
      const valB = (b as any)[sortColumn] ?? 0
      if (typeof valA === 'string') return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA)
      return sortOrder === "asc" ? valA - valB : valB - valA
    })

  return (
    <div className="space-y-8 mt-6">
      {/* SECTION 4: TENANT ACTIVITY TABLE */}
      <Card className="glass border-0 shadow-xl shadow-primary/5">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Detail Aktivitas Per-Tenant</CardTitle>
              <CardDescription>Top 50 tenant berdasarkan aktivitas login terbaru.</CardDescription>
            </div>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari tenant..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="rounded-xl pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-3 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Sekolah</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Paket</th>
                  <SortableHeader label="Siswa" column="studentCount" current={sortColumn} order={sortOrder} onSort={handleSort} />
                  <SortableHeader label="GTK" column="staffCount" current={sortColumn} order={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Post" column="postCount" current={sortColumn} order={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Login Bulan Ini" column="loginCount" current={sortColumn} order={sortOrder} onSort={handleSort} />
                  <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Terakhir Aktif</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-muted-foreground italic">Tidak ada data.</td>
                  </tr>
                ) : (
                  filteredTenants.map(t => (
                    <tr key={t.id} className="hover:bg-muted/20 transition-all">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-xs truncate max-w-[180px]">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          "text-[10px] font-bold uppercase rounded-lg px-2 py-1 tracking-tighter",
                          t.plan === 'pro' ? 'bg-primary/10 text-primary' :
                          t.plan === 'lite' ? 'bg-blue-500/10 text-blue-600' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {t.plan}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-xs">{t.studentCount}</td>
                      <td className="px-3 py-3 text-center font-bold text-xs">{t.staffCount}</td>
                      <td className="px-3 py-3 text-center font-bold text-xs">{t.postCount}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          "font-bold text-xs",
                          t.loginCount > 0 ? "text-emerald-600" : "text-muted-foreground"
                        )}>
                          {t.loginCount}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-[10px] text-muted-foreground">
                        {t.lastActiveAt ? new Date(t.lastActiveAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold uppercase rounded-full px-2 py-0.5",
                          t.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                        )}>
                          {t.isActive ? "Aktif" : "Mati"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
