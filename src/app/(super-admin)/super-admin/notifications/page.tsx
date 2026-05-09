import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Mail, Bell, CheckCircle2, XCircle, MessageSquare } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function NotificationsHistoryPage() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    redirect("/login")
  }

  // 1. Ambil 100 log DripCampaign (Email Edukasi) terakhir
  const dripLogs = await db.dripLog.findMany({
    take: 100,
    orderBy: { sentAt: 'desc' },
    include: {
      campaign: true,
      tenant: { select: { name: true, domain: true, slug: true } }
    }
  })

  // 2. Ambil 100 notifikasi sistem (semua channel: email, inapp, wa) terakhir
  const sysNotifications = await db.notification.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: { select: { name: true } },
      user: { select: { name: true, email: true } }
    }
  })

  // 3. Ambil 100 pesan internal terakhir
  const internalMessages = await db.internalMessage.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: { select: { name: true } },
      sender: { select: { name: true, role: true } },
      receiver: { select: { name: true, role: true } }
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Riwayat Notifikasi & Email</h2>
        <p className="text-muted-foreground">Log pengiriman Email Edukasi (Drip) dan Notifikasi Sistem ke seluruh Tenant.</p>
      </div>

      <Tabs defaultValue="drip" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="drip" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email Edukasi
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifikasi Sistem
          </TabsTrigger>
          <TabsTrigger value="internal" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Pesan Internal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drip" className="space-y-4">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle>Email Edukasi (Drip Campaign)</CardTitle>
              <CardDescription>Menampilkan 100 pengiriman email edukasi terbaru.</CardDescription>
            </CardHeader>
            <CardContent>
              {dripLogs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Belum ada riwayat email edukasi terkirim.</div>
              ) : (
                <div className="rounded-md border bg-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                        <tr>
                          <th className="px-4 py-3 font-medium">Tanggal Kirim</th>
                          <th className="px-4 py-3 font-medium">Tenant</th>
                          <th className="px-4 py-3 font-medium">Campaign</th>
                          <th className="px-4 py-3 font-medium">Status Baca</th>
                          <th className="px-4 py-3 font-medium">Status Klik</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {dripLogs.map(log => (
                          <tr key={log.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3 whitespace-nowrap">
                              {format(new Date(log.sentAt), "dd MMM yyyy, HH:mm", { locale: id })}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-foreground">{log.tenant?.name || "Tenant Dihapus"}</span>
                            </td>
                            <td className="px-4 py-3">
                              {log.campaign?.title || "Campaign Dihapus"}
                            </td>
                            <td className="px-4 py-3">
                              {log.isOpened ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Dibaca
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <XCircle className="h-3 w-3" /> Belum Dibaca
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {log.isClicked ? (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Diklik
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle>Notifikasi Sistem</CardTitle>
              <CardDescription>Menampilkan 100 notifikasi sistem terbaru (In-app, WA, Email).</CardDescription>
            </CardHeader>
            <CardContent>
              {sysNotifications.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Belum ada riwayat notifikasi.</div>
              ) : (
                <div className="rounded-md border bg-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                        <tr>
                          <th className="px-4 py-3 font-medium">Waktu</th>
                          <th className="px-4 py-3 font-medium">Penerima</th>
                          <th className="px-4 py-3 font-medium">Judul & Pesan</th>
                          <th className="px-4 py-3 font-medium">Channel</th>
                          <th className="px-4 py-3 font-medium">Status (In-App)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sysNotifications.map(notif => (
                          <tr key={notif.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3 whitespace-nowrap align-top">
                              {format(new Date(notif.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="font-medium text-foreground">{notif.user?.name || "Pengguna Dihapus"}</div>
                              <div className="text-xs text-muted-foreground">{notif.tenant?.name || "Platform"}</div>
                            </td>
                            <td className="px-4 py-3 align-top max-w-[300px]">
                              <div className="font-semibold mb-1">{notif.title}</div>
                              <div className="text-xs text-muted-foreground truncate" title={notif.message}>{notif.message}</div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <Badge variant="outline" className={
                                notif.channel === 'email' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                notif.channel === 'whatsapp' ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                "bg-zinc-500/10 text-zinc-600 border-zinc-500/20"
                              }>
                                {notif.channel.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 align-top">
                              {notif.isRead ? (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Dibaca
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="internal" className="space-y-4">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle>Pesan Internal</CardTitle>
              <CardDescription>Menampilkan 100 riwayat pesan langsung antar pengguna (Internal Messages).</CardDescription>
            </CardHeader>
            <CardContent>
              {internalMessages.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Belum ada riwayat pesan internal.</div>
              ) : (
                <div className="rounded-md border bg-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                        <tr>
                          <th className="px-4 py-3 font-medium">Waktu</th>
                          <th className="px-4 py-3 font-medium">Tenant</th>
                          <th className="px-4 py-3 font-medium">Pengirim & Penerima</th>
                          <th className="px-4 py-3 font-medium">Subjek & Pesan</th>
                          <th className="px-4 py-3 font-medium">Status Baca</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {internalMessages.map(msg => (
                          <tr key={msg.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3 whitespace-nowrap align-top">
                              {format(new Date(msg.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span className="font-medium text-foreground">{msg.tenant?.name || "Tenant Dihapus"}</span>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="text-xs text-muted-foreground mb-1">Dari: <strong className="text-foreground">{msg.sender?.name || "Dihapus"}</strong></div>
                              <div className="text-xs text-muted-foreground">Ke: <strong className="text-foreground">{msg.receiver ? msg.receiver.name : "Semua Admin (Broadcast)"}</strong></div>
                            </td>
                            <td className="px-4 py-3 align-top max-w-[300px]">
                              {msg.subject && <div className="font-semibold mb-1 truncate" title={msg.subject}>{msg.subject}</div>}
                              <div className="text-xs text-muted-foreground truncate" title={msg.body}>{msg.body}</div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              {msg.isRead ? (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Dibaca
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <XCircle className="h-3 w-3" /> Belum
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
