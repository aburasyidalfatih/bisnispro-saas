import { NextResponse } from 'next/server'
import { db, withTenant } from '@/lib/db'
import { generateInvoicePdf } from '@/features/finance/services/pdf.service'
import { getBillingSettings } from '@/features/finance/services/billing-notification.service'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'tenant' // 'tenant' or 'student'
    const tenantId = searchParams.get('tenantId') // required if type === 'student'

    let pdfBuffer: Buffer

    if (type === 'student') {
      if (!tenantId) return new NextResponse('Missing tenantId', { status: 400 })
      const tenantDb = withTenant(tenantId)
      
      const invoice = await tenantDb.invoice.findUnique({
        where: { id },
        include: { student: true }
      })
      if (!invoice) return new NextResponse('Invoice not found', { status: 404 })

      const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
      
      // Ambil data rekening pembayaran tenant
      const settings = tenant?.settings as any || {}
      const bankName = settings.manualPayment?.bank || 'Bank Pembayaran'
      const bankNumber = settings.manualPayment?.number || '-'
      const bankAccountName = settings.manualPayment?.name || 'Sekolah'

      pdfBuffer = await generateInvoicePdf({
        invoiceNumber: invoice.code,
        title: invoice.title,
        amount: invoice.amount,
        date: format(invoice.createdAt, 'dd MMMM yyyy', { locale: localeId }),
        dueDate: invoice.dueDate ? format(invoice.dueDate, 'dd MMMM yyyy', { locale: localeId }) : '-',
        status: invoice.status,
        billedToName: invoice.student.name,
        billedToDetails: ['Siswa'],
        companyName: tenant?.name || 'Sekolah',
        bankName,
        bankNumber,
        bankAccountName,
        notes: 'Terima kasih atas pembayaran Anda.'
      })
    } else {
      // Type tenant (Platform Subscription)
      const payment = await db.payment.findUnique({
        where: { id },
        include: { tenant: true }
      })
      if (!payment) return new NextResponse('Invoice not found', { status: 404 })

      const cfg = await getBillingSettings()
      
      const meta = payment.metadata as any
      const invType = meta?.type === "ADDON_QUOTA" ? "Penambahan Kuota"
                : meta?.type === "AI_QUOTA" ? "Top-Up Token AI"
                : `Upgrade ${payment.plan?.toUpperCase() || "PAKET"}`

      pdfBuffer = await generateInvoicePdf({
        invoiceNumber: payment.reference,
        title: invType,
        amount: payment.amount,
        date: format(payment.createdAt, 'dd MMMM yyyy', { locale: localeId }),
        dueDate: payment.expiredAt ? format(payment.expiredAt, 'dd MMMM yyyy', { locale: localeId }) : '-',
        status: payment.status,
        billedToName: payment.tenant.name,
        companyName: cfg.platformName,
        bankName: cfg.bankName,
        bankNumber: cfg.bankNumber,
        bankAccountName: cfg.bankAccountName,
        notes: 'Terima kasih telah menggunakan layanan kami.'
      })
    }

    return new NextResponse(new Uint8Array(pdfBuffer) as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${id}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[PDF Gen Error]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
