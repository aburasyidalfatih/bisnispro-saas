"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, AlertTriangle, Clock, Send, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

function ExamContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const pin = searchParams.get("pin")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [doubtful, setDoubtful] = useState<Record<string, boolean>>({})
  
  const [timeLeft, setTimeLeft] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCheatWarning, setShowCheatWarning] = useState(false)

  // Anti-Cheat: Visibility Change (Tab Blur) Detection
  useEffect(() => {
    if (loading || error || !sessionData) return

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Tab changed or window minimized
        setShowCheatWarning(true)
        try {
          await fetch("/api/cbt/session/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sessionData.sessionId, action: "CHEAT" })
          })
        } catch (err) {
          console.error("Failed to report cheat event", err)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [loading, error, sessionData])

  // Initialization & Data Fetching
  useEffect(() => {
    if (!pin) {
      setError("PIN Ujian tidak ditemukan di URL.")
      setLoading(false)
      return
    }

    const startSession = async () => {
      try {
        const res = await fetch("/api/cbt/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Gagal masuk ruang ujian")
        
        setSessionData(data)
        
        // Restore answers
        const ansMap: Record<string, string> = {}
        const doubtMap: Record<string, boolean> = {}
        data.answers.forEach((ans: any) => {
          ansMap[ans.questionId] = ans.answerText
          doubtMap[ans.questionId] = ans.isDoubtful
        })
        setAnswers(ansMap)
        setDoubtful(doubtMap)

        // Calculate Time Left
        const start = new Date(data.sessionStartTime).getTime()
        const durationMs = data.exam.duration * 60000
        const end = start + durationMs
        const now = new Date().getTime()
        setTimeLeft(Math.max(0, Math.floor((end - now) / 1000)))

        setLoading(false)

        // Enable Fullscreen Logic
        const elem = document.documentElement
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => console.log("Fullscreen blocked"))
        }

      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    startSession()
  }, [pin])

  // Timer Countdown
  useEffect(() => {
    if (timeLeft <= 0 || loading || error) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleFinishExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, loading, error])

  // Format Time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Answer Saving Logic
  const handleAnswer = async (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
    
    // Background fetch to save answer
    try {
      await fetch("/api/cbt/session/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionData.sessionId, questionId, answer: optionId })
      })
    } catch (err) {
      console.error("Gagal menyimpan jawaban", err)
    }
  }

  const handleToggleDoubtful = () => {
    const qId = sessionData.questions[currentIdx].id
    setDoubtful(prev => ({ ...prev, [qId]: !prev[qId] }))
  }

  const handleFinishExam = async () => {
    try {
      await fetch("/api/cbt/session/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionData.sessionId, action: "FINISH" })
      })
      toast({ title: "Ujian Selesai", description: "Jawaban Anda berhasil disimpan." })
    } catch (err) {
      toast({ title: "Gagal menyelesaikan ujian", variant: "destructive" })
    }

    if (document.exitFullscreen) {
      document.exitFullscreen().catch(()=>console.log("Not fullscreen"))
    }
    router.push("/panel-siswa")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-bold text-slate-600 animate-pulse">Menyiapkan Ruang Ujian...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-red-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Akses Ditolak</h2>
          <p className="text-muted-foreground mb-8">{error}</p>
          <Button onClick={() => router.push("/panel-siswa")} className="w-full rounded-xl">Kembali ke Dashboard</Button>
        </div>
      </div>
    )
  }

  const currentQ = sessionData.questions[currentIdx]

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      
      {/* LEFT AREA: Soal & Opsi (75%) */}
      <div className="flex-1 flex flex-col relative h-screen">
        
        {/* Top Header */}
        <header className="h-16 glass border-b px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="font-black text-xl text-slate-800 tracking-tight">{sessionData.exam.title}</div>
            <div className="hidden sm:block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">SOAL KE-{currentIdx + 1}</div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-lg border-2 ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white border-slate-200 text-slate-700'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 hide-scrollbar pb-32">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Pertanyaan */}
            <div className="text-xl md:text-2xl leading-relaxed font-medium text-slate-800 whitespace-pre-wrap">
              {currentQ.text}
            </div>

            {/* Opsi Jawaban */}
            <div className="space-y-3">
              {currentQ.options.map((opt: any, idx: number) => {
                const label = String.fromCharCode(65 + idx)
                const isSelected = answers[currentQ.id] === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(currentQ.id, opt.id)}
                    className={`w-full flex items-start text-left p-4 rounded-2xl border-2 transition-all duration-200 group ${isSelected ? 'bg-primary/5 border-primary shadow-[0_4px_20px_rgba(var(--primary),0.1)]' : 'bg-white border-slate-200 hover:border-primary/50 hover:bg-slate-50'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mr-4 font-bold text-lg transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-primary/20 group-hover:text-primary'}`}>
                      {label}
                    </div>
                    <div className={`pt-1 text-lg ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                      {opt.text}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </main>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 h-20 glass border-t flex items-center justify-between px-6 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="rounded-xl font-bold"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> SEBELUMNYA
          </Button>

          <Button
            variant="outline"
            className={`rounded-xl font-bold ${doubtful[currentQ.id] ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200' : ''}`}
            onClick={handleToggleDoubtful}
          >
            <AlertTriangle className="w-4 h-4 mr-2" /> RAGU-RAGU
          </Button>

          <Button 
            size="lg" 
            onClick={() => {
              if (currentIdx === sessionData.questions.length - 1) setShowConfirm(true)
              else setCurrentIdx(prev => Math.min(sessionData.questions.length - 1, prev + 1))
            }}
            className="rounded-xl font-bold shadow-lg shadow-primary/30"
          >
            {currentIdx === sessionData.questions.length - 1 ? (
              <><Send className="w-4 h-4 mr-2" /> SELESAI</>
            ) : (
              <>SELANJUTNYA <ChevronRight className="w-5 h-5 ml-1" /></>
            )}
          </Button>
        </div>

      </div>

      {/* RIGHT AREA: Navigasi Nomor (25%) */}
      <div className="w-full md:w-80 bg-white border-l h-screen flex flex-col hidden md:flex">
        <div className="p-4 border-b font-bold text-sm text-slate-500 uppercase tracking-wider text-center">Navigasi Soal</div>
        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
          <div className="grid grid-cols-5 gap-2">
            {sessionData.questions.map((q: any, i: number) => {
              const isAns = !!answers[q.id]
              const isDoubt = doubtful[q.id]
              const isCurr = currentIdx === i
              
              let bgColor = "bg-white border-slate-200 text-slate-600 hover:border-primary/50 hover:bg-slate-50"
              if (isDoubt) bgColor = "bg-amber-400 border-amber-500 text-amber-950 font-bold"
              else if (isAns) bgColor = "bg-emerald-500 border-emerald-600 text-white font-bold shadow-sm shadow-emerald-500/30"
              
              if (isCurr && !isAns && !isDoubt) bgColor = "bg-primary text-white font-bold border-primary shadow-md shadow-primary/30 ring-2 ring-primary/20 ring-offset-2"

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${bgColor}`}
                >
                  <span className="text-lg">{i + 1}</span>
                  {isAns && !isDoubt && <CheckCircle2 className="w-3 h-3 mt-0.5 opacity-80" />}
                </button>
              )
            })}
          </div>
        </div>
        <div className="p-4 border-t space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600"><div className="w-4 h-4 bg-emerald-500 rounded-sm"></div> Sudah Dijawab</div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600"><div className="w-4 h-4 bg-amber-400 rounded-sm"></div> Ragu-ragu</div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600"><div className="w-4 h-4 bg-white border-2 border-slate-200 rounded-sm"></div> Belum Dijawab</div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-primary ml-1" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-800">Selesaikan Ujian?</DialogTitle>
            <DialogDescription className="text-base text-slate-600 pb-4 pt-2">
              Pastikan semua jawaban telah terisi. Anda tidak dapat mengubah jawaban setelah mengakhiri ujian.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pb-2">
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <div className="text-2xl font-black text-emerald-600">{Object.keys(answers).length}</div>
              <div className="text-[10px] font-bold text-emerald-700 uppercase">Terjawab</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="text-2xl font-black text-slate-600">{sessionData.questions.length - Object.keys(answers).length}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Kosong</div>
            </div>
          </div>
          <DialogFooter className="sm:justify-center flex gap-3 w-full">
            <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setShowConfirm(false)}>Batal</Button>
            <Button onClick={handleFinishExam} className="flex-1 rounded-xl h-12 shadow-lg shadow-primary/30 font-bold">Kumpulkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cheat Warning Dialog */}
      <Dialog open={showCheatWarning} onOpenChange={setShowCheatWarning}>
        <DialogContent className="sm:max-w-md text-center border-red-500 bg-red-50">
          <DialogHeader>
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 border border-red-200">
              <AlertTriangle className="w-10 h-10 text-red-600 animate-pulse" />
            </div>
            <DialogTitle className="text-2xl font-black text-red-700">PERINGATAN KECURANGAN!</DialogTitle>
            <DialogDescription className="text-base text-red-800/80 pb-4 pt-2 font-medium">
              Sistem mendeteksi Anda mencoba berpindah halaman atau membuka tab baru. 
              <br/><br/>
              Tindakan ini telah <strong className="text-red-900 border-b border-red-900 border-dashed">Tercatat di Server</strong> dan dilaporkan ke pengawas ujian. Jika terus dilakukan, ujian Anda dapat dibatalkan!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center flex w-full">
            <Button variant="destructive" className="flex-1 rounded-xl h-12 font-bold shadow-lg shadow-red-500/30" onClick={() => setShowCheatWarning(false)}>
              SAYA MENGERTI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function RuangUjianPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <ExamContent />
    </Suspense>
  )
}
