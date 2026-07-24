"use client"

import { useEffect, useState, useCallback } from"react"
import { useSession } from"next-auth/react"
import { toast } from"@/hooks/use-toast"
import { getRootDomain } from"@/lib/utils"

import { DomainData } from"./_components/types"
import { ActiveUrlCard } from"./_components/active-url-card"
import { ConfigDomainCard } from"./_components/config-domain-card"
import { DnsGuideCard } from"./_components/dns-guide-card"
import { RemoveDomainCard } from"./_components/remove-domain-card"

export default function DomainSettingsPage() {
  const { data: session } = useSession()

  const [tenantId, setTenantId] = useState<string | null>(null)
  const [data, setData] = useState<DomainData | null>(null)
  const [loading, setLoading] = useState(true)

  const [domainInput, setDomainInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [rootDomain, setRootDomain] = useState("")
  
  // Subdomain state
  const [subdomainInput, setSubdomainInput] = useState("")
  const [savingSubdomain, setSavingSubdomain] = useState(false)

  useEffect(() => {
    if (typeof window !=="undefined") {
      setRootDomain(getRootDomain())
    }
    const id = session?.user?.tenants?.[0]?.id
    if (id) { setTenantId(id); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const slug = match?.[1]
    if (slug) {
      fetch(`/api/tenant/by-slug?slug=${slug}`)
        .then((r) => r.json())
        .then((d) => { if (d.id) setTenantId(d.id) })
    }
  }, [session?.user?.tenants])

  const loadData = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tenant/domain?tenantId=${tenantId}`, {
        cache:"no-store",
      })
      const json = await res.json()
      setData(json)
      if (json.domain) setDomainInput(json.domain)
      if (json.slug) setSubdomainInput(json.slug)
    } catch {
      toast({ title:"Gagal memuat data", variant:"destructive" })
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { loadData() }, [loadData])

  const handleSaveSubdomain = async () => {
    if (!tenantId || !subdomainInput.trim()) return
    setSavingSubdomain(true)
    try {
      const res = await fetch("/api/tenant/subdomain", {
        method:"PUT",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ tenantId, newSlug: subdomainInput.trim().toLowerCase() }),
      })
      const json = await res.json()
      if (res.ok) {
        toast({ title:"Subdomain berhasil diubah!", description:"Sistem telah menyimpan subdomain baru Anda." })
        await loadData()
        window.location.href = `/admin/settings/domain`
      } else {
        toast({ title:"Gagal mengganti subdomain", description: json.error, variant:"destructive" })
      }
    } finally {
      setSavingSubdomain(false)
    }
  }

  const handleSave = async () => {
    if (!tenantId || !domainInput.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/tenant/domain", {
        method:"PUT",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ tenantId, domain: domainInput.trim() }),
      })
      const json = await res.json()
      if (res.ok) {
        toast({ title:"Domain disimpan", description: json.message })
        await loadData()
      } else {
        toast({ title:"Gagal", description: json.error, variant:"destructive" })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async () => {
    if (!tenantId) return
    setVerifying(true)
    try {
      const res = await fetch("/api/tenant/domain/verify", {
        method:"POST",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ tenantId }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast({ title:"✅ Domain terverifikasi!", description: json.message })
      } else {
        toast({
          title: json.success === false ?"Verifikasi gagal" :"Gagal",
          description: json.message || json.error,
          variant:"destructive",
        })
      }
      await loadData()
    } finally {
      setVerifying(false)
    }
  }

  const handleRemove = async () => {
    if (!tenantId) return
    setRemoving(true)
    try {
      const res = await fetch("/api/tenant/domain", {
        method:"DELETE",
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify({ tenantId }),
      })
      const json = await res.json()
      if (res.ok) {
        toast({ title:"Domain dihapus", description: json.message })
        setDomainInput("")
        await loadData()
      } else {
        toast({ title:"Gagal", description: json.error, variant:"destructive" })
      }
    } finally {
      setRemoving(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ title:"Disalin", description: `${label} disalin ke clipboard.` })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    )
  }

  const customDomain = data?.customDomain
  const isVerified = customDomain?.status ==="verified"
  const hasCustomDomain = !!data?.domain
  const subdomain = data?.slug && rootDomain
    ? `${data.slug}.${rootDomain}`
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Custom Domain</h1>
        <p className="text-muted-foreground mt-1">
          Hubungkan domain Anda sendiri ke website bisnis ini.
        </p>
      </div>

      <ActiveUrlCard
        data={data}
        subdomain={subdomain}
        subdomainInput={subdomainInput}
        setSubdomainInput={setSubdomainInput}
        rootDomain={rootDomain}
        savingSubdomain={savingSubdomain}
        handleSaveSubdomain={handleSaveSubdomain}
        hasCustomDomain={hasCustomDomain}
        isVerified={isVerified}
      />

      <ConfigDomainCard
        data={data}
        domainInput={domainInput}
        setDomainInput={setDomainInput}
        saving={saving}
        handleSave={handleSave}
      />

      <DnsGuideCard
        data={data}
        hasCustomDomain={hasCustomDomain}
        isVerified={isVerified}
        rootDomain={rootDomain}
        verifying={verifying}
        handleVerify={handleVerify}
        copyToClipboard={copyToClipboard}
      />

      <RemoveDomainCard
        data={data}
        hasCustomDomain={hasCustomDomain}
        removing={removing}
        handleRemove={handleRemove}
      />
    </div>
  )
}
