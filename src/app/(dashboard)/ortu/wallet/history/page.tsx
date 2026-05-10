import { EmptyState } from "@/components/shared/empty-state"
import { Wallet } from "lucide-react"

export default function Page() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Riwayat Transaksi</h1>
        <p className="text-slate-500">Rekam jejak seluruh aktivitas dompet digital.</p>
      </div>
      
      <EmptyState 
        icon={Wallet} 
        title="Belum Ada Transaksi" 
        description="Dompet digital anak Anda belum memiliki riwayat aktivitas. Transaksi akan muncul di sini setelah anak Anda jajan di kantin atau Anda melakukan Top Up." 
      />
    </div>
  )
}
