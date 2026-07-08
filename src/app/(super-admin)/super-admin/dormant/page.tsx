"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Moon, MessageCircle, ExternalLink, RefreshCw } from "lucide-react"

interface DormantTenant {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  createdAt: string
  isActive: boolean
}

export default function DormantSchoolsPage() {
  const [tenants, setTenants] = useState<DormantTenant[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTenants = () => {
    setLoading(true)
    fetch("/api/super-admin/dormant")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTenants(data)
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const handleFollowUp = (tenant: DormantTenant) => {
    let phoneStr = tenant.whatsapp || tenant.phone || ""
    if (!phoneStr) {
      alert("Tidak ada nomor kontak untuk sekolah ini.")
      return
    }
    
    // Format nomor telepon ke 62
    if (phoneStr.startsWith('0')) {
      phoneStr = '62' + phoneStr.substring(1)
    }

    const text = encodeURIComponent(`Halo Admin ${tenant.name},\n\nKami dari tim Support SchoolPro melihat bahwa website sekolah Anda (https://${tenant.slug}.schoolpro.id) sudah berhasil diaktifkan, namun sepertinya Anda belum pernah melakukan login untuk mengkonfigurasi sistem Anda.\n\nApakah ada kendala yang bisa kami bantu?`)
    window.open(`https://wa.me/${phoneStr}?text=${text}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sekolah Dormant (Belum Login)</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Daftar {tenants.length} sekolah yang sudah disetujui namun belum pernah login ke dasbor mereka.
          </p>
        </div>
        <Button onClick={fetchTenants} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-orange-500" />
            Daftar Sekolah Dormant
          </CardTitle>
          <CardDescription>
            Lakukan follow-up agar sekolah segera memanfaatkan fitur SchoolPro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-background/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Nama Sekolah</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Tanggal Disetujui</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Tidak ada sekolah dormant saat ini. Hebat!
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {t.name}
                        {!t.isActive && (
                          <Badge variant="destructive" className="ml-2 text-[10px]">Nonaktif</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`https://${t.slug}.schoolpro.id`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:underline"
                        >
                          {t.slug} <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{t.email}</div>
                        <div className="text-xs text-muted-foreground">{t.whatsapp || t.phone || '-'}</div>
                      </TableCell>
                      <TableCell>
                        {new Date(t.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                          onClick={() => handleFollowUp(t)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          Follow Up WA
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
