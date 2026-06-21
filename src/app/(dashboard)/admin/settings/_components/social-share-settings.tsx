"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { Share2, Send } from "lucide-react"

export function SocialShareSettings({ tenantId, plan }: { tenantId: string | null, plan: string }) {
  const [credentials, setCredentials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [forms, setForms] = useState<Record<string, any>>({
    FACEBOOK: { externalId: "", accessToken: "", isActive: true },
    TWITTER: { accessToken: "", refreshToken: "", isActive: true },
    TELEGRAM: { externalId: "", accessToken: "", isActive: true },
    INSTAGRAM: { externalId: "", accessToken: "", isActive: true },
    THREADS: { externalId: "", accessToken: "", isActive: true },
  })

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/admin/settings/social`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCredentials(data)
          const newForms = { ...forms }
          data.forEach(c => {
            if (newForms[c.platform]) {
              newForms[c.platform] = {
                externalId: c.externalId || "",
                accessToken: c.accessToken || "",
                refreshToken: c.refreshToken || "",
                isActive: c.isActive
              }
            }
          })
          setForms(newForms)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantId])

  const handleSave = async (platform: string) => {
    setSaving(true)
    const data = forms[platform]
    try {
      const res = await fetch(`/api/admin/settings/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          ...data
        })
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || "Gagal menyimpan")
      }

      toast({ title: "Berhasil disimpan" })
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const isLocked = plan === "free" || !plan

  if (isLocked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Share2 className="w-5 h-5" /> Auto Share Sosial Media</CardTitle>
          <CardDescription>Otomatis bagikan artikel publik ke sosial media Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 p-4 rounded-lg flex flex-col items-center justify-center text-center space-y-3">
            <Share2 className="w-8 h-8 opacity-50" />
            <div>
              <p className="font-semibold">Fitur Terkunci</p>
              <p className="text-sm">Auto Share ke sosial media hanya tersedia untuk paket Lite dan Pro.</p>
            </div>
            <Button variant="outline" className="mt-2 border-orange-200 hover:bg-orange-100 dark:border-orange-900" onClick={() => window.location.href = '/admin/billing'}>Upgrade Paket</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Share2 className="w-5 h-5" /> Auto Share Sosial Media</CardTitle>
        <CardDescription>
          Otomatis bagikan artikel ke platform sosial media Anda. Pastikan token API dimasukkan dengan benar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* TELEGRAM */}
        <div className="space-y-4 border-b pb-6">
          <div className="flex items-center gap-2 mb-2">
            <Send className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">Telegram Channel</h3>
          </div>
          <div className="grid gap-3">
            <div>
              <Label>Bot Token</Label>
              <Input 
                value={forms.TELEGRAM.accessToken} 
                onChange={e => setForms(prev => ({...prev, TELEGRAM: {...prev.TELEGRAM, accessToken: e.target.value}}))} 
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" 
              />
              <p className="text-xs text-muted-foreground mt-1">Dapatkan dari BotFather.</p>
            </div>
            <div>
              <Label>Chat ID / Username Channel</Label>
              <Input 
                value={forms.TELEGRAM.externalId} 
                onChange={e => setForms(prev => ({...prev, TELEGRAM: {...prev.TELEGRAM, externalId: e.target.value}}))} 
                placeholder="@username_channel atau -100123456789" 
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={forms.TELEGRAM.isActive} 
                  onCheckedChange={c => setForms(prev => ({...prev, TELEGRAM: {...prev.TELEGRAM, isActive: c}}))} 
                />
                <Label>Aktif</Label>
              </div>
              <Button size="sm" onClick={() => handleSave("TELEGRAM")} disabled={saving || !forms.TELEGRAM.accessToken}>Simpan</Button>
            </div>
          </div>
        </div>

        {/* FACEBOOK */}
        <div className="space-y-4 border-b pb-6">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Facebook Page</h3>
          </div>
          <div className="grid gap-3">
            <div>
              <Label>Page Access Token</Label>
              <Input 
                value={forms.FACEBOOK.accessToken} 
                onChange={e => setForms(prev => ({...prev, FACEBOOK: {...prev.FACEBOOK, accessToken: e.target.value}}))} 
                placeholder="EAA..." 
              />
            </div>
            <div>
              <Label>Page ID</Label>
              <Input 
                value={forms.FACEBOOK.externalId} 
                onChange={e => setForms(prev => ({...prev, FACEBOOK: {...prev.FACEBOOK, externalId: e.target.value}}))} 
                placeholder="123456789012345" 
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={forms.FACEBOOK.isActive} 
                  onCheckedChange={c => setForms(prev => ({...prev, FACEBOOK: {...prev.FACEBOOK, isActive: c}}))} 
                />
                <Label>Aktif</Label>
              </div>
              <Button size="sm" onClick={() => handleSave("FACEBOOK")} disabled={saving || !forms.FACEBOOK.accessToken}>Simpan</Button>
            </div>
          </div>
        </div>

        {/* TWITTER */}
        <div className="space-y-4 border-b pb-6">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Twitter (X)</h3>
          </div>
          <div className="grid gap-3">
            <div>
              <Label>Access Token (User Token)</Label>
              <Input 
                value={forms.TWITTER.accessToken} 
                onChange={e => setForms(prev => ({...prev, TWITTER: {...prev.TWITTER, accessToken: e.target.value}}))} 
              />
            </div>
            <div>
              <Label>Access Token Secret</Label>
              <Input 
                value={forms.TWITTER.refreshToken} 
                onChange={e => setForms(prev => ({...prev, TWITTER: {...prev.TWITTER, refreshToken: e.target.value}}))} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={forms.TWITTER.isActive} 
                  onCheckedChange={c => setForms(prev => ({...prev, TWITTER: {...prev.TWITTER, isActive: c}}))} 
                />
                <Label>Aktif</Label>
              </div>
              <Button size="sm" onClick={() => handleSave("TWITTER")} disabled={saving || !forms.TWITTER.accessToken}>Simpan</Button>
            </div>
          </div>
        </div>

        {/* INSTAGRAM */}
        <div className="space-y-4 border-b pb-6">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-5 h-5 text-pink-600" />
            <h3 className="font-semibold">Instagram</h3>
          </div>
          <div className="grid gap-3">
            <div>
              <Label>Instagram User ID</Label>
              <Input 
                value={forms.INSTAGRAM.externalId} 
                onChange={e => setForms(prev => ({...prev, INSTAGRAM: {...prev.INSTAGRAM, externalId: e.target.value}}))} 
                placeholder="178414..." 
              />
            </div>
            <div>
              <Label>Access Token</Label>
              <Input 
                value={forms.INSTAGRAM.accessToken} 
                onChange={e => setForms(prev => ({...prev, INSTAGRAM: {...prev.INSTAGRAM, accessToken: e.target.value}}))} 
                placeholder="EAA..." 
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={forms.INSTAGRAM.isActive} 
                  onCheckedChange={c => setForms(prev => ({...prev, INSTAGRAM: {...prev.INSTAGRAM, isActive: c}}))} 
                />
                <Label>Aktif</Label>
              </div>
              <Button size="sm" onClick={() => handleSave("INSTAGRAM")} disabled={saving || !forms.INSTAGRAM.accessToken}>Simpan</Button>
            </div>
          </div>
        </div>

        {/* THREADS */}
        <div className="space-y-4 border-b pb-6">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-5 h-5 text-black dark:text-white" />
            <h3 className="font-semibold">Threads</h3>
          </div>
          <div className="grid gap-3">
            <div>
              <Label>Threads User ID</Label>
              <Input 
                value={forms.THREADS.externalId} 
                onChange={e => setForms(prev => ({...prev, THREADS: {...prev.THREADS, externalId: e.target.value}}))} 
                placeholder="User ID" 
              />
            </div>
            <div>
              <Label>Access Token</Label>
              <Input 
                value={forms.THREADS.accessToken} 
                onChange={e => setForms(prev => ({...prev, THREADS: {...prev.THREADS, accessToken: e.target.value}}))} 
                placeholder="THG..." 
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={forms.THREADS.isActive} 
                  onCheckedChange={c => setForms(prev => ({...prev, THREADS: {...prev.THREADS, isActive: c}}))} 
                />
                <Label>Aktif</Label>
              </div>
              <Button size="sm" onClick={() => handleSave("THREADS")} disabled={saving || !forms.THREADS.accessToken}>Simpan</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
