import { auth } from"@/lib/auth"
import { db } from"@/lib/db"
import { redirect } from"next/navigation"
import { WalletManager } from"./_components/wallet-manager"

export default async function AdminWalletPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const tenantId = session.user.tenants?.[0]?.id
  if (!tenantId) redirect("/admin")

  // Fetch all wallets
  const wallets = await db.walletAccount.findMany({
    where: { tenantId },
    include: {
      student: {
        select: {
           id: true,
           name: true,
           nisn: true,
           parents: {
              include: { user: { select: { name: true, phone: true } } }
           }
        }
      }
    },
    orderBy: { balance:"desc" }
  })

  // Fetch all pending manual topups
  const pendingTopups = await db.payment.findMany({
    where: {
      tenantId,
      plan:"WALLET_TOPUP",
      status:"PENDING_VERIFICATION",
    },
    orderBy: { createdAt:"asc" }
  })

  // Fetch recent transactions
  const transactions = await db.walletTransaction.findMany({
    where: {
      wallet: { tenantId }
    },
    include: {
      wallet: {
        include: {
          student: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt:"desc" },
    take: 100
  })

  // Calculate stats
  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0)
  const activeWallets = wallets.length
  const pendingCount = pendingTopups.length

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kelola Tabungan (Dompet Digital)</h1>
        <p className="text-muted-foreground mt-1 text-sm">Pantau saldo siswa, riwayat transaksi, dan verifikasi top-up manual.</p>
      </div>

      <WalletManager 
        tenantId={tenantId}
        wallets={wallets} 
        pendingTopups={pendingTopups} 
        transactions={transactions} 
        stats={{ totalBalance, activeWallets, pendingCount }} 
      />
    </div>
  )
}
