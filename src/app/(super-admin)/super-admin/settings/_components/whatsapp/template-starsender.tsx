import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CreditCard, ShieldAlert } from "lucide-react"
import type { SettingsForm } from "../../constants"

interface Props {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
}

export function TemplateStarsender({ form, setForm }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
          <Label className="text-emerald-600 font-bold">1. Pendaftaran Diterima (PENDING)</Label>
          <div className="flex items-center gap-4 mt-1 sm:mt-0">
            <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_PENDING === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_PENDING: checked ? "true" : "false"})} /></div>
            <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_PENDING === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_PENDING: checked ? "true" : "false"})} /></div>
          </div>
        </div>
        <Textarea value={form.WA_TEMPLATE_PENDING} onChange={e => setForm({...form, WA_TEMPLATE_PENDING: e.target.value})} placeholder={`Halo {{adminName}},\nSelamat! Pendaftaran {{schoolName}} diterima.`} className="min-h-[100px] text-xs font-mono" disabled={form.WA_ENABLE_PENDING !== "true" && form.EMAIL_ENABLE_PENDING !== "true"} />
      </div>
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
          <Label className="text-blue-600 font-bold">2. Pendaftaran Disetujui (APPROVED)</Label>
          <div className="flex items-center gap-4 mt-1 sm:mt-0">
            <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_APPROVED === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_APPROVED: checked ? "true" : "false"})} /></div>
            <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_APPROVED === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_APPROVED: checked ? "true" : "false"})} /></div>
          </div>
        </div>
        <Textarea value={form.WA_TEMPLATE_APPROVED} onChange={e => setForm({...form, WA_TEMPLATE_APPROVED: e.target.value})} placeholder={`Halo {{adminName}},\nPendaftaran {{schoolName}} disetujui. URL: {{loginUrl}}`} className="min-h-[100px] text-xs font-mono" disabled={form.WA_ENABLE_APPROVED !== "true" && form.EMAIL_ENABLE_APPROVED !== "true"} />
      </div>
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
          <Label className="text-amber-600 font-bold">3. Revisi Data (REVISION)</Label>
          <div className="flex items-center gap-4 mt-1 sm:mt-0">
            <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_REVISION === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_REVISION: checked ? "true" : "false"})} /></div>
            <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_REVISION === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_REVISION: checked ? "true" : "false"})} /></div>
          </div>
        </div>
        <Textarea value={form.WA_TEMPLATE_REVISION} onChange={e => setForm({...form, WA_TEMPLATE_REVISION: e.target.value})} placeholder={`Halo {{adminName}},\nRevisi: {{adminMessage}}\n\nKlik disini: {{revisionUrl}}`} className="min-h-[100px] text-xs font-mono" disabled={form.WA_ENABLE_REVISION !== "true" && form.EMAIL_ENABLE_REVISION !== "true"} />
      </div>
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
          <Label className="text-red-600 font-bold">4. Pendaftaran Ditolak (REJECTED)</Label>
          <div className="flex items-center gap-4 mt-1 sm:mt-0">
            <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_REJECTED === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_REJECTED: checked ? "true" : "false"})} /></div>
            <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_REJECTED === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_REJECTED: checked ? "true" : "false"})} /></div>
          </div>
        </div>
        <Textarea value={form.WA_TEMPLATE_REJECTED} onChange={e => setForm({...form, WA_TEMPLATE_REJECTED: e.target.value})} placeholder={`Halo {{adminName}},\nDitolak: {{adminMessage}}`} className="min-h-[100px] text-xs font-mono" disabled={form.WA_ENABLE_REJECTED !== "true" && form.EMAIL_ENABLE_REJECTED !== "true"} />
      </div>
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
          <Label className="text-purple-600 font-bold">5. Alert ke Super Admin</Label>
          <div className="flex items-center gap-4 mt-1 sm:mt-0">
            <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_ALERT_SUPERADMIN === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_ALERT_SUPERADMIN: checked ? "true" : "false"})} /></div>
            <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_ALERT_SUPERADMIN === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_ALERT_SUPERADMIN: checked ? "true" : "false"})} /></div>
          </div>
        </div>
        <Textarea value={form.WA_TEMPLATE_ALERT_SUPERADMIN} onChange={e => setForm({...form, WA_TEMPLATE_ALERT_SUPERADMIN: e.target.value})} placeholder={`Perusahaan Baru: {{schoolName}}\nWA: {{adminPhone}}`} className="min-h-[100px] text-xs font-mono" disabled={form.WA_ENABLE_ALERT_SUPERADMIN !== "true" && form.EMAIL_ENABLE_ALERT_SUPERADMIN !== "true"} />
      </div>
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
          <Label className="text-orange-600 font-bold">6. Alert ke Marketer (Afiliasi)</Label>
          <div className="flex items-center gap-4 mt-1 sm:mt-0">
            <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_ALERT_AFFILIATE === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_ALERT_AFFILIATE: checked ? "true" : "false"})} /></div>
            <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_ALERT_AFFILIATE === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_ALERT_AFFILIATE: checked ? "true" : "false"})} /></div>
          </div>
        </div>
        <Textarea value={form.WA_TEMPLATE_ALERT_AFFILIATE} onChange={e => setForm({...form, WA_TEMPLATE_ALERT_AFFILIATE: e.target.value})} placeholder={`Halo {{affiliateName}},\nLead baru: {{schoolName}}`} className="min-h-[100px] text-xs font-mono" disabled={form.WA_ENABLE_ALERT_AFFILIATE !== "true" && form.EMAIL_ENABLE_ALERT_AFFILIATE !== "true"} />
      </div>

      <div className="col-span-1 md:col-span-2 border-t pt-6 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-4 w-4 text-indigo-500" />
          <h4 className="font-bold text-base">Template Notifikasi Billing</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Variabel: {'{{tenantName}}, {{reference}}, {{amount}}, {{expiredAt}}, {{expiresAt}}, {{invoiceType}}, {{bankName}}, {{bankNumber}}, {{bankAccountName}}, {{adminWA}}, {{studentQuota}}, {{affiliateName}}, {{commissionAmount}}, {{currentBalance}}, {{daysRemaining}}, {{urgency}}'}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <Label className="text-indigo-600 font-bold">7. Invoice Dibuat → Tenant</Label>
              <div className="flex items-center gap-4 mt-1 sm:mt-0">
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_INVOICE_CREATED === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_INVOICE_CREATED: checked ? "true" : "false"})} /></div>
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_INVOICE_CREATED === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_INVOICE_CREATED: checked ? "true" : "false"})} /></div>
              </div>
            </div>
            <Textarea value={form.WA_TEMPLATE_INVOICE_CREATED} onChange={e => setForm({...form, WA_TEMPLATE_INVOICE_CREATED: e.target.value})} className="min-h-[120px] text-xs font-mono" disabled={form.WA_ENABLE_INVOICE_CREATED !== "true" && form.EMAIL_ENABLE_INVOICE_CREATED !== "true"} />
          </div>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <Label className="text-green-600 font-bold">8. Pembayaran Dikonfirmasi → Tenant</Label>
              <div className="flex items-center gap-4 mt-1 sm:mt-0">
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_PAYMENT_CONFIRMED === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_PAYMENT_CONFIRMED: checked ? "true" : "false"})} /></div>
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_PAYMENT_CONFIRMED === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_PAYMENT_CONFIRMED: checked ? "true" : "false"})} /></div>
              </div>
            </div>
            <Textarea value={form.WA_TEMPLATE_PAYMENT_CONFIRMED} onChange={e => setForm({...form, WA_TEMPLATE_PAYMENT_CONFIRMED: e.target.value})} className="min-h-[120px] text-xs font-mono" disabled={form.WA_ENABLE_PAYMENT_CONFIRMED !== "true" && form.EMAIL_ENABLE_PAYMENT_CONFIRMED !== "true"} />
          </div>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <Label className="text-amber-600 font-bold">9. Komisi Masuk → Afiliasi</Label>
              <div className="flex items-center gap-4 mt-1 sm:mt-0">
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_AFFILIATE_COMMISSION === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_AFFILIATE_COMMISSION: checked ? "true" : "false"})} /></div>
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_AFFILIATE_COMMISSION === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_AFFILIATE_COMMISSION: checked ? "true" : "false"})} /></div>
              </div>
            </div>
            <Textarea value={form.WA_TEMPLATE_AFFILIATE_COMMISSION} onChange={e => setForm({...form, WA_TEMPLATE_AFFILIATE_COMMISSION: e.target.value})} className="min-h-[120px] text-xs font-mono" disabled={form.WA_ENABLE_AFFILIATE_COMMISSION !== "true" && form.EMAIL_ENABLE_AFFILIATE_COMMISSION !== "true"} />
          </div>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <Label className="text-red-600 font-bold">10. Pengingat Langganan → Tenant</Label>
              <div className="flex items-center gap-4 mt-1 sm:mt-0">
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_SUBSCRIPTION_REMINDER === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_SUBSCRIPTION_REMINDER: checked ? "true" : "false"})} /></div>
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_SUBSCRIPTION_REMINDER === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_SUBSCRIPTION_REMINDER: checked ? "true" : "false"})} /></div>
              </div>
            </div>
            <Textarea value={form.WA_TEMPLATE_SUBSCRIPTION_REMINDER} onChange={e => setForm({...form, WA_TEMPLATE_SUBSCRIPTION_REMINDER: e.target.value})} className="min-h-[120px] text-xs font-mono" disabled={form.WA_ENABLE_SUBSCRIPTION_REMINDER !== "true" && form.EMAIL_ENABLE_SUBSCRIPTION_REMINDER !== "true"} />
          </div>
        </div>
      </div>

      <div className="col-span-1 md:col-span-2 border-t pt-6 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="h-4 w-4 text-rose-500" />
          <h4 className="font-bold text-base">Alert Super Admin (Sistem & Finansial)</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Variabel: {'{{tenantName}}, {{reference}}, {{amount}}, {{invoiceType}}, {{affiliateName}}, {{bankName}}, {{bankAccount}}, {{accountName}}'}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <Label className="text-emerald-600 font-bold">11. Pembayaran Berhasil</Label>
              <div className="flex items-center gap-4 mt-1 sm:mt-0">
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_PAYMENT_SUCCESS_SUPERADMIN === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_PAYMENT_SUCCESS_SUPERADMIN: checked ? "true" : "false"})} /></div>
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_PAYMENT_SUCCESS_SUPERADMIN === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_PAYMENT_SUCCESS_SUPERADMIN: checked ? "true" : "false"})} /></div>
              </div>
            </div>
            <Textarea value={form.WA_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN} onChange={e => setForm({...form, WA_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN: e.target.value})} className="min-h-[120px] text-xs font-mono" disabled={form.WA_ENABLE_PAYMENT_SUCCESS_SUPERADMIN !== "true" && form.EMAIL_ENABLE_PAYMENT_SUCCESS_SUPERADMIN !== "true"} />
          </div>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <Label className="text-orange-600 font-bold">12. Permintaan Penarikan Dana</Label>
              <div className="flex items-center gap-4 mt-1 sm:mt-0">
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN: checked ? "true" : "false"})} /></div>
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN: checked ? "true" : "false"})} /></div>
              </div>
            </div>
            <Textarea value={form.WA_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN} onChange={e => setForm({...form, WA_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN: e.target.value})} className="min-h-[120px] text-xs font-mono" disabled={form.WA_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN !== "true" && form.EMAIL_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN !== "true"} />
          </div>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <Label className="text-rose-600 font-bold">13. Invoice Kedaluwarsa</Label>
              <div className="flex items-center gap-4 mt-1 sm:mt-0">
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_INVOICE_EXPIRED_SUPERADMIN === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_INVOICE_EXPIRED_SUPERADMIN: checked ? "true" : "false"})} /></div>
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_INVOICE_EXPIRED_SUPERADMIN === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_INVOICE_EXPIRED_SUPERADMIN: checked ? "true" : "false"})} /></div>
              </div>
            </div>
            <Textarea value={form.WA_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN} onChange={e => setForm({...form, WA_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN: e.target.value})} className="min-h-[120px] text-xs font-mono" disabled={form.WA_ENABLE_INVOICE_EXPIRED_SUPERADMIN !== "true" && form.EMAIL_ENABLE_INVOICE_EXPIRED_SUPERADMIN !== "true"} />
          </div>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <Label className="text-emerald-600 font-bold">14. Pencairan Dana Disetujui → Afiliasi</Label>
              <div className="flex items-center gap-4 mt-1 sm:mt-0">
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE: checked ? "true" : "false"})} /></div>
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE: checked ? "true" : "false"})} /></div>
              </div>
            </div>
            <Textarea value={form.WA_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE} onChange={e => setForm({...form, WA_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE: e.target.value})} placeholder={`*✅ Pencairan Dana Berhasil!*\n\nHalo {{affiliateName}},\nPermintaan pencairan dana afiliasi Anda telah disetujui.\n\n💰 Nominal: Rp {{amount}}\n🏦 Bank: {{bankName}}\n🔢 No. Rek: {{bankAccount}}\n👤 A.N: {{accountName}}`} className="min-h-[120px] text-xs font-mono" disabled={form.WA_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE !== "true" && form.EMAIL_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE !== "true"} />
          </div>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <Label className="text-rose-600 font-bold">15. Pencairan Dana Ditolak → Afiliasi</Label>
              <div className="flex items-center gap-4 mt-1 sm:mt-0">
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">WA</span><Switch checked={form.WA_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE === "true"} onCheckedChange={(checked) => setForm({...form, WA_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE: checked ? "true" : "false"})} /></div>
                <div className="flex items-center gap-1.5"><span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span><Switch checked={form.EMAIL_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE === "true"} onCheckedChange={(checked) => setForm({...form, EMAIL_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE: checked ? "true" : "false"})} /></div>
              </div>
            </div>
            <Textarea value={form.WA_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE} onChange={e => setForm({...form, WA_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE: e.target.value})} placeholder={`*❌ Pencairan Dana Ditolak*\n\nHalo {{affiliateName}},\nPermintaan pencairan dana sebesar Rp {{amount}} ditolak oleh admin.\n\nCatatan: {{notes}}\n\nDana telah dikembalikan ke saldo Anda.`} className="min-h-[120px] text-xs font-mono" disabled={form.WA_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE !== "true" && form.EMAIL_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE !== "true"} />
          </div>
        </div>
      </div>
    </div>
  )
}
