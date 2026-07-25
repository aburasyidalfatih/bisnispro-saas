import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, CreditCard, ShieldAlert } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { SettingsForm } from "../../constants"

interface Props {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
}

export function TemplateWavio({ form, setForm }: Props) {
  const [wavioTemplates, setWavioTemplates] = useState<any[]>([])
  const [syncingTemplates, setSyncingTemplates] = useState(false)

  const handleSyncWavioTemplates = async () => {
    if (!form.WAVIO_API_KEY) {
      toast({ title: "Isi API Key Wavio terlebih dahulu", variant: "destructive" })
      return
    }
    setSyncingTemplates(true)
    try {
      const res = await fetch("/api/tenant/settings/wavio-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wavioApiKey: form.WAVIO_API_KEY }),
      })
      const data = await res.json()
      if (res.ok) {
        setWavioTemplates(data.data || [])
        toast({ title: "✅ Berhasil", description: `Berhasil menarik ${(data.data || []).length} template dari Wavio.` })
      } else {
        throw new Error(data.error)
      }
    } catch (e: any) {
      toast({ title: "❌ Gagal Sinkronisasi", description: e.message, variant: "destructive" })
    } finally {
      setSyncingTemplates(false)
    }
  }

  return (
    <>
      <div className="rounded-xl bg-orange-500/10 p-4 mb-4 text-sm text-orange-800 dark:text-orange-200 border border-orange-500/20">
        <p><strong>Penting:</strong> Untuk Wavio dan Meta, isi form di bawah ini dengan <strong>Nama Template</strong> yang sudah disetujui di Meta Business Manager (contoh: <code>business_registration_pending</code>), bukan teks isi pesannya. Pastikan urutan variabel di Meta sesuai dengan format sistem.</p>
      </div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handleSyncWavioTemplates} disabled={syncingTemplates} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${syncingTemplates ? 'animate-spin' : ''}`} />
          {syncingTemplates ? 'Menarik Data...' : 'Sinkronisasi Template Wavio'}
        </Button>
      </div>
      <datalist id="wavio-templates-list">
        {wavioTemplates.map((t, idx) => (
          <option key={idx} value={t.name}>{t.name} ({t.language})</option>
        ))}
      </datalist>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-emerald-600 font-bold">1. Pendaftaran Diterima (PENDING)</Label>
          <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_PENDING} onChange={e => setForm({...form, WAVIO_TEMPLATE_PENDING: e.target.value})} placeholder="business_registration_pending" className="rounded-xl" />
          <WavioTemplateHelper text={`Halo {{1}},\n\nSelamat! Formulir pendaftaran perusahaan {{2}} telah kami terima dan saat ini sudah masuk ke dalam antrean peninjauan tim kami.\n\nKami akan segera menghubungi Anda kembali setelah proses verifikasi selesai.\n\nTerima kasih.`} />
        </div>
        <div className="space-y-2">
          <Label className="text-blue-600 font-bold">2. Pendaftaran Disetujui (APPROVED)</Label>
          <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_APPROVED} onChange={e => setForm({...form, WAVIO_TEMPLATE_APPROVED: e.target.value})} placeholder="business_registration_approved" className="rounded-xl" />
          <WavioTemplateHelper text={`Halo {{1}},\n\nPendaftaran perusahaan {{2}} telah disetujui. Anda sekarang dapat mengakses dashboard perusahaan menggunakan informasi berikut:\n\nURL Login: {{3}}\nEmail: {{4}}\nWA Penanggung Jawab: {{5}}\n\nSilakan gunakan password yang Anda buat pada saat mendaftar.\n\nTerima kasih.`} />
        </div>
        <div className="space-y-2">
          <Label className="text-amber-600 font-bold">3. Revisi Data (REVISION)</Label>
          <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_REVISION} onChange={e => setForm({...form, WAVIO_TEMPLATE_REVISION: e.target.value})} placeholder="business_registration_revision" className="rounded-xl" />
          <WavioTemplateHelper text={`Halo {{1}},\n\nTerima kasih telah mendaftar. Namun, ada beberapa data yang perlu diperbaiki:\n\n"{{2}}"\n\nSilakan klik tautan berikut untuk melengkapi data: {{3}}`} />
        </div>
        <div className="space-y-2">
          <Label className="text-red-600 font-bold">4. Pendaftaran Ditolak (REJECTED)</Label>
          <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_REJECTED} onChange={e => setForm({...form, WAVIO_TEMPLATE_REJECTED: e.target.value})} placeholder="business_registration_rejected" className="rounded-xl" />
          <WavioTemplateHelper text={`Halo {{1}},\n\nMohon maaf, pendaftaran perusahaan {{2}} belum dapat kami setujui saat ini.\n\nAlasan: {{3}}\n\nTerima kasih atas minat Anda.`} />
        </div>
        <div className="space-y-2">
          <Label className="text-purple-600 font-bold">5. Alert ke Super Admin</Label>
          <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_ALERT_SUPERADMIN} onChange={e => setForm({...form, WAVIO_TEMPLATE_ALERT_SUPERADMIN: e.target.value})} placeholder="superadmin_alert_new_business" className="rounded-xl" />
          <WavioTemplateHelper text={`*PENDAFTARAN PERUSAHAAN BARU*\n\nPerusahaan: {{1}}\nWA Pendaftar: {{2}}\n\nSilakan cek di Panel Super Admin untuk meninjau pengajuan ini.`} />
        </div>
        <div className="space-y-2">
          <Label className="text-orange-600 font-bold">6. Alert ke Marketer (Afiliasi)</Label>
          <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_ALERT_AFFILIATE} onChange={e => setForm({...form, WAVIO_TEMPLATE_ALERT_AFFILIATE: e.target.value})} placeholder="affiliate_alert_new_lead" className="rounded-xl" />
          <WavioTemplateHelper text={`Halo {{1}},\n\nAda pendaftaran perusahaan baru ({{2}}) menggunakan kode referral Anda ({{3}}).\n\nPantau statusnya melalui Dashboard Afiliasi Anda. Terus semangat!`} />
        </div>
      </div>
      
      <div className="border-t pt-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4 text-indigo-500" />
          <h4 className="font-bold text-base">Template Notifikasi Billing (WABA)</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-indigo-600 font-bold">7. Invoice Dibuat → Tenant</Label>
            <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_INVOICE_CREATED} onChange={e => setForm({...form, WAVIO_TEMPLATE_INVOICE_CREATED: e.target.value})} placeholder="billing_invoice_created" className="rounded-xl" />
            <WavioTemplateHelper text={`Halo Admin {{1}},\n\nTagihan baru untuk layanan BisnisPro telah diterbitkan.\nNomor Invoice: {{2}}\nLayanan: {{3}}\nJumlah Tagihan: *{{4}}*\nBatas Pembayaran: {{5}}\n\nSilakan lakukan transfer ke rekening berikut:\nBank: {{6}}\nNo Rekening: {{7}}\nAtas Nama: {{8}}\n\nHubungi kami di {{9}} jika butuh bantuan.`} />
          </div>
          <div className="space-y-2">
            <Label className="text-green-600 font-bold">8. Pembayaran Dikonfirmasi → Tenant</Label>
            <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_PAYMENT_CONFIRMED} onChange={e => setForm({...form, WAVIO_TEMPLATE_PAYMENT_CONFIRMED: e.target.value})} placeholder="billing_payment_confirmed" className="rounded-xl" />
            <WavioTemplateHelper text={`Halo Admin {{1}},\n\nTerima kasih. Pembayaran Anda untuk Tagihan {{2}} (Layanan: {{3}}) senilai *{{4}}* telah berhasil kami konfirmasi.\n\nLimit Kuota Klien: {{5}}\nMasa Aktif Hingga: {{6}}\n\nTerima kasih telah mempercayakan sistem manajemen perusahaan Anda pada BisnisPro.`} />
          </div>
          <div className="space-y-2">
            <Label className="text-amber-600 font-bold">9. Komisi Masuk → Afiliasi</Label>
            <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_AFFILIATE_COMMISSION} onChange={e => setForm({...form, WAVIO_TEMPLATE_AFFILIATE_COMMISSION: e.target.value})} placeholder="billing_affiliate_commission" className="rounded-xl" />
            <WavioTemplateHelper text={`Halo {{1}},\n\nKabar baik! Anda baru saja mendapatkan komisi sebesar *{{2}}* dari pembayaran perusahaan {{3}}.\n\nTotal Saldo Aktif Anda saat ini adalah: {{4}}\n\nTingkatkan terus pendaftaran perusahaan melalui tautan referral Anda!`} />
          </div>
          <div className="space-y-2">
            <Label className="text-red-600 font-bold">10. Pengingat Langganan → Tenant</Label>
            <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_SUBSCRIPTION_REMINDER} onChange={e => setForm({...form, WAVIO_TEMPLATE_SUBSCRIPTION_REMINDER: e.target.value})} placeholder="billing_subscription_reminder" className="rounded-xl" />
            <WavioTemplateHelper text={`Halo Admin {{1}},\n\n⚠️ PENGINGAT LAYANAN\n\nLayanan BisnisPro Anda akan segera berakhir pada {{2}} ({{3}} hari lagi).\nHarap segera melunasi / memperpanjang paket agar akses sistem perusahaan Anda tetap berjalan dengan lancar.`} />
          </div>
        </div>
      </div>

      <div className="border-t pt-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="h-4 w-4 text-rose-500" />
          <h4 className="font-bold text-base">Alert Super Admin (Sistem & Finansial WABA)</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-emerald-600 font-bold">11. Pembayaran Berhasil</Label>
            <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN} onChange={e => setForm({...form, WAVIO_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN: e.target.value})} placeholder="superadmin_alert_payment_success" className="rounded-xl" />
            <WavioTemplateHelper text={`*PEMBAYARAN BERHASIL ({{1}})*\n\nTenant: {{2}}\nNo Invoice: {{3}}\nNominal: {{4}}\n\nPembayaran langganan ini telah disahkan oleh sistem secara otomatis.`} />
          </div>
          <div className="space-y-2">
            <Label className="text-orange-600 font-bold">12. Permintaan Penarikan Dana</Label>
            <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN} onChange={e => setForm({...form, WAVIO_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN: e.target.value})} placeholder="superadmin_alert_withdrawal_request" className="rounded-xl" />
            <WavioTemplateHelper text={`*PERMINTAAN PENARIKAN DANA AFILIASI*\n\nNama Afiliasi: {{1}}\nNominal Ditarik: {{2}}\nTujuan Transfer: {{3}} ({{4}} - a/n {{5}})\n\nSilakan proses transfer melalui Panel Finansial Super Admin.`} />
          </div>
          <div className="space-y-2">
            <Label className="text-rose-600 font-bold">13. Invoice Kedaluwarsa</Label>
            <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN} onChange={e => setForm({...form, WAVIO_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN: e.target.value})} placeholder="superadmin_alert_invoice_expired" className="rounded-xl" />
            <WavioTemplateHelper text={`*INVOICE KEDALUWARSA (EXPIRED)*\n\nInvoice {{1}} milik tenant {{2}} senilai {{3}} telah melewati batas waktu dan dibatalkan otomatis oleh sistem.`} />
          </div>
          <div className="space-y-2">
            <Label className="text-emerald-600 font-bold">14. Pencairan Dana Disetujui → Afiliasi</Label>
            <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE} onChange={e => setForm({...form, WAVIO_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE: e.target.value})} placeholder="affiliate_withdrawal_approved" className="rounded-xl" />
            <WavioTemplateHelper text={`*PENCAIRAN DANA BERHASIL*\n\nHalo {{1}},\nPermintaan pencairan dana sebesar {{2}} telah berhasil ditransfer ke rekening {{3}} ({{4}} - a/n {{5}}).`} />
          </div>
          <div className="space-y-2">
            <Label className="text-rose-600 font-bold">15. Pencairan Dana Ditolak → Afiliasi</Label>
            <Input list="wavio-templates-list" value={form.WAVIO_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE} onChange={e => setForm({...form, WAVIO_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE: e.target.value})} placeholder="affiliate_withdrawal_rejected" className="rounded-xl" />
            <WavioTemplateHelper text={`*PENCAIRAN DANA DITOLAK*\n\nHalo {{1}},\nPermintaan pencairan dana sebesar {{2}} DITOLAK oleh admin dengan catatan:\n{{3}}\n\nDana Anda telah dikembalikan ke saldo akun.`} />
          </div>
        </div>
      </div>
    </>
  )
}

function WavioTemplateHelper({ text }: { text: string }) {
  return (
    <details className="text-xs text-muted-foreground mt-1 cursor-pointer group">
      <summary className="font-medium hover:text-primary list-none flex items-center gap-1">
        <span className="text-primary group-open:hidden">▶</span>
        <span className="text-primary hidden group-open:inline">▼</span>
        Lihat teks untuk di-copy ke Wavio
      </summary>
      <div className="mt-2 p-3 bg-muted/50 border rounded-lg whitespace-pre-wrap font-mono text-[11px] select-all text-foreground leading-relaxed cursor-text">
        {text}
      </div>
    </details>
  )
}
