"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Calendar, CheckCircle2, Clock, FileText, Search, UserX, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export default function AdminJournalsPage() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenants?.[0]?.id

  const [date, setDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!tenantId) return
    fetchData()
  }, [tenantId, date])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/journals?tenantId=${tenantId}&date=${date}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredJournals = data?.journals?.filter((j: any) => 
    j.staff?.name.toLowerCase().includes(search.toLowerCase()) || 
    j.subject?.name.toLowerCase().includes(search.toLowerCase()) ||
    j.classroom?.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  const filteredUnsubmitted = data?.unsubmittedStaff?.filter((s: any) => 
    s.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Jurnal Guru
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pantau aktivitas mengajar dan pengisian jurnal guru per hari.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-card p-1 rounded-full border shadow-sm">
          <div className="flex items-center pl-3 text-muted-foreground">
            <Calendar className="h-4 w-4" />
          </div>
          <Input 
            type="date" 
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border-0 bg-transparent w-40 h-9 focus-visible:ring-0 shadow-none"
          />
        </div>
      </div>

      {!loading && data && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass border-0 border-l-4 border-l-primary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Guru Aktif</p>
                  <p className="text-3xl font-bold mt-2">{data.stats.totalStaff}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0 border-l-4 border-l-emerald-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sudah Mengisi (Orang)</p>
                  <p className="text-3xl font-bold mt-2">{data.stats.submittedCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0 border-l-4 border-l-rose-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Belum Mengisi (Orang)</p>
                  <p className="text-3xl font-bold mt-2">{data.stats.unsubmittedCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <UserX className="h-6 w-6 text-rose-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="glass border-0 overflow-hidden">
        <Tabs defaultValue="rekap" className="w-full">
          <div className="border-b px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="rekap" 
                className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-full px-6 py-2"
              >
                Rekap Jurnal ({data?.journals?.length || 0})
              </TabsTrigger>
              <TabsTrigger 
                value="belum" 
                className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-600 data-[state=active]:shadow-sm rounded-full px-6 py-2"
              >
                Belum Mengisi ({data?.stats?.unsubmittedCount || 0})
              </TabsTrigger>
            </TabsList>

            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari guru, kelas, atau mapel..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-card border-muted/50 rounded-full h-9"
              />
            </div>
          </div>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-3" />
                <p>Memuat data...</p>
              </div>
            ) : (
              <>
                <TabsContent value="rekap" className="m-0 border-none outline-none">
                  {filteredJournals.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Tidak ada entri jurnal yang ditemukan.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {filteredJournals.map((j: any) => (
                        <div key={j.id} className="p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="md:w-1/4 flex items-center gap-3">
                              <Avatar className="h-10 w-10 border shadow-sm">
                                <AvatarImage src={j.staff?.imageUrl || ""} />
                                <AvatarFallback>{j.staff?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm">{j.staff?.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {j.classroom?.name} • {j.subject?.name}
                                </p>
                              </div>
                            </div>
                            <div className="md:w-2/4">
                              <p className="text-sm font-medium line-clamp-1">{j.topic}</p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {j.notes || "Tidak ada catatan."}
                              </p>
                            </div>
                            <div className="md:w-1/4 flex flex-col items-start md:items-end justify-center">
                              <div className="text-xs bg-muted px-2 py-1 rounded-md mb-2">
                                {j.presences?.length || 0} Siswa Diabsen
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                Disubmit: {format(new Date(j.createdAt), "HH:mm")}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="belum" className="m-0 border-none outline-none">
                  {filteredUnsubmitted.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500/50" />
                      <p>Hebat! Semua guru aktif telah mengisi jurnal hari ini.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {filteredUnsubmitted.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card/50 hover:bg-card hover:shadow-sm transition-all">
                          <Avatar className="h-10 w-10 border border-rose-100">
                            <AvatarImage src={s.imageUrl || ""} />
                            <AvatarFallback className="bg-rose-50 text-rose-600">{s.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{s.nip || "Tanpa NIP"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
