"use client"

import { useEffect, useState, useRef } from"react"
import { useSession } from"next-auth/react"
import { useRouter } from"next/navigation"
import { toast } from"@/hooks/use-toast"
import { useTenantBranding } from"@/components/providers/tenant-branding-provider"

import { ProfileSettings } from"./_components/profile-settings"
import { IntegrationSettings } from"./_components/integration-settings"
import { NotificationSettings } from"./_components/notification-settings"
import { DangerZoneSettings } from "./_components/danger-zone-settings"

export default function SettingsGeneralPage() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const { updateBranding } = useTenantBranding()

  const [tenantId, setTenantId] = useState<string | null>(null)

  // Role check — card Lembaga hanya untuk owner/admin
  const currentTenantSlug = session?.user?.tenants?.[0]?.slug
  const currentTenant = session?.user?.tenants?.find((t: any) => t.slug === currentTenantSlug) || session?.user?.tenants?.[0]
  const currentRole = currentTenant?.role ||"orangtua"
  
  const isImpersonatingUser = typeof document !=="undefined" && document.cookie.includes("impersonate-user=")
  const isImpersonatingTenant = typeof document !=="undefined" && document.cookie.includes("impersonate-tenant=")
  const isAdminRole = !isImpersonatingUser && (currentRole ==="owner" || currentRole ==="admin" || !!(session?.user?.isSuperAdmin && isImpersonatingTenant))

  useEffect(() => {
    if (!isAdminRole && status !=="loading") {
      router.replace("/ortu/profil")
    }
  }, [isAdminRole, status, router])

  // Profile
  const [profileForm, setProfileForm] = useState({ name:"", phone:"", email:"" })
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Password
  const [passwordForm, setPasswordForm] = useState({ current:"", newPass:"", confirm:"" })
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPw, setShowPw] = useState({ current: false, newPass: false, confirm: false })

  // Integrations
  const [orgForm, setOrgForm] = useState({ googleClientId:"", googleClientSecret:"" })
  const [rawSettings, setRawSettings] = useState<any>({})
  const [savingOrg, setSavingOrg] = useState(false)

  // Notif
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({ inapp: true, email: true, whatsapp: false })

  // Resolve tenantId
  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    if (id) { setTenantId(id); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const slug = match?.[1]
    if (slug) {
      fetch(`/api/tenant/by-slug?slug=${slug}`).then(r => r.json()).then(d => { if (d.id) setTenantId(d.id) })
    }
  }, [session?.user?.tenants])

  useEffect(() => {
    if (!session?.user) return
    setProfileForm({ name: session.user.name ||"", phone: (session.user as any).phone ||"", email: session.user.email ||"" })
    setAvatarPreview(session.user.image ||"")
    setAvatarUrl(session.user.image ||"")
  }, [session?.user])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/website?tenantId=${tenantId}`).then(r => r.json()).then(d => {
      const s = d.settings || {}
      setOrgForm({ 
        googleClientId: d.googleClientId ||"",
        googleClientSecret: d.googleClientSecret ||""
      })
      setRawSettings(s)
    })
  }, [tenantId])

  useEffect(() => {
    fetch("/api/tenant/notifications/preferences").then(r => r.json()).then(d => {
      if (d.data?.length) {
        const map: Record<string, boolean> = {}
        d.data.forEach((p: any) => { map[p.channel] = p.enabled })
        setNotifPrefs(prev => ({ ...prev, ...map }))
      }
    })
  }, [])

  if (!isAdminRole && status !=="loading") {
    return null
  }

  const handleSaveProfile = async () => {
    if (!session?.user?.id) return
    setSavingProfile(true)
    const res = await fetch("/api/user/profile", {
      method:"PUT", headers: {"Content-Type":"application/json" },
      body: JSON.stringify({ name: profileForm.name, phone: profileForm.phone, email: profileForm.email, avatar: avatarUrl || null }),
    })
    setSavingProfile(false)
    if (res.ok) {
      await updateSession({ forceRefresh: true })
      toast({ title:"Profil disimpan" })
    } else {
      const d = await res.json().catch(() => ({}))
      toast({ title:"Gagal", description: d.error, variant:"destructive" })
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("subDir","avatars")
      if (tenantId) fd.append("tenantId", tenantId)
      const res = await fetch("/api/upload", { method:"POST", body: fd })
      const d = await res.json()
      if (res.ok && d.url) { setAvatarPreview(d.url); setAvatarUrl(d.url); toast({ title:"Foto diunggah", description:"Klik Simpan Profil untuk menyimpan." }) }
      else toast({ title:"Gagal upload", description: d.error, variant:"destructive" })
    } catch { toast({ title:"Gagal upload", variant:"destructive" }) }
    finally { setUploadingAvatar(false); e.target.value ="" }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      toast({ title:"Lengkapi semua field password", variant:"destructive" }); return;
    }
    if (passwordForm.newPass.length < 8) { toast({ title:"Password minimal 8 karakter", variant:"destructive" }); return; }
    if (passwordForm.newPass !== passwordForm.confirm) { toast({ title:"Password tidak cocok", variant:"destructive" }); return; }
    setSavingPassword(true)
    const res = await fetch("/api/user/change-password", {
      method:"POST", headers: {"Content-Type":"application/json" },
      body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.newPass }),
    })
    const d = await res.json()
    setSavingPassword(false)
    if (res.ok) { setPasswordForm({ current:"", newPass:"", confirm:"" }); toast({ title:"Password diubah" }) }
    else toast({ title:"Gagal", description: d.error, variant:"destructive" })
  }

  const handleSaveOrg = async () => {
    if (!tenantId) return
    setSavingOrg(true)
    const res = await fetch("/api/tenant/website", {
      method:"PUT", headers: {"Content-Type":"application/json" },
      body: JSON.stringify({ 
        tenantId, 
        googleClientId: orgForm.googleClientId || null,
        googleClientSecret: orgForm.googleClientSecret || null,
        settings: rawSettings
      }),
    })
    setSavingOrg(false)
    if (res.ok) {
      await updateSession({ forceRefresh: true })
      router.refresh()
      toast({ title:"Lembaga disimpan" })
    } else {
      const d = await res.json().catch(() => ({}))
      toast({ title:"Gagal", description: d.error, variant:"destructive" })
    }
  }

  const toggleNotif = async (channel: string) => {
    const newVal = !notifPrefs[channel]
    setNotifPrefs(prev => ({ ...prev, [channel]: newVal }))
    await fetch("/api/tenant/notifications/preferences", {
      method:"PUT", headers: {"Content-Type":"application/json" },
      body: JSON.stringify({ channel, enabled: newVal }),
    })
    toast({ title: newVal ?"Diaktifkan" :"Dinonaktifkan", description: `Notifikasi ${channel} telah diubah.` })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Umum</h1>
        <p className="text-muted-foreground mt-1">Kelola profil, lembaga, dan preferensi notifikasi.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileSettings
          session={session}
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          savingProfile={savingProfile}
          avatarPreview={avatarPreview}
          setAvatarPreview={setAvatarPreview}
          setAvatarUrl={setAvatarUrl}
          uploadingAvatar={uploadingAvatar}
          avatarInputRef={avatarInputRef}
          handleAvatarUpload={handleAvatarUpload}
          handleSaveProfile={handleSaveProfile}
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          savingPassword={savingPassword}
          showPw={showPw}
          setShowPw={setShowPw}
          handleChangePassword={handleChangePassword}
        />

        {isAdminRole && (
          <>
            <IntegrationSettings
              session={session}
              orgForm={orgForm}
              setOrgForm={setOrgForm}
              rawSettings={rawSettings}
              setRawSettings={setRawSettings}
              savingOrg={savingOrg}
              tenantId={tenantId}
              handleSaveOrg={handleSaveOrg}
            />
          </>
        )}

        <NotificationSettings
          isAdminRole={isAdminRole}
          notifPrefs={notifPrefs}
          toggleNotif={toggleNotif}
        />

        {/* Zona Bahaya */}
        {isAdminRole && (
          <DangerZoneSettings tenantId={tenantId} />
        )}
      </div>
    </div>
  )
}
