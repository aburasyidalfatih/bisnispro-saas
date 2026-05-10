import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Building, ShieldCheck } from "lucide-react"

export default async function PrintInvoicePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const tenantId = session.user.tenants?.[0]?.id
  if (!tenantId) redirect("/admin")

  const invoice = await db.invoice.findUnique({
    where: { id: params.id, tenantId },
    include: {
      student: { include: { classroom: true } },
      payments: { where: { status: "VERIFIED" } },
      tenant: true
    }
  })

  if (!invoice) return <div className="p-10 text-center">Tagihan tidak ditemukan</div>

  const isPaid = invoice.status === "PAID"
  const lunasDate = invoice.payments?.[invoice.payments.length - 1]?.createdAt

  return (
    <div className="bg-white text-black min-h-screen p-8 print:p-0 font-sans" suppressHydrationWarning>
      <div className="max-w-2xl mx-auto border print:border-0 rounded-lg p-10 print:p-0">
        
        {/* Header Kwitansi */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
           <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full border-2 border-black flex items-center justify-center">
                 <Building className="h-8 w-8" />
              </div>
              <div>
                 <h1 className="text-2xl font-black uppercase tracking-wider">{invoice.tenant.name}</h1>
                 <p className="text-xs text-gray-600">Sistem Keuangan dan Pembayaran Sekolah</p>
              </div>
           </div>
           <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-widest">Kwitansi</h2>
              <p className="text-sm font-mono mt-1">No: {invoice.code}</p>
           </div>
        </div>

        {/* Informasi Pembayar */}
        <div className="grid grid-cols-2 gap-8 mb-8">
           <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Diterima Dari:</p>
              <h3 className="font-bold text-lg">{invoice.student?.name}</h3>
              <p className="text-sm">NIS: {invoice.student?.nis || "-"}</p>
              <p className="text-sm">Kelas: {invoice.student?.classroom?.name || "-"}</p>
           </div>
           <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Tanggal Transaksi:</p>
              <p className="font-semibold">{lunasDate ? format(new Date(lunasDate), "d MMMM yyyy, HH:mm", { locale: localeId }) : format(new Date(invoice.createdAt), "d MMMM yyyy", { locale: localeId })}</p>
              
              <div className="mt-4 inline-block px-4 py-1.5 border-2 border-gray-800 rounded text-center">
                 <p className="text-[10px] uppercase font-bold text-gray-500">Status Pembayaran</p>
                 <p className={`font-black text-xl uppercase ${isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPaid ? "LUNAS" : "BELUM LUNAS"}
                 </p>
              </div>
           </div>
        </div>

        {/* Rincian Pembayaran */}
        <div className="mb-10">
           <p className="text-xs text-gray-500 uppercase font-bold mb-2">Guna Membayar:</p>
           <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="font-semibold text-lg">{invoice.title}</p>
              <p className="text-sm text-gray-600 mt-1">{invoice.notes || "Sesuai dengan ketentuan sekolah yang berlaku."}</p>
           </div>
        </div>

        {/* Nominal Besar */}
        <div className="flex justify-between items-center bg-gray-100 p-6 rounded-lg mb-10">
           <p className="text-sm font-bold uppercase text-gray-600">Sejumlah:</p>
           <h2 className="text-4xl font-black tracking-tight">Rp {invoice.amountPaid.toLocaleString('id-ID')}</h2>
        </div>

        {/* Footer / Tanda Tangan */}
        <div className="flex justify-between items-end mt-12 pt-8 border-t">
           <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg print:border print:border-gray-200">
              <ShieldCheck className="h-5 w-5" />
              <div>
                 <p className="text-[10px] font-bold uppercase">Dokumen Valid</p>
                 <p className="text-[10px]">Dicetak secara otomatis oleh sistem SchoolPro.</p>
              </div>
           </div>
           
           <div className="text-center">
              <p className="text-sm mb-16">Mengetahui, Bendahara</p>
              <div className="border-b border-black w-40 mx-auto"></div>
              <p className="text-xs mt-1 font-bold">{invoice.tenant.name}</p>
           </div>
        </div>

      </div>

      {/* Script untuk auto-print saat halaman dibuka */}
      <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
    </div>
  )
}
