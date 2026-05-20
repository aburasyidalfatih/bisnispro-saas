import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { TopUpForm } from "./_components/topup-form"
import { getPaymentChannels } from "@/features/finance/services/payment.service"
import Link from "next/link"

export default async function TopUpPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const tenant = session.user.tenants?.[0]
  if (!tenant || tenant.plan === "free") {
    redirect("/ortu") // Block free users
  }

  // Fetch children wallets
  const parentData = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      studentParents: {
        include: {
          student: {
            include: {
              walletAccount: true
            }
          }
        }
      }
    }
  })

  const children = parentData?.studentParents?.map(sp => sp.student) || []
  const childrenWithWallets = children.filter(c => c.walletAccount)

  if (childrenWithWallets.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Belum ada akun dompet digital untuk anak Anda. Hubungi Admin Sekolah.</p>
       </div>
    )
  }

  // Fetch tripay channels
  let paymentChannels = []
  try {
    paymentChannels = await getPaymentChannels(tenant.id)
  } catch (error) {
    console.error("Gagal memuat metode pembayaran:", error)
  }

  const tenantData = await db.tenant.findUnique({
    where: { id: tenant.id },
    select: { settings: true }
  })
  
  const manualBanks = (tenantData?.settings as any)?.manualBanks || []

  return (
    <div className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto md:mt-8 md:rounded-3xl md:overflow-hidden md:border md:shadow-2xl md:shadow-indigo-500/10 bg-background">
      {/* Header Premium */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 pt-10 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <svg className="h-32 w-32 -mr-10 -mt-10" fill="currentColor" viewBox="0 0 24 24"><path d="M21 18v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></svg>
        </div>
        <div className="relative z-10">
          <Link href="/ortu/wallet" className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md transition-colors mb-6 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-2xl font-black text-white">Nabung Sekarang</h1>
          <p className="text-indigo-200 mt-1 text-sm">Isi saldo dompet digital anak Anda secara instan.</p>
        </div>
      </div>

      <div className="px-5 -mt-12 space-y-5 relative z-10">
         <TopUpForm childrenWithWallets={childrenWithWallets} paymentChannels={paymentChannels} manualBanks={manualBanks} user={session.user} tenant={tenant} />
      </div>
    </div>
  )
}
