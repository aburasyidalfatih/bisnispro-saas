import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Save, ShieldCheck, Eye, EyeOff } from "lucide-react"
import type { SettingsForm } from "../constants"

interface PaymentTabProps {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  handleSaveBatch: (fields: string[], overrides?: Record<string, string>) => Promise<void>;
  saving: boolean;
}

export function PaymentTab({ form, setForm, handleSaveBatch, saving }: PaymentTabProps) {
  const [showTripayKey, setShowTripayKey] = useState(false)

  return (
    <div className="grid gap-6 lg:grid-cols-2 outline-none">
      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10"><CreditCard className="h-4 w-4 text-purple-500" /></div>
            <CardTitle className="text-lg">Konfigurasi Tripay</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tripay Mode</Label>
            <Select value={form.TRIPAY_MODE} onValueChange={(value) => setForm({...form, TRIPAY_MODE: value})}>
              <SelectTrigger className="w-full h-10 rounded-xl">
                <SelectValue placeholder="Tripay Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                <SelectItem value="live">Live (Produksi)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Merchant Code</Label>
            <Input value={form.TRIPAY_MERCHANT_CODE} onChange={e => setForm({...form, TRIPAY_MERCHANT_CODE: e.target.value})} placeholder="TXXXX" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input type={showTripayKey ? "text" : "password"} value={form.TRIPAY_API_KEY} onChange={e => setForm({...form, TRIPAY_API_KEY: e.target.value})} placeholder="API Key" className="rounded-xl pr-10" />
              <Button variant="ghost" size="icon" type="button" onClick={() => setShowTripayKey(!showTripayKey)} className="absolute right-1 h-8 w-8 top-1/2 -translate-y-1/2 text-muted-foreground">{showTripayKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Private Key</Label>
            <Input type="password" value={form.TRIPAY_PRIVATE_KEY} onChange={e => setForm({...form, TRIPAY_PRIVATE_KEY: e.target.value})} placeholder="Private Key" className="rounded-xl" />
          </div>
          <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-2 flex items-center justify-center h-10 px-4" onClick={() => handleSaveBatch(['TRIPAY_MODE', 'TRIPAY_MERCHANT_CODE', 'TRIPAY_API_KEY', 'TRIPAY_PRIVATE_KEY'])} disabled={saving}>
            <Save className="h-4 w-4" /> Simpan Pembayaran
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"><ShieldCheck className="h-4 w-4 text-blue-500" /></div>
            <CardTitle className="text-lg">Informasi Integrasi</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-4 text-muted-foreground">
          <p>API platform digunakan untuk tagihan otomatis upgrade paket langganan tenant.</p>
          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            <p className="font-semibold text-foreground">URL Callback / IPN:</p>
            <code className="block bg-muted p-2 rounded-lg text-xs break-all">https://bisnispro.id/api/payment/callback</code>
            <p className="text-[10px]">Daftarkan URL ini di dashboard Tripay Anda.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10"><CreditCard className="h-4 w-4 text-green-500" /></div>
            <CardTitle className="text-lg">Rekening Pembayaran Manual</CardTitle>
          </div>
          <CardDescription>Rekening ini akan ditampilkan kepada tenant untuk keperluan transfer manual jika Tripay belum dikonfigurasi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nama Bank</Label>
              <Input value={form.MANUAL_PAYMENT_BANK} onChange={e => setForm({...form, MANUAL_PAYMENT_BANK: e.target.value})} placeholder="Bank BCA" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Nomor Rekening</Label>
              <Input value={form.MANUAL_PAYMENT_NUMBER} onChange={e => setForm({...form, MANUAL_PAYMENT_NUMBER: e.target.value})} placeholder="1234 5678 90" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Atas Nama (Pemilik)</Label>
              <Input value={form.MANUAL_PAYMENT_NAME} onChange={e => setForm({...form, MANUAL_PAYMENT_NAME: e.target.value})} placeholder="PT BisnisPro Indonesia" className="rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Nomor WhatsApp Konfirmasi (Admin)</Label>
              <Input value={form.MANUAL_PAYMENT_WA} onChange={e => setForm({...form, MANUAL_PAYMENT_WA: e.target.value})} placeholder="6281234567890" className="rounded-xl" />
              <p className="text-[10px] text-muted-foreground">Awali dengan kode negara, contoh: 62812...</p>
            </div>
          </div>
          <Button className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-4 flex items-center justify-center h-10 px-4" onClick={() => handleSaveBatch(['MANUAL_PAYMENT_BANK', 'MANUAL_PAYMENT_NUMBER', 'MANUAL_PAYMENT_NAME', 'MANUAL_PAYMENT_WA'])} disabled={saving}>
            <Save className="h-4 w-4" /> Simpan Rekening Manual
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
