import { Metadata } from "next"
import { WhatsappManager } from "./_components/whatsapp-manager"

export const metadata: Metadata = {
  title: "WhatsApp Gateway | SchoolPro",
  description: "Kelola koneksi gateway WhatsApp untuk sekolah Anda",
}

export default function WhatsappSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp Gateway</h1>
        <p className="text-muted-foreground">
          Hubungkan nomor WhatsApp sekolah Anda untuk mengaktifkan notifikasi sistem dan fitur pesan broadcast massal secara otomatis.
        </p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-2xl p-4 text-sm">
        <strong>Penting:</strong> Gunakan nomor WhatsApp khusus sekolah. Memutuskan koneksi akan menghentikan seluruh notifikasi otomatis yang berjalan dari sistem.
      </div>

      <WhatsappManager />
    </div>
  )
}
