"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, ArrowLeft, Trash2, CheckCircle2, GripVertical, FileText, Sparkles } from "lucide-react"
import Link from "next/link"

export default function KelolaSoalPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [bank, setBank] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState({ topic: "", difficulty: "Sedang", count: "5", educationLevel: "SD/Sederajat", questionType: "MULTIPLE_CHOICE_4" })
  
  const [questionText, setQuestionText] = useState("")
  const [options, setOptions] = useState([
    { id: "A", text: "", isCorrect: true },
    { id: "B", text: "", isCorrect: false },
    { id: "C", text: "", isCorrect: false },
    { id: "D", text: "", isCorrect: false },
    { id: "E", text: "", isCorrect: false },
  ])

  const fetchBank = async () => {
    try {
      const res = await fetch(`/api/cbt/bank-soal/${id}`)
      if (!res.ok) throw new Error("Gagal memuat bank soal")
      const data = await res.json()
      setBank(data)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBank()
  }, [id])

  const handleOptionChange = (idx: number, text: string) => {
    const newOptions = [...options]
    newOptions[idx].text = text
    setOptions(newOptions)
  }

  const handleSetCorrect = (idx: number) => {
    const newOptions = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === idx
    }))
    setOptions(newOptions)
  }

  const handleSubmit = async () => {
    if (!questionText.trim()) return toast({ title: "Soal tidak boleh kosong", variant: "destructive" })
    
    const validOptions = options.filter(o => o.text.trim() !== "")
    if (validOptions.length < 2) return toast({ title: "Minimal 2 opsi jawaban harus diisi", variant: "destructive" })
    if (!validOptions.some(o => o.isCorrect)) return toast({ title: "Pilih minimal 1 jawaban benar", variant: "destructive" })

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/cbt/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionBankId: id,
          type: "MULTIPLE_CHOICE",
          content: questionText,
          options: validOptions,
          points: 1
        })
      })
      if (!res.ok) throw new Error("Gagal menyimpan soal")
      
      toast({ title: "Soal berhasil ditambahkan!" })
      setIsDialogOpen(false)
      setQuestionText("")
      setOptions([
        { id: "A", text: "", isCorrect: true },
        { id: "B", text: "", isCorrect: false },
        { id: "C", text: "", isCorrect: false },
        { id: "D", text: "", isCorrect: false },
        { id: "E", text: "", isCorrect: false },
      ])
      fetchBank()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (questionId: string) => {
    if (!confirm("Yakin ingin menghapus soal ini?")) return
    try {
      const res = await fetch(`/api/cbt/questions?id=${questionId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast({ title: "Soal dihapus" })
      fetchBank()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleGenerateAi = async () => {
    if (!aiPrompt.topic.trim()) return toast({ title: "Topik materi tidak boleh kosong", variant: "destructive" })
    setIsGenerating(true)
    try {
      const res = await fetch("/api/cbt/questions/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionBankId: id,
          topic: aiPrompt.topic,
          difficulty: aiPrompt.difficulty,
          count: parseInt(aiPrompt.count),
          educationLevel: aiPrompt.educationLevel,
          questionType: aiPrompt.questionType
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membuat soal")
      
      toast({ title: "Sukses!", description: `${data.count} soal berhasil di-generate dan ditambahkan.` })
      setIsAiDialogOpen(false)
      setAiPrompt({ ...aiPrompt, topic: "", count: "5" })
      fetchBank()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  if (!bank) return <div className="text-center py-20">Bank Soal tidak ditemukan.</div>

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/panel-gtk/cbt/bank-soal">
            <Button variant="outline" size="icon" className="rounded-xl"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{bank.name}</h1>
            <div className="flex gap-2 mt-1">
              {bank.subject && <span className="text-xs uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{bank.subject}</span>}
              {bank.level && <span className="text-xs uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{bank.level}</span>}
              <span className="text-xs uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{bank.questions.length} Soal</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAiDialogOpen(true)} variant="outline" className="rounded-xl border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
            <Sparkles className="w-4 h-4 mr-2" /> Generate Soal AI
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Tambah Manual
          </Button>
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-4">
        {bank.questions.length === 0 ? (
          <Card className="glass border-dashed">
            <CardContent className="py-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Belum Ada Soal</h3>
              <p className="text-muted-foreground mb-6">Mulai tambahkan soal pilihan ganda atau essay ke dalam bank soal ini.</p>
              <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="rounded-xl">Tambah Soal Pertama</Button>
            </CardContent>
          </Card>
        ) : (
          bank.questions.map((q: any, i: number) => (
            <Card key={q.id} className="glass relative group">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2 text-slate-400 mt-1">
                    <GripVertical className="w-4 h-4 cursor-move hover:text-slate-600" />
                    <span className="font-bold text-lg text-slate-800">{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">{q.content}</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options?.map((opt: any) => (
                        <div key={opt.id} className={`flex items-start gap-2 p-3 rounded-lg border ${opt.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                          <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${opt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {opt.id}
                          </div>
                          <span className={`text-sm ${opt.isCorrect ? 'font-semibold text-emerald-900' : 'text-slate-600'}`}>{opt.text}</span>
                          {opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(q.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog Add Question */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Soal Pilihan Ganda</DialogTitle>
            <DialogDescription>Masukkan teks soal dan tentukan opsi jawabannya. Centang opsi yang merupakan kunci jawaban.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Pertanyaan <span className="text-red-500">*</span></Label>
              <Textarea 
                placeholder="Ketik soal disini..." 
                className="min-h-[120px] resize-none" 
                value={questionText} 
                onChange={(e) => setQuestionText(e.target.value)} 
              />
            </div>
            
            <div className="space-y-3">
              <Label>Pilihan Jawaban (Minimal 2)</Label>
              {options.map((opt, idx) => (
                <div key={opt.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${opt.isCorrect ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <button 
                    onClick={() => handleSetCorrect(idx)}
                    className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${opt.isCorrect ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {opt.id}
                  </button>
                  <Textarea 
                    placeholder={`Teks pilihan ${opt.id}...`} 
                    className="min-h-[40px] h-[40px] resize-none" 
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                  />
                  {opt.isCorrect && (
                    <div className="flex items-center gap-1 text-primary text-xs font-bold pt-3 shrink-0">
                      <CheckCircle2 className="w-4 h-4" /> KUNCI
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !questionText}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Simpan Soal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog AI Generator */}
      <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              Generate Soal dengan AI
            </DialogTitle>
            <DialogDescription>AI akan membuatkan soal pilihan ganda berdasarkan topik yang Anda tentukan secara otomatis.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Topik Materi <span className="text-red-500">*</span></Label>
              <Textarea 
                placeholder="Contoh: Sistem pencernaan manusia dan enzim yang terlibat" 
                className="resize-none" 
                value={aiPrompt.topic} 
                onChange={(e) => setAiPrompt({ ...aiPrompt, topic: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jenjang Pendidikan</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={aiPrompt.educationLevel}
                  onChange={(e) => setAiPrompt({ ...aiPrompt, educationLevel: e.target.value })}
                >
                  <option value="SD/Sederajat">SD / Sederajat</option>
                  <option value="SMP/Sederajat">SMP / Sederajat</option>
                  <option value="SMA/SMK/Sederajat">SMA/SMK / Sederajat</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tipe Soal</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={aiPrompt.questionType}
                  onChange={(e) => setAiPrompt({ ...aiPrompt, questionType: e.target.value })}
                >
                  <option value="MULTIPLE_CHOICE_4">Pilihan Ganda (A-D)</option>
                  <option value="MULTIPLE_CHOICE_5">Pilihan Ganda (A-E)</option>
                  <option value="TRUE_FALSE">Benar / Salah</option>
                  <option value="ESSAY">Essay (Uraian)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tingkat Kesulitan</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={aiPrompt.difficulty}
                  onChange={(e) => setAiPrompt({ ...aiPrompt, difficulty: e.target.value })}
                >
                  <option value="Mudah">Mudah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Sulit (HOTS)">Sulit (HOTS)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Jumlah Soal</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={aiPrompt.count}
                  onChange={(e) => setAiPrompt({ ...aiPrompt, count: e.target.value })}
                >
                  <option value="1">1 Soal</option>
                  <option value="3">3 Soal</option>
                  <option value="5">5 Soal</option>
                  <option value="10">10 Soal</option>
                  <option value="15">15 Soal</option>
                  <option value="20">20 Soal</option>
                  <option value="30">30 Soal</option>
                  <option value="40">40 Soal</option>
                  <option value="50">50 Soal</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-lg border">
              Info: Proses ini membutuhkan saldo Token AI dari sekolah Anda. Waktu proses bergantung pada jumlah soal (± 10-30 detik).
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAiDialogOpen(false)} disabled={isGenerating}>Batal</Button>
            <Button onClick={handleGenerateAi} disabled={isGenerating || !aiPrompt.topic} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} 
              {isGenerating ? "Menganalisis & Membuat..." : "Generate Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
