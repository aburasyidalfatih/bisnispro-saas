import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { getPaymentChannels } from "@/features/finance/services/payment.service"
import { CheckoutForm } from "./_components/checkout-form"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function PaymentCheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const tenantId = session.user.tenants?.[0]?.id
  if (!tenantId) redirect("/ortu")

  // Fetch Invoice
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          walletAccount: true,
          parents: {
            where: { userId: session.user.id }
          }
        }
      }
    }
  })

  if (!invoice || invoice.student.parents.length === 0) {
    return (
      <div className="p-6 text-center mt-20">
        <p className="text-muted-foreground">Tagihan tidak ditemukan atau Anda tidak memiliki akses.</p>
        <Link href="/ortu/tagihan" className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-xl">Kembali</Link>
      </div>
    )
  }

  // Fetch Tripay channels
  let paymentChannels = []
  try {
    paymentChannels = await getPaymentChannels(tenantId)
  } catch (error) {
    console.error("Gagal memuat metode pembayaran:", error)
  }

  // Fetch Manual Banks from tenant settings
  const tenantData = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true }
  })
  const manualBanks = (tenantData?.settings as any)?.manualBanks || []

  const wallet = invoice.student.walletAccount

  return (
    <div className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="bg-primary pt-10 pb-6 px-6 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4 text-primary-foreground">
          <Link href="/ortu/tagihan" className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
             <h1 className="text-xl font-bold">Pembayaran</h1>
             <p className="text-xs opacity-80">No. {invoice.code}</p>
          </div>
        </div>
      </div>

      <CheckoutForm 
        invoice={invoice} 
        wallet={wallet} 
        paymentChannels={paymentChannels} 
        manualBanks={manualBanks}
        user={session.user} 
      />
    </div>
  )
}

