import React from"react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Info, Sparkles, Upload, X } from"lucide-react"
import { LazyRichTextEditor as RichTextEditor } from"@/components/ui/lazy-rich-text-editor"
import { normalizeImageUrl } from"@/lib/utils"
import { AboutFormState, AiPromptType } from"./types"

interface PrincipalSpeechFormProps {
  form: AboutFormState
  setForm: React.Dispatch<React.SetStateAction<AboutFormState>>
  staffList: any[]
  handlePrincipalImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  openAiModal: (type: AiPromptType) => void
}

export function PrincipalSpeechForm({
  form, setForm, staffList, handlePrincipalImageUpload, openAiModal
}: PrincipalSpeechFormProps) {
  return (
    <Card className="glass border-0">
      <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg">Sambutan Utama (Pimpinan / Kepala Sekolah)</CardTitle>
            <CardDescription>Pesan sambutan dari tokoh utama untuk beranda website</CardDescription>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => openAiModal("principal-speech")} className="h-7 text-[10px] gap-1.5 rounded-xl border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 hover:text-violet-700 px-2 mt-0 shrink-0">
          <Sparkles className="h-3 w-3" /> Buat Sambutan AI
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bagian Kiri: Data & Foto */}
          <div className="space-y-6">
            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
              <div className="space-y-2">
                <Label>Pilih dari Data GTK</Label>
                <select
                  value={staffList.find(s => s.name === form.settings?.principalName)?.id ||""}
                  onChange={(e) => {
                    const selectedId = e.target.value
                    if (selectedId) {
                      const selected = staffList.find(s => s.id === selectedId)
                      if (selected) {
                        setForm(p => ({
                          ...p,
                          settings: {
                            ...p.settings,
                            principalName: selected.name,
                            principalTitle: selected.role ||"Kepala Sekolah",
                            principalImage: selected.imageUrl || p.settings?.principalImage
                          }
                        }))
                      }
                    }
                  }}
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">-- Isi Manual Atau Pilih GTK --</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">Pilih GTK untuk mengisi otomatis Nama, Jabatan, dan Foto.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Pemberi Sambutan</Label>
                  <Input value={form.settings?.principalName ||""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, principalName: e.target.value } }))}
                    placeholder="Contoh: Ir. Sherly Puspita, M.Pd" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Jabatan (Opsional)</Label>
                  <Input value={form.settings?.principalTitle ||""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, principalTitle: e.target.value } }))}
                    placeholder="Contoh: Kepala Sekolah" className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tahun Berdedikasi (Badge Foto)</Label>
                <Input value={form.settings?.principalBadgeYear ||""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, principalBadgeYear: e.target.value } }))}
                  placeholder="Contoh: 2015" className="rounded-xl" />
                <p className="text-[11px] text-muted-foreground">Tampil di badge foto halaman depan</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Foto Profil Utama</Label>
              <div className="flex gap-2">
                <Input value={form.settings?.principalImage ||""} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, principalImage: e.target.value } }))}
                  placeholder="https://... atau upload file" className="rounded-xl flex-1" />
                <Label className="cursor-pointer">
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePrincipalImageUpload} />
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-input bg-background hover:bg-muted/50">
                    <Upload className="h-4 w-4" />
                  </div>
                </Label>
                {form.settings?.principalImage && (
                  <Button type="button" variant="outline" size="icon" className="rounded-xl shrink-0 text-destructive"
                    onClick={() => setForm(p => ({ ...p, settings: { ...p.settings, principalImage:"" } }))}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {form.settings?.principalImage && (
                <div className="mt-4 rounded-xl overflow-hidden border w-32 h-32">
                  <img src={normalizeImageUrl(form.settings?.principalImage) || form.settings?.principalImage} alt="Principal preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Bagian Kanan: Teks Sambutan */}
          <div className="space-y-2">
            <Label>Pesan Sambutan</Label>
            <RichTextEditor 
              value={form.settings?.principalMessage ||""}
              onChange={val => setForm(p => ({ ...p, settings: { ...p.settings, principalMessage: val } }))}
              placeholder="Puji syukur ke hadirat Tuhan YME..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
