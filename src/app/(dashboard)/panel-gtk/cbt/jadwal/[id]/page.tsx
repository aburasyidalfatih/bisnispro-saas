"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Download, Users, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function HasilUjianPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/cbt/jadwal/${params.id}/hasil`)
        const result = await res.json()
        if (!res.ok) throw new Error(result.error)
        setData(result)
      } catch (err: any) {
        toast({ title: "Gagal memuat hasil", description: err.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [params.id])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hasil Ujian: {data.exam.title}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Status: <span className="font-bold text-slate-700">{data.exam.status}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass border-2 border-blue-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase">Total Peserta</p>
              <h3 className="text-3xl font-black">{data.results.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Nilai Siswa</CardTitle>
          <Button variant="outline" className="rounded-xl"><Download className="w-4 h-4 mr-2"/> Export Excel</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl">Nama Siswa</th>
                  <th className="px-4 py-3">NISN</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Benar</th>
                  <th className="px-4 py-3">Peringatan (Cheat)</th>
                  <th className="px-4 py-3 text-right rounded-tr-xl">Nilai Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.results.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Belum ada siswa yang mengikuti ujian ini.</td>
                  </tr>
                ) : data.results.map((r: any) => (
                  <tr key={r.sessionId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-800">{r.studentName}</td>
                    <td className="px-4 py-4 text-slate-600">{r.nisn}</td>
                    <td className="px-4 py-4">
                      {r.status === "FINISHED" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengerjakan
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-600 font-medium">
                      {r.correctCount} / {r.totalQuestions}
                    </td>
                    <td className="px-4 py-4">
                      {r.cheatCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md">
                          <AlertTriangle className="w-4 h-4" /> {r.cheatCount}x Pindah Tab
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`text-xl font-black ${r.score < 75 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {r.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
