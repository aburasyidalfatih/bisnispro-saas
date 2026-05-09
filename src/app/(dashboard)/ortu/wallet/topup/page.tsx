import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { TopUpForm } from "./_components/topup-form"
import { getPaymentChannels } from "@/lib/services/payment"

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

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
         <h1 className="text-2xl font-bold tracking-tight text-foreground">Nabung Sekarang</h1>
         <p className="text-sm text-muted-foreground mt-1">Isi saldo dompet digital anak Anda secara instan.</p>
      </div>

      <TopUpForm childrenWithWallets={childrenWithWallets} paymentChannels={paymentChannels} user={session.user} tenant={tenant} />
    </div>
  )
}
