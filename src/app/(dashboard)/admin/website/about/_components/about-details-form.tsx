import React from"react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Info, Sparkles, Upload, X } from"lucide-react"
import { LazyRichTextEditor as RichTextEditor } from"@/components/ui/lazy-rich-text-editor"
import { normalizeImageUrl } from"@/lib/utils"
import { AboutFormState, AiPromptType } from"./types"
import { Textarea } from "@/components/ui/textarea"

interface AboutDetailsFormProps {
  form: AboutFormState
  setForm: React.Dispatch<React.SetStateAction<AboutFormState>>
  staffList: any[]
  openAiModal: (type: AiPromptType) => void
}

export function AboutDetailsForm({
  form, setForm, staffList, openAiModal
}: AboutDetailsFormProps) {
  return (
    <>
      <Card className="glass border-0 lg:col-span-2">
        <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Info className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg">Tentang Kami</CardTitle>
              <CardDescription>Cerita lengkap, sejarah, visi, dan misi bisnis</CardDescription>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => openAiModal("about")} className="h-7 text-[10px] gap-1.5 rounded-xl border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 hover:text-violet-700 px-2 mt-0 shrink-0">
            <Sparkles className="h-3 w-3" /> Generate Sejarah
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <RichTextEditor 
              value={form.about ||""}
              onChange={val => setForm(p => ({ ...p, about: val }))}
              placeholder="Ceritakan tentang bisnis Anda, sejarah panjang..."
            />
          </div>
          
          <div className="space-y-1.5 mt-4">
            <Label>Link Video Profil (YouTube)</Label>
            <Input value={form.settings?.videoProfil ||""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, videoProfil: e.target.value } }))} placeholder="https://youtube.com/watch?v=..." className="rounded-xl h-9" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-1.5">
              <Label>NPSN</Label>
              <Input value={form.settings?.npsn ||""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, npsn: e.target.value } }))} placeholder="Nomor Pokok Perusahaan Nasional" className="rounded-xl h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>Akreditasi</Label>
              <Input value={form.settings?.akreditasi ||""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, akreditasi: e.target.value } }))} placeholder="Contoh: A (Sangat Baik)" className="rounded-xl h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>Tahun Berdiri</Label>
              <Input value={form.settings?.establishedYear ||""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, establishedYear: e.target.value } }))} placeholder="Contoh: 1998" className="rounded-xl h-9" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-1.5">
              <Label>Jam Operasional</Label>
              <Textarea value={form.settings?.operationalHours ||""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, operationalHours: e.target.value } }))}
                placeholder="Senin - Jumat: 07.00 - 16.00&#10;Sabtu: 07.00 - 12.00" rows={3}
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-y min-h-[100px]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t relative">
            <div className="absolute top-4 right-0">
              <Button type="button" variant="outline" size="sm" onClick={() => openAiModal("vision-mission")} className="h-7 text-[10px] gap-1.5 rounded-xl border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 hover:text-violet-700 px-2 mt-0">
                <Sparkles className="h-3 w-3" /> Poles Visi Misi
              </Button>
            </div>
            <div className="space-y-1.5 md:col-span-2 mt-8">
              <Label>Visi</Label>
              <RichTextEditor 
                value={form.settings?.visi ||""}
                onChange={val => setForm(p => ({ ...p, settings: { ...p.settings, visi: val } }))}
                placeholder="Visi perusahaan..."
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Misi</Label>
              <RichTextEditor 
                value={form.settings?.misi ||""}
                onChange={val => setForm(p => ({ ...p, settings: { ...p.settings, misi: val } }))}
                placeholder="Misi perusahaan..."
              />
            </div>
          </div>

        </CardContent>
      </Card>
    </>
  )
}
