"use client"

import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Import Components
import { GeneralTab } from "./_components/general-tab"
import { EmailTab } from "./_components/email-tab"
import { WhatsappTab } from "./_components/whatsapp"
import { PaymentTab } from "./_components/payment-tab"
import { StorageTab } from "./_components/storage-tab"
import { GoogleTab } from "./_components/google-tab"
import { GoogleContactsTab } from "./_components/google-contacts-tab"
import { AiTab } from "./_components/ai-tab"
import { BackupTab } from "./_components/backup-tab"
import { RetentionTab } from "./_components/retention-tab"

// Import Constants
import { DEFAULT_SETTINGS_FORM, type SettingsForm } from "./constants"

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState<SettingsForm>(DEFAULT_SETTINGS_FORM)
  const [initialWaSupportList, setInitialWaSupportList] = useState<{id: string, name: string, number: string}[]>([])

  useEffect(() => {
    fetch("/api/super-admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setForm((prev) => ({ ...prev, ...data }))
        if (data.SUPPORT_WA_NUMBERS) {
          try { 
            const parsed = JSON.parse(data.SUPPORT_WA_NUMBERS)
            setInitialWaSupportList(parsed) 
          } catch {}
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSaveBatch = async (fields: string[], overrides?: Record<string, string>) => {
    setSaving(true)
    const dataToSave: Record<string, string> = {}
    fields.forEach(f => {
      // Gunakan override jika ada (untuk menghindari React stale state)
      dataToSave[f] = overrides?.[f] !== undefined ? overrides[f] : String((form as any)[f])
    })

    const res = await fetch("/api/super-admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSave),
    })

    if (res.ok) {
      toast({ title: "Berhasil", description: "Pengaturan telah diperbarui." })
    }
    setSaving(false)
  }

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Platform</h1>
        <p className="text-muted-foreground mt-1">Kelola identitas dan integrasi utama seluruh platform dalam satu tempat.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <div className="flex justify-between items-center bg-white/50 p-1 rounded-2xl border backdrop-blur-sm sticky top-0 z-10">
          <TabsList className="bg-transparent border-0 h-11 flex overflow-x-auto w-full justify-start no-scrollbar">
            <TabsTrigger value="general" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Umum</TabsTrigger>
            <TabsTrigger value="email" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Email & SMTP</TabsTrigger>
            <TabsTrigger value="whatsapp" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">WhatsApp</TabsTrigger>
            <TabsTrigger value="payment" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Pembayaran</TabsTrigger>
            <TabsTrigger value="storage" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Penyimpanan</TabsTrigger>
            <TabsTrigger value="google" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Google Login</TabsTrigger>
            <TabsTrigger value="google-contacts" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Google Contacts</TabsTrigger>
            <TabsTrigger value="ai" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Kecerdasan Buatan (AI)</TabsTrigger>
            <TabsTrigger value="backup" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">🔒 Backup DB</TabsTrigger>
            <TabsTrigger value="retention" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">Retensi Tenant</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="outline-none">
          <GeneralTab form={form} setForm={setForm} handleSaveBatch={handleSaveBatch} saving={saving} initialWaSupportList={initialWaSupportList} />
        </TabsContent>

        <TabsContent value="email" className="outline-none">
          <EmailTab form={form} setForm={setForm} handleSaveBatch={handleSaveBatch} saving={saving} />
        </TabsContent>

        <TabsContent value="whatsapp" className="outline-none">
          <WhatsappTab form={form} setForm={setForm} handleSaveBatch={handleSaveBatch} saving={saving} />
        </TabsContent>

        <TabsContent value="payment" className="outline-none">
          <PaymentTab form={form} setForm={setForm} handleSaveBatch={handleSaveBatch} saving={saving} />
        </TabsContent>

        <TabsContent value="storage" className="outline-none">
          <StorageTab form={form} setForm={setForm} handleSaveBatch={handleSaveBatch} saving={saving} />
        </TabsContent>

        <TabsContent value="google" className="outline-none">
          <GoogleTab form={form} setForm={setForm} handleSaveBatch={handleSaveBatch} saving={saving} />
        </TabsContent>

        <TabsContent value="google-contacts" className="outline-none">
          <GoogleContactsTab form={form} setForm={setForm} handleSaveBatch={handleSaveBatch} saving={saving} />
        </TabsContent>

        <TabsContent value="ai" className="outline-none">
          <AiTab form={form} setForm={setForm} handleSaveBatch={handleSaveBatch} saving={saving} />
        </TabsContent>

        <TabsContent value="backup" className="outline-none">
          <BackupTab />
        </TabsContent>

        <TabsContent value="retention" className="outline-none">
          <RetentionTab form={form} setForm={setForm} handleSaveBatch={handleSaveBatch} saving={saving} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
