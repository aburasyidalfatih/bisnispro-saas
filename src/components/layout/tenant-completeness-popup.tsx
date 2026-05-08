"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { AlertTriangle, ArrowRight } from "lucide-react"

export function TenantCompletenessPopup() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [missing, setMissing] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Only run this logic if they are an owner/admin and in the dashboard
  const currentTenantSlug = session?.user?.tenants?.[0]?.slug
  const currentTenant = session?.user?.tenants?.find((t: any) => t.slug === currentTenantSlug) || session?.user?.tenants?.[0]
  const currentRole = currentTenant?.role || "member"
  const isImpersonatingUser = typeof document !== "undefined" && document.cookie.includes("impersonate-user=")
  const isAdminRole = !isImpersonatingUser && (currentRole === "owner" || currentRole === "admin")

  useEffect(() => {
    if (status !== "authenticated" || !isAdminRole || !currentTenant?.id) {
      setLoading(false)
      return
    }

    // Skip if they are already on the about page
    if (pathname === "/admin/website/about") {
      setLoading(false)
      return
    }

    // Check if we already reminded them this session
    if (sessionStorage.getItem("completeness-reminder-shown")) {
      setLoading(false)
      return
    }

    fetch(`/api/tenant/website?tenantId=${currentTenant.id}`)
      .then(res => res.json())
      .then(data => {
        const missingFields: string[] = []
        if (!data.name?.trim()) missingFields.push("Nama Lembaga")
        if (!data.logo?.trim()) missingFields.push("Logo Lembaga")
        if (!data.tagline?.trim()) missingFields.push("Tagline / Slogan")
        if (!data.description?.trim()) missingFields.push("Deskripsi Singkat")
        if (!data.settings?.schoolStatus?.trim()) missingFields.push("Status Sekolah")
        if (!data.settings?.studentCount || data.settings.studentCount < 1) missingFields.push("Jumlah Siswa")
        if (!data.settings?.province?.trim()) missingFields.push("Provinsi")
        if (!data.settings?.regency?.trim()) missingFields.push("Kabupaten/Kota")
        if (!data.address?.trim()) missingFields.push("Alamat Lengkap")
        if (!data.phone?.trim()) missingFields.push("Nomor Telepon")
        if (!data.email?.trim()) missingFields.push("Email Lembaga")

        if (missingFields.length > 0) {
          setMissing(missingFields)
          setOpen(true)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [status, isAdminRole, currentTenant?.id, pathname])

  if (loading || !open) return null

  const handleClose = () => {
    setOpen(false)
    sessionStorage.setItem("completeness-reminder-shown", "true")
  }

  const handleAction = () => {
    setOpen(false)
    sessionStorage.setItem("completeness-reminder-shown", "true")
    router.push("/admin/website/about")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle>Lengkapi Data Lembaga</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Website lembaga Anda sudah aktif, namun masih ada data profil yang belum lengkap. 
            Mohon lengkapi agar layanan dapat berjalan maksimal.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted/50 rounded-lg p-3 text-sm my-2 max-h-[150px] overflow-y-auto">
          <p className="font-medium text-xs text-muted-foreground mb-2">Data yang belum diisi:</p>
          <ul className="list-disc pl-4 space-y-1">
            {missing.map((field, idx) => (
              <li key={idx} className="text-foreground">{field}</li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          <Button variant="outline" onClick={handleClose} className="sm:w-full">
            Nanti Saja
          </Button>
          <Button onClick={handleAction} className="sm:w-full gap-2">
            Lengkapi Sekarang <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
