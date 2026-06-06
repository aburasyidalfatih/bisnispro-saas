"use client"

import { useEffect, useState, useRef } from"react"
import { useSession } from"next-auth/react"
import QRCode from"react-qr-code"
import { Button } from"@/components/ui/button"
import { Printer, ArrowLeft, Globe, ScanFace } from"lucide-react"
import Link from"next/link"
import { getRootDomain, normalizeImageUrl } from"@/lib/utils"

export default function WebsitePosterPage() {
  const { data: session } = useSession()
  const [tenant, setTenant] = useState<any>(null)
  const [websiteUrl, setWebsiteUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    const slug = session?.user?.tenants?.[0]?.slug
    
    if (id) {
      fetch(`/api/tenant/website?tenantId=${id}`)
        .then(r => r.json())
        .then(async data => {
          setTenant({ ...data, slug })
          
          // Get proper URL
          try {
            const domainRes = await fetch(`/api/tenant/domain?tenantId=${id}`)
            const domainData = await domainRes.json()
            const rootDomain = getRootDomain()
            let protocol = window.location.protocol
            
            if (domainData?.customDomain?.status ==="verified" && domainData.domain) {
              setWebsiteUrl(`https://${domainData.domain}`)
            } else if (slug) {
              setWebsiteUrl(`${protocol}//${slug}.${rootDomain}`)
            }
          } catch (e) {
            setWebsiteUrl(`${window.location.protocol}//${slug}.${getRootDomain()}`)
          }
          setLoading(false)
        })
    }
  }, [session])

  if (loading) return <div className="p-8 text-center animate-pulse">Memuat Poster...</div>

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Action Bar (Not Printed) */}
      <div className="flex items-center justify-between mb-8 print:hidden bg-card p-4 rounded-2xl border shadow-sm">
        <Link href="/admin/website">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()} className="gap-2 btn-gradient flex items-center justify-center h-10 px-4">
            <Printer className="h-4 w-4" /> Cetak / Simpan PDF
          </Button>
        </div>
      </div>

      {/* Printable Poster Area */}
      <div className="poster-print-area bg-white text-slate-900 w-full aspect-[1/1.414] (A4 ratio) p-12 shadow-2xl rounded-sm print:shadow-none print:p-0 mx-auto max-w-[800px] border relative overflow-hidden flex flex-col justify-between max-w-full">
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-b-[100px] opacity-10" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        {/* Top Header */}
        <div className="text-center space-y-6 relative z-10 pt-8">
          {tenant?.logo ? (
            <img src={normalizeImageUrl(tenant.logo)} alt="Logo" className="h-32 w-auto mx-auto object-contain drop-shadow-md" loading="lazy" decoding="async" />
          ) : (
            <div className="h-32 w-32 bg-slate-100 rounded-full mx-auto flex items-center justify-center">
              <Globe className="h-12 w-12 text-slate-400" />
            </div>
          )}
          <div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 uppercase">
              {tenant?.name ||"Nama Lembaga"}
            </h1>
            <p className="text-xl text-slate-600 mt-3 font-medium">
              {tenant?.tagline ||"Portal Informasi Resmi"}
            </p>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center flex-grow py-12">
          <div className="bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200 mb-8 relative">
            <ScanFace className="absolute -top-4 -left-4 h-8 w-8 text-indigo-500 bg-white" />
            <div className="bg-white p-4 rounded-xl shadow-lg border">
              {websiteUrl ? (
                <QRCode value={websiteUrl} size={280} level="H" fgColor="#0f172a" />
              ) : (
                <div className="w-[280px] h-[280px] bg-slate-100 animate-pulse rounded-xl max-w-full" />
              )}
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-slate-800 mb-2">SCAN UNTUK KUNJUNGI WEBSITE</h2>
          <p className="text-lg text-slate-500 max-w-md text-center">
            Arahkan kamera smartphone Anda ke QR Code di atas untuk melihat profil, berita, dan informasi terbaru dari kami.
          </p>
          
          <div className="mt-8 bg-indigo-50 px-8 py-4 rounded-2xl border border-indigo-100">
            <p className="text-2xl font-mono font-bold text-indigo-700 tracking-wider">
              {websiteUrl.replace(/^https?:\/\//, '')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8 border-t pt-8">
          <p className="text-slate-500 font-medium">
            {tenant?.address ||"Alamat belum diatur"}
          </p>
          <div className="flex items-center justify-center gap-6 mt-3 text-sm text-slate-400">
            {tenant?.phone && <span>📞 {tenant.phone}</span>}
            {tenant?.email && <span>✉️ {tenant.email}</span>}
          </div>
          <p className="text-[10px] text-slate-300 mt-8">Powered by SchoolPro SaaS</p>
        </div>
        
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .poster-print-area, .poster-print-area * { visibility: visible; }
          .poster-print-area { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; }
        }
      `}} />
    </div>
  )
}
