import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { CheckCircle2, Clock, XCircle } from "lucide-react"
import Script from "next/script"
import Image from "next/image"

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth() as any
  if (!session) redirect("/login")

  const payment = await db.payment.findUnique({
    where: { id },
    include: {
      tenant: true,
      discountCode: {
        select: { code: true, percentage: true, bonusMonths: true }
      }
    }
  })

  if (!payment) return notFound()

  // Ensure the user belongs to the tenant that owns this payment
  const isOwner = session.user?.tenants?.some((t: any) => t.id === payment.tenantId)
  if (!isOwner && !session.user?.isSuperAdmin) {
    return notFound()
  }

  // Fetch platform settings for invoice branding
  const platformSettings = await db.platformSetting.findMany({
    where: {
      key: { in: ['app_logo', 'platform_name', 'platform_tagline', 'platform_address', 'contact_email', 'MANUAL_PAYMENT_BANK', 'MANUAL_PAYMENT_NUMBER', 'MANUAL_PAYMENT_NAME'] }
    }
  })

  const settingsMap: Record<string, string> = {}
  platformSettings.forEach(s => { settingsMap[s.key] = s.value })

  const platformLogo = settingsMap.app_logo || "/logo-bisnispro.png"
  const platformName = settingsMap.platform_name || "BisnisPro"
  const platformTagline = settingsMap.platform_tagline || "Solusi Manajemen Perusahaan Digital"
  const platformAddress = settingsMap.platform_address || ""
  const contactEmail = settingsMap.contact_email || "support@bisnispro.id"
  const bankName = settingsMap.MANUAL_PAYMENT_BANK || ""
  const bankAccount = settingsMap.MANUAL_PAYMENT_NUMBER || ""
  const bankHolder = settingsMap.MANUAL_PAYMENT_NAME || ""

  const isPaid = payment.status === "paid"
  const isFailed = payment.status === "failed" || payment.status === "expired" || payment.status === "cancelled"
  const isPending = payment.status === "pending"

  const meta = payment.metadata as any || {}
  const studentCount = meta.studentCount ?? 1
  const pricePerStudent = meta.pricePerStudent ?? (payment.amount / studentCount)
  const discountPercentage = meta.discountPercentage ?? meta.discountPercent ?? 0
  const discountAmount = meta.discountAmount ?? 0
  const subTotal = meta.subTotal ?? payment.amount + discountAmount
  const fullSubTotal = meta.fullSubTotal ?? subTotal
  const invoiceType = meta.type ?? "UPGRADE"
  const daysRemaining = meta.daysRemaining ?? null
  const ratio = meta.ratio ?? 1
  const isProrated = invoiceType === "ADDON_QUOTA" && ratio < 1
  const discountCode = payment.discountCode
  const bonusMonths = discountCode?.bonusMonths ?? 0

  // Hitung periode langganan
  const invoiceDate = new Date(payment.createdAt)
  const invoiceDateStr = invoiceDate.toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  })
  const expiredDate = payment.expiredAt ? new Date(payment.expiredAt).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  }) : null
  const paidDate = payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  }) : null

  // Periode langganan (untuk UPGRADE/RENEWAL)
  let periodStart = ""
  let periodEnd = ""
  if (invoiceType !== "AI_QUOTA") {
    if (isPaid && payment.paidAt) {
      const start = new Date(payment.paidAt)
      periodStart = start.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      if (invoiceType !== "ADDON_QUOTA") {
        const end = new Date(start)
        end.setFullYear(end.getFullYear() + 1)
        if (bonusMonths > 0) end.setMonth(end.getMonth() + bonusMonths)
        periodEnd = end.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      }
    } else if (invoiceType !== "ADDON_QUOTA") {
      // Estimasi untuk pending
      periodStart = "Setelah pembayaran dikonfirmasi"
      periodEnd = "12 bulan" + (bonusMonths > 0 ? ` + ${bonusMonths} bulan bonus` : "") + " sejak konfirmasi"
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex items-start sm:items-center justify-center" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="bg-white w-full max-w-3xl shadow-2xl rounded-2xl overflow-hidden relative" id="invoice-container">
        
        {/* PAID Watermark */}
        {isPaid && (
          <div className="paid-watermark" aria-hidden="true">
            <span>PAID</span>
          </div>
        )}

        {/* Top Color Bar */}
        <div className="h-2" style={{ background: "linear-gradient(90deg, #4F46E5, #7C3AED, #EC4899)" }} />

        {/* Header */}
        <div className="px-8 sm:px-10 pt-8 pb-6">
          <div className="flex justify-between items-start">
            {/* Left - Logo & Company */}
            <div className="flex items-start gap-4">
              <Image src={platformLogo} 
                alt={platformName}
                width={56}
                height={56}
                className="h-14 w-14 object-contain rounded-xl border border-gray-100 bg-white p-1 shadow-sm"
                unoptimized />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{platformName}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{platformTagline}</p>
                {platformAddress && (
                  <p className="text-xs text-gray-400 mt-1">{platformAddress}</p>
                )}
                {contactEmail && (
                  <p className="text-xs text-gray-400">{contactEmail}</p>
                )}
              </div>
            </div>

            {/* Right - Invoice Label */}
            <div className="text-right">
              <h1 className="text-3xl font-black tracking-tight" style={{ color: "#4F46E5" }}>INVOICE</h1>
              <p className="text-xs font-mono text-gray-500 mt-1">{payment.reference}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-8 sm:mx-10 h-px bg-gray-200" />

        {/* Info Grid */}
        <div className="px-8 sm:px-10 py-6 grid grid-cols-2 gap-6">
          {/* Bill To */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ditagihkan Kepada</p>
            <p className="text-base font-bold text-gray-900">{payment.tenant.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{payment.tenant.slug}.bisnispro.id</p>
          </div>

          {/* Invoice Details */}
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Detail Invoice</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-end gap-3">
                <span className="text-gray-500">Tanggal:</span>
                <span className="font-medium text-gray-800">{invoiceDateStr}</span>
              </div>
              {expiredDate && isPending && (
                <div className="flex justify-end gap-3">
                  <span className="text-gray-500">Jatuh Tempo:</span>
                  <span className="font-medium text-amber-600">{expiredDate}</span>
                </div>
              )}
              {paidDate && isPaid && (
                <div className="flex justify-end gap-3">
                  <span className="text-gray-500">Dibayar:</span>
                  <span className="font-medium text-emerald-600">{paidDate}</span>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <span className="text-gray-500">Metode:</span>
                <span className="font-medium text-gray-800">Transfer Bank</span>
              </div>
            </div>
          </div>
        </div>

        {/* Periode Langganan - hanya untuk non-AI */}
        {invoiceType !== "AI_QUOTA" && (periodStart || periodEnd) && (
          <div className="mx-8 sm:mx-10 mb-4 rounded-xl border border-indigo-100 bg-indigo-50/50 px-5 py-3.5">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">
              {invoiceType === "ADDON_QUOTA" ? "Penambahan Kuota" : "Periode Langganan"}
            </p>
            {invoiceType === "ADDON_QUOTA" ? (
              <p className="text-sm text-gray-700">
                Kuota <strong>+{studentCount} klien</strong> ditambahkan ke paket aktif
                {isPaid && " — berlaku hingga masa aktif paket berakhir"}
              </p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-semibold">{periodStart}</span>
                {periodEnd && (
                  <>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold">{periodEnd}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status Badge */}
        <div className="px-8 sm:px-10 pb-4">
          {isPaid && (
            <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-bold text-sm">LUNAS</span>
            </div>
          )}
          {isPending && (
            <div className="inline-flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
              <Clock className="h-5 w-5" />
              <span className="font-bold text-sm">BELUM BAYAR</span>
            </div>
          )}
          {isFailed && (
            <div className="inline-flex items-center gap-2 text-rose-700 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">
              <XCircle className="h-5 w-5" />
              <span className="font-bold text-sm">DIBATALKAN / GAGAL</span>
            </div>
          )}
        </div>

        {/* Invoice Items Table */}
        <div className="px-8 sm:px-10 pb-6">
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: "#F8F9FC" }}>
                <TableHead className="py-3.5 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wider rounded-l-lg">Deskripsi</TableHead>
                <TableHead className="py-3.5 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wider text-center">Qty</TableHead>
                <TableHead className="py-3.5 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wider text-right">Harga Satuan</TableHead>
                <TableHead className="py-3.5 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wider text-right rounded-r-lg">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b border-gray-100">
                <TableCell className="py-5 px-4">
                  <p className="font-semibold text-gray-900">
                    {invoiceType === "ADDON_QUOTA" ? "Penambahan Kuota Klien" : 
                     invoiceType === "AI_QUOTA" ? "Top-Up Token AI" : 
                     "Upgrade / Perpanjang Paket PRO"}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {invoiceType === "AI_QUOTA" ? "Pembelian token AI" : "Biaya berlangganan per klien (Tahunan)"}
                  </p>
                  {meta.isLockedPrice && (
                    <p className="text-[10px] text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded mt-1">Harga Kontrak Aktif</p>
                  )}
                </TableCell>
                <TableCell className="py-5 px-4 text-center text-gray-700 font-medium">{studentCount}</TableCell>
                <TableCell className="py-5 px-4 text-right text-gray-700 font-medium">Rp {Number(pricePerStudent).toLocaleString("id-ID")}</TableCell>
                <TableCell className="py-5 px-4 text-right text-gray-900 font-bold">Rp {Number(studentCount * pricePerStudent).toLocaleString("id-ID")}</TableCell>
              </TableRow>
              {isProrated && (
                <TableRow className="border-b border-gray-100">
                  <TableCell className="py-3 px-4" colSpan={3}>
                    <p className="text-sm text-gray-600">Prorata sisa masa aktif ({daysRemaining} hari / 365 hari)</p>
                    <p className="text-xs text-gray-400">Harga disesuaikan dengan sisa masa aktif paket</p>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right text-gray-700 font-medium">× {(ratio * 100).toFixed(1)}%</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Total Summary */}
        <div className="px-8 sm:px-10 pb-6">
          <div className="flex justify-end">
            <div className="w-full sm:w-80">
              {/* Harga Asli (sebelum prorata/diskon) */}
              {isProrated && (
                <div className="flex justify-between py-2.5 text-sm">
                  <span className="text-gray-500">Harga Penuh ({studentCount} × Rp {Number(pricePerStudent).toLocaleString("id-ID")})</span>
                  <span className="text-gray-800 font-medium">Rp {Number(studentCount * pricePerStudent).toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between py-2.5 text-sm">
                <span className="text-gray-500">{isProrated ? `Subtotal (Prorata ${(ratio * 100).toFixed(1)}%)` : "Subtotal"}</span>
                <span className="text-gray-800 font-medium">Rp {Number(subTotal).toLocaleString("id-ID")}</span>
              </div>
              {discountPercentage > 0 && (
                <div className="flex justify-between py-2.5 text-sm">
                  <span className="text-emerald-600">
                    Diskon {discountCode ? `(${discountCode.code}) ` : ""}{discountPercentage.toFixed(0)}%
                  </span>
                  <span className="text-emerald-600 font-medium">- Rp {Number(discountAmount).toLocaleString("id-ID")}</span>
                </div>
              )}
              {discountCode?.bonusMonths && discountCode.bonusMonths > 0 && (
                <div className="flex justify-between py-2.5 text-sm">
                  <span className="text-blue-600">Bonus Masa Aktif</span>
                  <span className="text-blue-600 font-medium">+{discountCode.bonusMonths} bulan</span>
                </div>
              )}
              <div className="flex justify-between py-2.5 text-sm border-b border-gray-200">
                <span className="text-gray-500">Pajak (0%)</span>
                <span className="text-gray-800 font-medium">Rp 0</span>
              </div>
              <div className="flex justify-between py-4 items-center">
                <span className="text-lg font-black text-gray-900">Total Tagihan</span>
                <span className="text-xl font-black" style={{ color: "#4F46E5" }}>Rp {payment.amount.toLocaleString("id-ID")}</span>
              </div>

              {/* Harga per klien setelah diskon */}
              {discountPercentage > 0 && studentCount > 0 && (
                <div className="rounded-lg border border-dashed border-gray-200 p-3 mt-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Harga asli per klien</span>
                    <span className="text-gray-500 line-through">Rp {Number(pricePerStudent).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-600 font-semibold">Harga setelah diskon per klien</span>
                    <span className="text-emerald-600 font-bold">Rp {Math.round(payment.amount / studentCount).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rekening Pembayaran - hanya tampil jika pending */}
        {isPending && bankName && (
          <div className="mx-8 sm:mx-10 mb-6 rounded-xl border border-amber-200 bg-amber-50/50 px-5 py-4">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Transfer ke Rekening</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 text-sm">{bankName}</p>
                <p className="text-gray-600 text-xs">a.n {bankHolder}</p>
              </div>
              <p className="font-mono font-bold text-gray-900">{bankAccount}</p>
            </div>
          </div>
        )}

        {/* Syarat & Ketentuan */}
        <div className="mx-8 sm:mx-10 mb-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Catatan & Ketentuan</p>
          <ul className="text-[11px] text-gray-500 space-y-1 list-disc list-inside leading-relaxed">
            {isPending && <li>Harap lakukan pembayaran sebelum tanggal jatuh tempo yang tertera.</li>}
            {isPending && <li>Invoice yang melewati batas waktu akan otomatis dibatalkan oleh sistem.</li>}
            <li>Layanan akan aktif setelah pembayaran dikonfirmasi oleh administrator.</li>
            <li>Harga sudah termasuk seluruh biaya layanan. Tidak ada biaya tersembunyi.</li>
            {invoiceType !== "AI_QUOTA" && <li>Kuota klien berlaku sesuai periode langganan yang tertera.</li>}
          </ul>
        </div>

        {/* Footer */}
        <div style={{ backgroundColor: "#F8F9FC" }} className="px-8 sm:px-10 py-6">
          <div className="flex items-start gap-4">
            <Image src={platformLogo} 
              alt={platformName}
              width={32}
              height={32}
              className="h-8 w-8 object-contain rounded-lg opacity-60"
              unoptimized />
            <div className="text-xs text-gray-500 space-y-1">
              <p>Terima kasih atas kepercayaan Anda menggunakan layanan <strong>{platformName}</strong>.</p>
              <p>Jika Anda memiliki pertanyaan terkait invoice ini, silakan hubungi tim support kami melalui <strong>{contactEmail}</strong>.</p>
              <p className="text-gray-400 mt-2">Dokumen ini dicetak secara otomatis oleh sistem dan tidak memerlukan tanda tangan.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Script to trigger print automatically */}
      <Script id="invoice-print-script" dangerouslySetInnerHTML={{ __html: `
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        }
      `}} />

      {/* Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        
        .paid-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          z-index: 10;
          pointer-events: none;
        }
        .paid-watermark span {
          display: block;
          font-size: 120px;
          font-weight: 900;
          color: rgba(16, 185, 129, 0.07);
          letter-spacing: 20px;
          font-family: 'Inter', sans-serif;
          user-select: none;
        }
        
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #invoice-container { box-shadow: none !important; max-width: 100%; border-radius: 0; }
          .paid-watermark span { color: rgba(16, 185, 129, 0.06); }
          @page { margin: 0.8cm; }
        }
      `}} />
    </div>
  )
}
