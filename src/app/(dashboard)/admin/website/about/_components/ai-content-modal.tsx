import React from"react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from"@/components/ui/dialog"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Textarea } from"@/components/ui/textarea"
import { Sparkles, Wand2, Loader2 as Loader2Icon } from"lucide-react"
import { AiPromptType } from"./types"

interface AiContentModalProps {
  aiModalOpen: boolean
  setAiModalOpen: (open: boolean) => void
  aiPromptType: AiPromptType
  aiInputName: string
  setAiInputName: (name: string) => void
  aiInputText: string
  setAiInputText: (text: string) => void
  aiLoading: boolean
  handleGenerateAI: () => void
}

export function AiContentModal({
  aiModalOpen, setAiModalOpen, aiPromptType, aiInputName, setAiInputName,
  aiInputText, setAiInputText, aiLoading, handleGenerateAI
}: AiContentModalProps) {
  return (
    <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl max-w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            {aiPromptType ==="vision-mission" &&"Poles Visi & Misi"}
            {aiPromptType ==="about" &&"Generate Sejarah Perusahaan"}
            {aiPromptType ==="principal-speech" &&"Buat Sambutan Kepala Perusahaan"}
          </DialogTitle>
          <DialogDescription>
            Ubah poin-poin singkat Anda menjadi konten profesional.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {aiPromptType ==="principal-speech" && (
            <div className="space-y-2">
              <Label>Nama Kepala Perusahaan</Label>
              <Input value={aiInputName} onChange={e => setAiInputName(e.target.value)} placeholder="Contoh: Bpk. Budi Santoso" className="rounded-xl" />
            </div>
          )}
          <div className="space-y-2">
            <Label>
              {aiPromptType ==="vision-mission" &&"Masukkan Visi/Misi Kasar"}
              {aiPromptType ==="about" &&"Fakta & Sejarah Singkat"}
              {aiPromptType ==="principal-speech" &&"Fokus/Harapan Utama Perusahaan Tahun Ini"}
              <span className="text-red-500">*</span>
            </Label>
            <Textarea 
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              placeholder={
                aiPromptType ==="vision-mission" ?"Perusahaan yang pintar, bertakwa, dan bisa komputer." :
                aiPromptType ==="about" ?"Berdiri tahun 1990, awalnya 3 divisi. Sekarang aset lengkap." :"Ingin tingkatkan akhlak dan teknologi. Fokus pada prestasi olimpiade sains."
              }
              className="min-h-[120px] rounded-xl resize-none"
            />
          </div>
          
          <div className="rounded-xl bg-violet-500/10 p-3 flex gap-2 items-start mt-2 border border-violet-500/20">
            <Wand2 className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-violet-700 leading-relaxed">
              Akan memotong saldo AI Token (25 token).
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" className="rounded-xl" onClick={() => setAiModalOpen(false)} disabled={aiLoading}>
            Batal
          </Button>
          <Button 
            onClick={handleGenerateAI} 
            disabled={aiLoading || !aiInputText.trim()}
            className="rounded-xl gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
          >
            {aiLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {aiLoading ?"Memproses..." :"Generate dengan AI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
