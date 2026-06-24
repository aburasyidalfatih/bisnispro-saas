"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, School, User, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Commission {
  id: string
  amount: number
  status: string
  createdAt: string
  affiliate: {
    id: string
    referralCode: string
    user: { name: string; email: string }
  }
  tenant: { name: string; slug: string }
  payment?: {
    reference: string
    amount: number
    discountCode?: {
      code: string
      type: string
      affiliateId: string | null
      cashbackAmount: number
      percentage: number
    } | null
  } | null
}

export default function SuperAdminCommissionsPage() {
  const [data, setData] = useState<{ commissions: Commission[], totalPages: number }>({ commissions: [], totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const fetchCommissions = useCallback(async () => {
    try {
      const url = new URL("/api/super-admin/affiliates/commissions", window.location.origin)
      url.searchParams.set("page", page.toString())
      url.searchParams.set("limit", "10")
      if (search) url.searchParams.set("search", search)
      
      const res = await fetch(url.toString())
      const result = await res.json()
      setData(result)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => { 
    const timer = setTimeout(() => fetchCommissions(), 500)
    return () => clearTimeout(timer)
  }, [fetchCommissions])

  const getTypeBadge = (c: Commission) => {
    let isCashback = false;
    if (c.payment?.discountCode?.type === "CASHBACK") {
      const dc = c.payment.discountCode;
      let expectedCashback = 0;
      if (dc.cashbackAmount && dc.cashbackAmount > 0) {
        expectedCashback = dc.cashbackAmount;
      } else if (dc.percentage && dc.percentage > 0) {
        expectedCashback = Math.round(c.payment.amount * (dc.percentage / 100));
      }
      // If the commission amount matches the calculated cashback amount, it's a CASHBACK commission
      if (c.amount === expectedCashback) {
        isCashback = true;
      }
    }

    if (isCashback) {
      return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">CASHBACK</Badge>
    }
    return <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200">REFERAL</Badge>
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/super-admin/affiliates">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Komisi & Cashback</h1>
          <p className="text-muted-foreground mt-1 text-sm">Lihat semua komisi referal dan penerima cashback.</p>
        </div>
      </div>

      <Card className="glass border-0 shadow-xl shadow-primary/5">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Riwayat Komisi Afiliator</CardTitle>
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari afiliator / tenant..."
                className="rounded-xl pl-9 w-full h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-muted-foreground font-medium">
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Afiliator (Penerima)</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Asal Transaksi (Sekolah)</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center">Loading...</TableCell>
                  </TableRow>
                ) : data.commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center text-muted-foreground italic">
                      Tidak ada riwayat komisi ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.commissions.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{c.affiliate.user.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{c.affiliate.referralCode}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(c)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm flex items-center gap-1.5">
                            <School className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.tenant.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">{c.payment?.reference}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        + Rp {c.amount.toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <div className="text-sm font-medium">
                {page} / {data.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
