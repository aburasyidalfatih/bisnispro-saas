import { Metadata } from "next"
import { WhatsappManager } from "./_components/whatsapp-manager"
import { StarSenderManager } from "./_components/starsender-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
        <strong>Penting:</strong> Gunakan nomor WhatsApp khusus sekolah. Jika menggunakan StarSender, lepaskan koneksi QR Code Internal Gateway agar tidak terjadi konflik. Sistem akan memprioritaskan Internal Gateway jika statusnya CONNECTED.
      </div>

      <Tabs defaultValue="internal" className="w-full">
        <TabsList className="bg-muted/50 rounded-xl p-1 border mb-6">
          <TabsTrigger value="internal" className="rounded-lg px-6">Internal Gateway</TabsTrigger>
          <TabsTrigger value="starsender" className="rounded-lg px-6">StarSender API</TabsTrigger>
        </TabsList>

        <TabsContent value="internal" className="mt-0 outline-none">
          <WhatsappManager />
        </TabsContent>

        <TabsContent value="starsender" className="mt-0 outline-none">
          <StarSenderManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
