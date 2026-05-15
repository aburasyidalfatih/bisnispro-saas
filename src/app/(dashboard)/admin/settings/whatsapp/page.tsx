import { Metadata } from "next"
import { StarSenderManager } from "./_components/starsender-manager"

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
          Hubungkan nomor WhatsApp sekolah Anda untuk mengaktifkan notifikasi sistem dan fitur pesan broadcast massal secara otomatis menggunakan StarSender API atau Meta API.
        </p>
      </div>

      <StarSenderManager />
    </div>
  )
}
