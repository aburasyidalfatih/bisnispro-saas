"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Mail, Bell, CheckCircle2, XCircle, MessageSquare, Loader2 } from "lucide-react"
import { ServerPagination } from "@/components/shared/server-pagination"

// --- Subcomponents for each tab ---

function DripTable() {
  const [data, setData] = useState<any[]>([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const fetchData = async (page: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/super-admin/notifications/drip?page=${page}&limit=20`)
      const json = await res.json()
      setData(json.data || [])
      setMeta(json.meta || { page, totalPages: 1, total: 0 })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(1) }, [])

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle>Email Edukasi (Drip Campaign)</CardTitle>
        <CardDescription>Menampilkan riwayat pengiriman email edukasi ({meta.total} total data).</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">Belum ada riwayat email edukasi terkirim.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border bg-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 py-3 font-medium">Tanggal Kirim</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Bisnis</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Campaign</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Status Baca</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Status Klik</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map(log => (
                      <TableRow key={log.id} className="hover:bg-muted/30">
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          {format(new Date(log.sentAt), "dd MMM yyyy, HH:mm", { locale: id })}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="font-medium text-foreground">{log.tenant?.name || "Bisnis Dihapus"}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {log.campaign?.title || "Campaign Dihapus"}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {log.isOpened ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Dibaca
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <XCircle className="h-3 w-3" /> Belum Dibaca
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {log.isClicked ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Diklik
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Pagination Controls */}
            <div className="mt-4">
              <ServerPagination 
                page={meta.page} 
                totalPages={meta.totalPages} 
                total={meta.total} 
                onPageChange={fetchData} 
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SystemTable() {
  const [data, setData] = useState<any[]>([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const fetchData = async (page: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/super-admin/notifications/system?page=${page}&limit=20`)
      const json = await res.json()
      setData(json.data || [])
      setMeta(json.meta || { page, totalPages: 1, total: 0 })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(1) }, [])

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle>Notifikasi Sistem</CardTitle>
        <CardDescription>Menampilkan riwayat notifikasi sistem (In-app, WA, Email) ({meta.total} total data).</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">Belum ada riwayat notifikasi.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border bg-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 py-3 font-medium">Waktu</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Penerima</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Judul & Pesan</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Channel</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Status (In-App)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map(notif => (
                      <TableRow key={notif.id} className="hover:bg-muted/30">
                        <TableCell className="px-4 py-3 whitespace-nowrap align-top">
                          {format(new Date(notif.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          <div className="font-medium text-foreground">{notif.user?.name || "Pengguna Dihapus"}</div>
                          <div className="text-xs text-muted-foreground">{notif.tenant?.name || "Platform"}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top max-w-[300px] max-w-full">
                          <div className="font-semibold mb-1">{notif.title}</div>
                          <div className="text-xs text-muted-foreground truncate" title={notif.message}>{notif.message}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          <Badge variant="outline" className={
                            notif.channel === 'email' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                            notif.channel === 'whatsapp' ? "bg-green-500/10 text-green-600 border-green-500/20" :
                            "bg-zinc-500/10 text-zinc-600 border-zinc-500/20"
                          }>
                            {notif.channel.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          {notif.isRead ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Dibaca
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            {/* Pagination Controls */}
            <div className="mt-4">
              <ServerPagination 
                page={meta.page} 
                totalPages={meta.totalPages} 
                total={meta.total} 
                onPageChange={fetchData} 
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InternalTable() {
  const [data, setData] = useState<any[]>([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const fetchData = async (page: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/super-admin/notifications/internal?page=${page}&limit=20`)
      const json = await res.json()
      setData(json.data || [])
      setMeta(json.meta || { page, totalPages: 1, total: 0 })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(1) }, [])

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle>Pesan Internal</CardTitle>
        <CardDescription>Menampilkan riwayat pesan langsung antar pengguna ({meta.total} total data).</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">Belum ada riwayat pesan internal.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border bg-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 py-3 font-medium">Waktu</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Bisnis</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Pengirim & Penerima</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Subjek & Pesan</TableHead>
                      <TableHead className="px-4 py-3 font-medium">Status Baca</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map(msg => (
                      <TableRow key={msg.id} className="hover:bg-muted/30">
                        <TableCell className="px-4 py-3 whitespace-nowrap align-top">
                          {format(new Date(msg.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          <span className="font-medium text-foreground">{msg.tenant?.name || "Bisnis Dihapus"}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          <div className="text-xs text-muted-foreground mb-1">Dari: <strong className="text-foreground">{msg.sender?.name || "Dihapus"}</strong></div>
                          <div className="text-xs text-muted-foreground">Ke: <strong className="text-foreground">{msg.receiver ? msg.receiver.name : "Semua Admin (Broadcast)"}</strong></div>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top max-w-[300px] max-w-full">
                          {msg.subject && <div className="font-semibold mb-1 truncate" title={msg.subject}>{msg.subject}</div>}
                          <div className="text-xs text-muted-foreground truncate" title={msg.body}>{msg.body}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          {msg.isRead ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Dibaca
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <XCircle className="h-3 w-3" /> Belum
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            {/* Pagination Controls */}
            <div className="mt-4">
              <ServerPagination 
                page={meta.page} 
                totalPages={meta.totalPages} 
                total={meta.total} 
                onPageChange={fetchData} 
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// --- Main Page Component ---

export default function NotificationsHistoryPage() {
  // Authentication should be handled in a Layout or via middleware for Client Components in an admin area,
  // or we can just rely on the existing layout protection.
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Riwayat Notifikasi & Email</h2>
        <p className="text-muted-foreground">Log pengiriman Email Edukasi (Drip) dan Notifikasi Sistem ke seluruh bisnis.</p>
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
          <DripTable />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <SystemTable />
        </TabsContent>

        <TabsContent value="internal" className="space-y-4">
          <InternalTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
