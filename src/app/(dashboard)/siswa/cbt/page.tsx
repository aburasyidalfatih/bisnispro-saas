"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowRight, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CBTEntryPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)

  const handleJoinExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin || pin.length !== 6) {
      return toast({ title: "PIN harus 6 digit", variant: "destructive" })
    }

    setLoading(true)
    try {
      router.push(`/ujian/ruang-ujian?pin=${pin.toUpperCase()}`)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-24 px-2 pt-4">
      {/* Ruang CBT Entry Point */}
      <Card className="glass border-2 border-primary/30 shadow-xl shadow-primary/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col items-center text-center gap-4 mb-8 mt-4">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center -rotate-6 shadow-sm border border-primary/20 shrink-0">
              <BookOpen className="w-10 h-10 text-primary rotate-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Portal Ujian CBT</h3>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed max-w-[250px] mx-auto">
                Masukkan 6-digit PIN Ujian yang diberikan oleh pengawas kelas Anda.
              </p>
            </div>
          </div>

          <form onSubmit={handleJoinExam} className="space-y-4">
            <Input 
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="------"
              className="text-center text-4xl font-black tracking-[0.5em] h-20 rounded-2xl bg-slate-50 border-2 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary uppercase shadow-inner"
            />
            <Button 
              type="submit" 
              disabled={loading || pin.length !== 6} 
              className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-primary/20 text-lg"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "MASUK RUANG UJIAN"}
              {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
