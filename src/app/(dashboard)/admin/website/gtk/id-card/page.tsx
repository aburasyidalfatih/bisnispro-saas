"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import QRCode from "react-qr-code"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { getRootDomain, normalizeImageUrl } from "@/lib/utils"
import { getStaff } from "@/features/staff/actions/staff.action"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"

export default function IDCardPrintPage() {
  const { branding, isLoadingTenant } = useTenantBranding()
  const { data: session } = useSession()
  const [tenant, setTenant] = useState<any>(null)
  const [staff, setStaff] = useState<any[]>([])
  const [websiteUrl, setWebsiteUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const tenantId = branding.id

  useEffect(() => {
    if (!tenantId || isLoadingTenant) return

    const slug = session?.user?.tenants?.[0]?.slug
    
    Promise.all([
      fetch(`/api/tenant/website?tenantId=${tenantId}`).then(r => r.json()),
      getStaff(tenantId),
      fetch(`/api/tenant/domain?tenantId=${tenantId}`).then(r => r.json()).catch(() => ({}))
    ]).then(([websiteData, staffData, domainData]) => {
      setTenant({ ...websiteData, slug })
      setStaff(Array.isArray(staffData) ? staffData : [])
      
      const rootDomain = getRootDomain()
      let protocol = window.location.protocol
      
      if (domainData?.customDomain?.status === "verified" && domainData.domain) {
        setWebsiteUrl(`https://${domainData.domain}`)
      } else if (slug) {
        setWebsiteUrl(`${protocol}//${slug}.${rootDomain}`)
      }
      setLoading(false)
    })
  }, [tenantId, isLoadingTenant, session])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p>Menyiapkan ID Card Generator...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Action Bar (Not Printed) */}
      <div className="flex items-center justify-between mb-8 print:hidden bg-card p-4 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Cetak ID Card GTK</h1>
          <p className="text-sm text-muted-foreground">Otomatis ter-generate dari data master Guru & Staf Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/website/gtk">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Button>
          </Link>
          <Button onClick={() => window.print()} className="gap-2 btn-gradient">
            <Printer className="h-4 w-4" /> Cetak / Save PDF
          </Button>
        </div>
      </div>

      {staff.length === 0 && (
        <div className="p-8 text-center bg-amber-50 text-amber-600 rounded-xl border border-amber-200 print:hidden">
          Anda belum memiliki data GTK. Silakan tambahkan data guru terlebih dahulu untuk mencetak ID Card.
        </div>
      )}

      {/* Printable Area */}
      <div className="print-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
          {staff.map((person) => {
            const profileUrl = `${websiteUrl}/profil/gtk#${person.id}`
            
            return (
              <div key={person.id} className="id-card-wrapper bg-white border shadow-md print:shadow-none rounded-[20px] overflow-hidden w-[320px] h-[480px] mx-auto flex flex-col relative print:border-2 print:border-slate-300 print:break-inside-avoid">
                {/* ID Card Background/Header */}
                <div className="h-32 bg-gradient-to-br from-indigo-600 to-purple-700 relative flex flex-col items-center pt-4">
                  <div className="absolute inset-0 bg-black/10" />
                  {tenant?.logo && (
                    <img src={normalizeImageUrl(tenant.logo) || tenant.logo} alt="Logo" className="h-10 w-auto relative z-10 object-contain drop-shadow-md mb-2" />
                  )}
                  <p className="text-white relative z-10 font-bold text-sm tracking-wide text-center px-4 leading-tight uppercase">
                    {tenant?.name || "Nama Sekolah"}
                  </p>
                </div>

                {/* Profile Photo - Overlapping */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full border-4 border-white shadow-lg bg-slate-100 overflow-hidden z-20 flex items-center justify-center">
                  {person.imageUrl ? (
                    <img src={normalizeImageUrl(person.imageUrl) || person.imageUrl} alt={person.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 text-xs">Tanpa Foto</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-grow pt-20 px-6 pb-4 flex flex-col items-center justify-between text-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 leading-tight">{person.name}</h2>
                    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mt-1 bg-indigo-50 px-3 py-1 rounded-full inline-block">
                      {person.role}
                    </p>
                  </div>
                  
                  {/* QR Code */}
                  <div className="mt-4 flex flex-col items-center">
                    <div className="p-1.5 bg-white border shadow-sm rounded-lg">
                      <QRCode value={profileUrl} size={64} level="M" />
                    </div>
                    <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-widest">Scan for Profile</p>
                  </div>
                </div>

                {/* Footer Banner */}
                <div className="h-8 bg-slate-900 w-full flex items-center justify-center">
                  <p className="text-[10px] text-white/80 uppercase tracking-widest">Official Identification</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .max-w-6xl > div:last-child, .max-w-6xl > div:last-child * { visibility: visible; }
          .max-w-6xl > div:last-child { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; padding: 0; margin: 0; }
          .print-container { width: 100%; padding: 0; }
          .id-card-wrapper { margin-bottom: 20px; page-break-inside: avoid; }
        }
      `}} />
    </div>
  )
}
