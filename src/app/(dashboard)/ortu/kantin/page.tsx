"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Store, ShoppingBag, Loader2, Wallet } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function OrtuCanteenPage() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]

  const [children, setChildren] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState("")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(false)

  useEffect(() => {
    if (!tenant) return
    fetch(`/api/ortu/children?tenantId=${tenant.id}`)
      .then(r => r.json())
      .then(d => {
        const kids = d.children || []
        setChildren(kids)
        if (kids.length > 0) setSelectedChild(kids[0].id)
        setLoading(false)
      })
  }, [tenant?.id])

  useEffect(() => {
    if (!selectedChild || !tenant) return
    setOrdersLoading(true)
    fetch(`/api/ortu/canteen-history?tenantId=${tenant.id}&studentId=${selectedChild}`)
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setOrdersLoading(false) })
  }, [selectedChild])

  const totalSpent = orders.reduce((a, o) => a + o.total, 0)

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Kantin</h1>
        <p className="text-muted-foreground">Pantau transaksi E-Kantin putra/putri Anda</p>
      </div>

      {children.length > 1 && (
        <div className="space-y-2">
          <Label>Anak</Label>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{children.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {/* Summary */}
      {orders.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="glass border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Transaksi</p>
                <p className="text-xl font-bold">{orders.length}x</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
                <Wallet className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Pengeluaran</p>
                <p className="text-xl font-bold">Rp {totalSpent.toLocaleString("id-ID")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* List Orders */}
      {ordersLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="p-12 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Belum ada transaksi kantin</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <Card key={order.id} className="glass border-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Store className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{order.merchant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), "d MMM yyyy, HH:mm", { locale: localeId })}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {order.items.map((item: any) => (
                          <Badge key={item.id} variant="outline" className="text-[10px] font-normal">
                            {item.quantity}× {item.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-sm">Rp {order.total.toLocaleString("id-ID")}</p>
                    <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-300 mt-1" variant="outline">Lunas</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
