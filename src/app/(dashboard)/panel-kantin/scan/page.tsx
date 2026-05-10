"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  QrCode, Wallet, ShoppingCart, Plus, Minus, Trash2,
  CheckCircle, Loader2, Search, User, Receipt, Lock
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type StudentInfo = {
  student: { id: string; name: string; nis?: string; nisn?: string; classroom: string }
  wallet: { id: string; balance: number; isActive: boolean }
}

type Product = {
  id: string; name: string; price: number; stock: number; imageUrl?: string; isActive: boolean
}

type CartItem = Product & { quantity: number }

export default function ScanKasirPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const tenant = session?.user?.tenants?.[0]

  const [searchQuery, setSearchQuery] = useState("")
  const [scanning, setScanning] = useState(false)
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [merchant, setMerchant] = useState<any>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [pinDialogOpen, setPinDialogOpen] = useState(false)
  const [pin, setPin] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch produk merchant
  useEffect(() => {
    if (!tenant) return
    fetch(`/api/canteen/products?tenantId=${tenant.id}`)
      .then(r => r.json())
      .then(d => {
        setMerchant(d.merchant)
        setProducts((d.products || []).filter((p: Product) => p.isActive))
      })
      .catch(console.error)
  }, [tenant])

  const handleScan = async () => {
    if (!tenant || !searchQuery.trim()) return
    setScanning(true)
    setStudentInfo(null)
    setCart([])
    setSuccess(false)
    try {
      const res = await fetch(`/api/canteen/scan?q=${encodeURIComponent(searchQuery.trim())}&tenantId=${tenant.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStudentInfo(data)
    } catch (err: any) {
      toast({ title: "Siswa tidak ditemukan", description: err.message, variant: "destructive" })
    } finally {
      setScanning(false)
    }
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id))

  const total = cart.reduce((acc, i) => acc + i.price * i.quantity, 0)

  const handleCheckout = async () => {
    if (!tenant || !merchant || !studentInfo || cart.length === 0) return
    if (studentInfo.wallet.balance < total) {
      return toast({ title: "Saldo tidak cukup", description: `Saldo: Rp ${studentInfo.wallet.balance.toLocaleString("id-ID")}`, variant: "destructive" })
    }
    if (pin.length !== 6) {
      return toast({ title: "PIN tidak valid", description: "PIN harus 6 digit angka", variant: "destructive" })
    }

    setProcessing(true)
    try {
      const res = await fetch("/api/canteen/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          merchantId: merchant.id,
          studentWalletId: studentInfo.wallet.id,
          pin,
          items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(true)
      setPinDialogOpen(false)
      setPin("")
      setStudentInfo(prev => prev ? { ...prev, wallet: { ...prev.wallet, balance: data.balanceAfter } } : null)
      setCart([])
      toast({ title: "✅ Transaksi Berhasil!", description: `Total Rp ${total.toLocaleString("id-ID")} berhasil dipotong dari wallet.` })
    } catch (err: any) {
      toast({ title: "Transaksi gagal", description: err.message, variant: "destructive" })
      setPin("")
    } finally {
      setProcessing(false)
    }
  }

  const resetTransaction = () => {
    setStudentInfo(null)
    setCart([])
    setSearchQuery("")
    setSuccess(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 h-full">
      {/* LEFT: Scan & Produk */}
      <div className="space-y-4">
        {/* Search / Scan Area */}
        <Card className="glass border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" /> Scan / Cari Siswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Ketik NIS / NISN atau arahkan QR Scanner..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleScan()}
                className="rounded-xl font-mono"
                autoFocus
              />
              <Button onClick={handleScan} disabled={scanning || !searchQuery} className="rounded-xl shrink-0">
                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {/* Student Info */}
            {studentInfo && (
              <div className={cn(
                "mt-4 p-4 rounded-xl border-2 transition-all",
                success ? "border-emerald-500 bg-emerald-500/5" : "border-primary/30 bg-primary/5"
              )}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {success ? <CheckCircle className="h-6 w-6 text-emerald-600" /> : <User className="h-6 w-6 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{studentInfo.student.name}</p>
                    <p className="text-xs text-muted-foreground">{studentInfo.student.nis || studentInfo.student.nisn} · {studentInfo.student.classroom}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-indigo-600">
                      <Wallet className="h-4 w-4" />
                      <span className="font-black text-lg">Rp {studentInfo.wallet.balance.toLocaleString("id-ID")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Saldo Wallet</p>
                  </div>
                </div>
                {success && (
                  <Button onClick={resetTransaction} variant="outline" className="w-full mt-3 rounded-xl" size="sm">
                    Transaksi Baru
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Produk Grid */}
        <Card className="glass border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Menu {merchant?.name || "Kantin"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto">
              {products.map(p => (
                <div
                  key={p.id}
                  onClick={() => studentInfo && !success && addToCart(p)}
                  className={cn(
                    "p-3 rounded-xl border cursor-pointer transition-all group",
                    studentInfo && !success ? "hover:border-primary hover:bg-primary/5 active:scale-95" : "opacity-50 cursor-not-allowed",
                    "bg-card border-border"
                  )}
                >
                  {p.imageUrl && (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                  )}
                  <p className="font-semibold text-sm leading-tight">{p.name}</p>
                  <p className="text-primary font-black mt-1">Rp {p.price.toLocaleString("id-ID")}</p>
                  {p.stock !== -1 && <p className="text-[10px] text-muted-foreground">Stok: {p.stock}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Cart & Checkout */}
      <div className="space-y-4">
        <Card className="glass border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Keranjang
              {cart.length > 0 && <Badge className="ml-auto">{cart.reduce((a, i) => a + i.quantity, 0)} item</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Pilih produk dari menu di kiri</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-primary">Rp {item.price.toLocaleString("id-ID")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => updateQty(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => updateQty(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="w-24 text-right font-black text-sm">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</p>
                  </div>
                ))}

                {/* Total */}
                <div className="border-t border-border/50 pt-3 flex justify-between items-center">
                  <p className="font-bold text-muted-foreground">TOTAL</p>
                  <p className="text-2xl font-black text-primary">Rp {total.toLocaleString("id-ID")}</p>
                </div>

                {studentInfo && (
                  <div className={cn(
                    "p-3 rounded-xl text-sm",
                    studentInfo.wallet.balance >= total ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"
                  )}>
                    {studentInfo.wallet.balance >= total
                      ? `✅ Sisa saldo: Rp ${(studentInfo.wallet.balance - total).toLocaleString("id-ID")}`
                      : `❌ Saldo kurang Rp ${(total - studentInfo.wallet.balance).toLocaleString("id-ID")}`
                    }
                  </div>
                )}

                <Button
                  className="w-full h-14 text-lg font-bold rounded-xl"
                  disabled={!studentInfo || cart.length === 0 || processing || success || studentInfo.wallet.balance < total}
                  onClick={() => setPinDialogOpen(true)}
                >
                  <Receipt className="mr-2 h-5 w-5" /> Proses Pembayaran
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal PIN */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> Validasi PIN Siswa
            </DialogTitle>
            <DialogDescription>
              Silakan minta siswa <strong>{studentInfo?.student.name}</strong> untuk memasukkan 6-digit PIN keamanan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-4">Total Tagihan: <strong className="text-xl text-primary">Rp {total.toLocaleString("id-ID")}</strong></p>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="******"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-48 text-center tracking-[0.5em] text-2xl h-14 font-bold rounded-xl"
              autoFocus
            />
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => { setPinDialogOpen(false); setPin("") }}>Batal</Button>
            <Button onClick={handleCheckout} disabled={pin.length !== 6 || processing}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Konfirmasi Bayar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
