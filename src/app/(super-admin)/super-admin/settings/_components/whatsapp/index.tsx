import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SettingsForm } from "../../constants"

import { ProviderStarsender } from "./provider-starsender"
import { ProviderMeta } from "./provider-meta"
import { ProviderWavio } from "./provider-wavio"
import { TemplateStarsender } from "./template-starsender"
import { TemplateWavio } from "./template-wavio"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WhatsappTabProps {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  handleSaveBatch: (fields: string[], overrides?: Record<string, string>) => Promise<void>;
  saving: boolean;
}

export function WhatsappTab({ form, setForm, handleSaveBatch, saving }: WhatsappTabProps) {
  return (
    <div className="space-y-6 outline-none">
      <Tabs defaultValue="starsender" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-medium leading-none">Provider WhatsApp</h3>
            <p className="text-sm text-muted-foreground">Pilih provider yang akan digunakan untuk mengirim pesan platform.</p>
          </div>
          <TabsList className="bg-muted/50 rounded-xl p-1 border flex-wrap h-auto">
            <TabsTrigger value="starsender" className="rounded-lg">StarSender API</TabsTrigger>
            <TabsTrigger value="meta" className="rounded-lg">Meta Official API</TabsTrigger>
            <TabsTrigger value="wavio" className="rounded-lg">Wavio API</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="mb-6 rounded-xl border bg-card p-4">
           <Label className="mb-2 block">Aktifkan Provider Pengiriman Utama</Label>
           <Select 
             value={form.WA_ACTIVE_PROVIDER} 
             onValueChange={value => {
               setForm({...form, WA_ACTIVE_PROVIDER: value});
               handleSaveBatch(['WA_ACTIVE_PROVIDER'], { WA_ACTIVE_PROVIDER: value });
             }} 
           >
             <SelectTrigger className="w-full md:w-1/3 h-10 rounded-xl">
               <SelectValue placeholder="Pilih Provider" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="starsender">StarSender API</SelectItem>
               <SelectItem value="meta">Meta Official API</SelectItem>
               <SelectItem value="wavio">Wavio API</SelectItem>
             </SelectContent>
           </Select>
           <p className="text-xs text-muted-foreground mt-2">Pilih gateway mana yang aktif untuk notifikasi otomatis platform (seperti alert pendaftaran baru).</p>
        </div>

        <TabsContent value="starsender" className="mt-0 outline-none grid gap-6 lg:grid-cols-2">
          <ProviderStarsender form={form} setForm={setForm} handleSaveBatch={handleSaveBatch} saving={saving} />
        </TabsContent>

        <TabsContent value="meta" className="mt-0 outline-none grid gap-6 lg:grid-cols-2">
          <ProviderMeta form={form} setForm={setForm} handleSaveBatch={handleSaveBatch} saving={saving} />
        </TabsContent>

        <TabsContent value="wavio" className="mt-0 outline-none grid gap-6 lg:grid-cols-2">
          <ProviderWavio form={form} setForm={setForm} handleSaveBatch={handleSaveBatch} saving={saving} />
        </TabsContent>
      </Tabs>

      <Card className="glass border-0 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"><Settings2 className="h-4 w-4 text-blue-500" /></div>
            <CardTitle className="text-lg">Template Pesan WhatsApp</CardTitle>
          </div>
          <CardDescription>Gunakan variabel dinamis seperti {'{{adminName}}, {{schoolName}}, {{adminEmail}}, {{schoolSlug}}, {{adminMessage}}, {{adminPhone}}, {{affiliateName}}, {{referralCode}}'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="starsender" className="w-full">
            <TabsList className="bg-muted/50 rounded-xl p-1 border mb-4">
              <TabsTrigger value="starsender" className="rounded-lg">StarSender (Teks Bebas)</TabsTrigger>
              <TabsTrigger value="wavio" className="rounded-lg">Wavio / Meta (WABA Templates)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="starsender" className="space-y-6">
              <TemplateStarsender form={form} setForm={setForm} />
            </TabsContent>

            <TabsContent value="wavio" className="space-y-6">
              <TemplateWavio form={form} setForm={setForm} />
            </TabsContent>
          </Tabs>

          <Button 
            className="w-full gap-2 btn-gradient text-white border-0 rounded-xl mt-6 flex items-center justify-center h-10 px-4" 
            onClick={() => handleSaveBatch([
              'WA_TEMPLATE_PENDING', 'WA_ENABLE_PENDING', 'EMAIL_ENABLE_PENDING',
              'WA_TEMPLATE_APPROVED', 'WA_ENABLE_APPROVED', 'EMAIL_ENABLE_APPROVED',
              'WA_TEMPLATE_REVISION', 'WA_ENABLE_REVISION', 'EMAIL_ENABLE_REVISION',
              'WA_TEMPLATE_REJECTED', 'WA_ENABLE_REJECTED', 'EMAIL_ENABLE_REJECTED',
              'WA_TEMPLATE_ALERT_SUPERADMIN', 'WA_ENABLE_ALERT_SUPERADMIN', 'EMAIL_ENABLE_ALERT_SUPERADMIN',
              'WA_TEMPLATE_ALERT_AFFILIATE', 'WA_ENABLE_ALERT_AFFILIATE', 'EMAIL_ENABLE_ALERT_AFFILIATE',
              'WA_TEMPLATE_INVOICE_CREATED', 'WA_ENABLE_INVOICE_CREATED', 'EMAIL_ENABLE_INVOICE_CREATED',
              'WA_TEMPLATE_PAYMENT_CONFIRMED', 'WA_ENABLE_PAYMENT_CONFIRMED', 'EMAIL_ENABLE_PAYMENT_CONFIRMED',
              'WA_TEMPLATE_AFFILIATE_COMMISSION', 'WA_ENABLE_AFFILIATE_COMMISSION', 'EMAIL_ENABLE_AFFILIATE_COMMISSION',
              'WA_TEMPLATE_SUBSCRIPTION_REMINDER', 'WA_ENABLE_SUBSCRIPTION_REMINDER', 'EMAIL_ENABLE_SUBSCRIPTION_REMINDER',
              'WA_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN', 'WA_ENABLE_PAYMENT_SUCCESS_SUPERADMIN', 'EMAIL_ENABLE_PAYMENT_SUCCESS_SUPERADMIN',
              'WA_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN', 'WA_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN', 'EMAIL_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN',
              'WA_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN', 'WA_ENABLE_INVOICE_EXPIRED_SUPERADMIN', 'EMAIL_ENABLE_INVOICE_EXPIRED_SUPERADMIN',
              'WA_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE', 'WA_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE', 'EMAIL_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE',
              'WA_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE', 'WA_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE', 'EMAIL_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE',
              'WAVIO_TEMPLATE_PENDING', 'WAVIO_TEMPLATE_APPROVED', 'WAVIO_TEMPLATE_REVISION', 'WAVIO_TEMPLATE_REJECTED',
              'WAVIO_TEMPLATE_ALERT_SUPERADMIN', 'WAVIO_TEMPLATE_ALERT_AFFILIATE', 'WAVIO_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN',
              'WAVIO_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN', 'WAVIO_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN', 'WAVIO_TEMPLATE_INVOICE_CREATED',
              'WAVIO_TEMPLATE_PAYMENT_CONFIRMED', 'WAVIO_TEMPLATE_AFFILIATE_COMMISSION', 'WAVIO_TEMPLATE_SUBSCRIPTION_REMINDER',
              'WAVIO_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE', 'WAVIO_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE'
            ])} 
            disabled={saving}
          >
            <Save className="h-4 w-4" /> Simpan Semua Template Pesan
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
