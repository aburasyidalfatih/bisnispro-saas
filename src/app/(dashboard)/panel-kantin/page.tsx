"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, TrendingUp, Wallet, Receipt, QrCode, Package, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { normalizeImageUrl } from "@/lib/utils"


export default function PanelKantinPage() {
  const { data: session } = useSession()
  const tenant = session?.user?.tenants?.[0]
  const [data, setData] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant) return
    const todayStr = new Date().toISOString().slice(0, 10)
    Promise.all([
      fetch(`/api/canteen/products?tenantId=${tenant.id}`).then(r => r.json()),
      fetch(`/api/canteen/orders?tenantId=${tenant.id}&limit=10&date=${todayStr}`).then(r => r.json()),
    ]).then(([merchantData, ordersData]) => {
      setData(merchantData)
      setOrders(ordersData.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [tenant])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  const merchant = data?.merchant
  const products = data?.products || []
  const todayTotal = orders.reduce((acc: number, o: any) => acc + o.total, 0)

  const menuItems = [
    { label: "Kasir / Scan QR", icon: QrCode, href: "/panel-kantin/scan", color: "bg-primary/10 text-primary", desc: "Proses transaksi cashless" },
    { label: "Produk", icon: Package, href: "/panel-kantin/products", color: "bg-indigo-500/10 text-indigo-600", desc: `${products.length} produk aktif` },
    { label: "Penarikan Dana", icon: Wallet, href: "/panel-kantin/withdrawals", color: "bg-emerald-500/10 text-emerald-600", desc: `Saldo: Rp ${(merchant?.balance || 0).toLocaleString("id-ID")}` },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 flex items-center gap-4">
        {merchant?.imageUrl ? (
          <img src={normalizeImageUrl(merchant.imageUrl) || merchant.imageUrl} alt={merchant.name} className="h-16 w-16 rounded-2xl object-cover" loading="lazy" decoding="async" />
        ) : (
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{merchant?.name || "Kantin Anda"}</h1>
          <p className="text-sm text-muted-foreground">{merchant?.description || "Panel Manajemen Kantin"}</p>
        </div>
        <Link href="/panel-kantin/scan">
          <Button className="rounded-xl gap-2">
            <QrCode className="h-4 w-4" /> Buka Kasir
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Saldo Terkumpul", value: `Rp ${(merchant?.balance || 0).toLocaleString("id-ID")}`, icon: Wallet, color: "text-emerald-600 bg-emerald-500/10" },
          { label: "Transaksi Hari Ini", value: todayTotal > 0 ? `Rp ${todayTotal.toLocaleString("id-ID")}` : "—", icon: TrendingUp, color: "text-primary bg-primary/10" },
          { label: "Total Pesanan", value: orders.length > 0 ? `${orders.length} pesanan` : "—", icon: Receipt, color: "text-amber-600 bg-amber-500/10" },
          { label: "Produk Aktif", value: `${products.filter((p: any) => p.isActive).length} menu`, icon: Package, color: "text-indigo-600 bg-indigo-500/10" },
        ].map((s, i) => (
          <Card key={i} className="glass border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-black text-sm">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Nav */}
      <div className="grid md:grid-cols-3 gap-4">
        {menuItems.map((item, i) => (
          <Link key={i} href={item.href}>
            <Card className="glass border-0 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Transaksi Terbaru */}
      <Card className="glass border-0">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
          <Link href="/panel-kantin/withdrawals" className="text-xs text-primary hover:underline">Lihat Semua →</Link>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada transaksi.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{order.student?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), "d MMM HH:mm", { locale: localeId })} · {order.items?.length} item
                      </p>
                    </div>
                  </div>
                  <p className="font-black text-emerald-600">+Rp {order.total.toLocaleString("id-ID")}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
