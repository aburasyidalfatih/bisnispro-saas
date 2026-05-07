"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, Users, FileText, MessageSquare, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function GuruDashboard() {
  const { data: session } = useSession()

  const userName = session?.user?.name || "Guru"

  const cards = [
    { label: "Jadwal Mengajar", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10", href: "#", value: "Lihat" },
    { label: "Kelas & Siswa", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "#", value: "Kelola" },
    { label: "Tulis Artikel", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10", href: "/gtk/posts", value: "Buat" },
    { label: "Pesan Internal", icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-500/10", href: "#", value: "Inbox" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Selamat Datang, {userName}!</h1>
        <p className="text-muted-foreground mt-1">Ini adalah dasbor khusus tenaga pendidik.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="glass border-0 hover-lift cursor-pointer h-full transition-all">
              <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold">{card.label}</h3>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-primary font-medium group">
                    {card.value} <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="text-lg">Informasi Terbaru</CardTitle>
            <CardDescription>Pengumuman dari pihak sekolah</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 text-muted-foreground text-sm border border-dashed rounded-xl">
              Belum ada pengumuman baru.
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="text-lg">Jadwal Hari Ini</CardTitle>
            <CardDescription>Aktivitas mengajar Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 text-muted-foreground text-sm border border-dashed rounded-xl">
              Tidak ada jadwal mengajar hari ini.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
