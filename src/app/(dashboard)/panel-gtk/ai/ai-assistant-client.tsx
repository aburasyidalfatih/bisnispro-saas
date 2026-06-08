"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, User, Coins, CreditCard, Sparkles, CheckCircle2, History } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { GtkAiUsageHistory } from "./_components/gtk-ai-usage-history"
import ReactMarkdown from "react-markdown"

export default function AiAssistantClient({ 
  userTokens, 
  tenantTokens, 
  paymentChannels,
  aiPackages,
  manualPayment,
  chatSessions
}: { 
  userTokens: number, 
  tenantTokens: number,
  paymentChannels: any[],
  aiPackages: any[],
  manualPayment: any,
  chatSessions: any[]
}) {
  const [activeTab, setActiveTab] = useState("chat")
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  
  // Topup states
  const [selectedPackageId, setSelectedPackageId] = useState<string>("")
  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [isLoadingTopup, setIsLoadingTopup] = useState(false)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/gtk/ai/chat",
    body: { sessionId: activeSessionId },
    onError: (err) => {
      alert("Gagal mengirim pesan: " + err.message)
    }
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const totalTokens = userTokens
  
  const handleTopup = async () => {
    if (!selectedPackageId) {
      alert("Pilih paket token terlebih dahulu")
      return
    }
    if (!selectedMethod) {
      alert("Pilih metode pembayaran terlebih dahulu")
      return
    }
    
    setIsLoadingTopup(true)
    try {
      const res = await fetch("/api/gtk/ai/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackageId,
          method: selectedMethod
        })
      })
      const data = await res.json()
      
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        alert("Gagal membuat transaksi: " + data.error)
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem")
    } finally {
      setIsLoadingTopup(false)
    }
  }

  const loadSession = (session: any) => {
    setActiveSessionId(session.id)
    setMessages(session.messages)
    setActiveTab("chat")
  }

  const startNewChat = () => {
    setActiveSessionId(null)
    setMessages([])
    setActiveTab("chat")
  }

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      
      {/* Sidebar for History & Token Info */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="shadow-lg border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/5 z-0"></div>
          <CardHeader className="pb-3 border-b border-amber-500/20 relative z-10">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <div className="bg-amber-500/20 p-1.5 rounded-lg">
                <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              Sisa Token Anda
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 relative z-10">
            <div className="text-4xl font-black tracking-tight mb-1 flex items-center gap-2 text-amber-600 dark:text-amber-400">
              {totalTokens.toLocaleString("id-ID")}
            </div>
            <div className="space-y-2 mt-5">
              <div className="flex justify-between items-center text-sm p-2 bg-white/50 dark:bg-black/20 rounded-xl">
                <span className="text-muted-foreground font-medium">Token Pribadi</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{userTokens.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center text-sm p-2 bg-white/50 dark:bg-black/20 rounded-xl">
                <span className="text-muted-foreground font-medium">Token Sekolah</span>
                <span className="font-bold text-primary">{tenantTokens.toLocaleString("id-ID")}</span>
              </div>
            </div>
            {totalTokens < 1000 && (
              <div className="mt-4 p-3 bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold border border-red-500/20 flex gap-2 items-start">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Sisa token menipis. Top-up segera agar AI tetap bisa membantu tugas Anda.</span>
              </div>
            )}
            <Button className="w-full mt-5 h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-500/20 rounded-xl" onClick={() => setActiveTab("topup")}>
              Top-Up Token Pribadi
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 glass h-[calc(100vh-400px)] flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Riwayat Chat
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={startNewChat}>+ Baru</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="divide-y divide-border/50">
                {chatSessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Belum ada riwayat chat
                  </div>
                ) : (
                  chatSessions.map((s) => (
                    <Button 
                      key={s.id} 
                      onClick={() => loadSession(s)}
                      className={`w-full text-left p-3 hover:bg-muted/50 transition-colors text-sm ${activeSessionId === s.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                    >
                      <div className="font-medium line-clamp-1">{s.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(s.updatedAt), "dd MMM, HH:mm", { locale: id })}
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
              <TabsList>
               <TabsTrigger value="chat" className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Asisten AI</TabsTrigger>
               <TabsTrigger value="topup" className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Top-Up Token</TabsTrigger>
               <TabsTrigger value="history" className="flex items-center gap-2"><History className="h-4 w-4" /> Histori Potongan</TabsTrigger>
             </TabsList>
          </div>

          <TabsContent value="chat" className="m-0">
             <Card className="border-0 shadow-lg glass h-[calc(100vh-200px)] flex flex-col relative overflow-hidden">
               <CardHeader className="border-b border-border/30 bg-white/50 dark:bg-black/20 py-4 backdrop-blur-xl z-10 relative">
                 <div className="flex items-center gap-4">
                   <div className="bg-gradient-to-br from-primary to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-primary/20">
                     <Bot className="h-6 w-6 text-white" />
                   </div>
                   <div>
                     <CardTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Asisten AI Pro</CardTitle>
                     <CardDescription className="text-xs font-medium">Bantu susun RPP, Soal, & Materi Pelajaran</CardDescription>
                   </div>
                 </div>
               </CardHeader>
               
               <CardContent className="flex-1 p-0 overflow-hidden relative bg-slate-50/30 dark:bg-slate-900/10">
                 <ScrollArea className="h-full w-full p-4 sm:p-6 pb-28">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
                        <div className="bg-gradient-to-br from-primary/10 to-indigo-600/10 p-5 rounded-full ring-1 ring-primary/20 shadow-xl shadow-primary/5">
                          <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                        <div className="max-w-lg w-full">
                          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Halo, Pak/Bu Guru! 👋</h3>
                          <p className="text-muted-foreground mt-2 mb-6">Pilih template perintah di bawah ini untuk memulai:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            <div 
                              onClick={() => handleInputChange({ target: { value: "Buatkan contoh RPP Kurikulum Merdeka untuk mata pelajaran Matematika kelas 7 materi Aljabar, lengkap dengan tujuan pembelajaran dan asesmen." } } as any)}
                              className="group cursor-pointer p-4 rounded-2xl border border-primary/20 bg-white/60 dark:bg-slate-800/60 hover:bg-primary/5 hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
                            >
                              <div className="font-bold text-primary mb-1 group-hover:text-primary/80 transition-colors">📄 Buat RPP Merdeka</div>
                              <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">Susun RPP lengkap dengan tujuan dan asesmen untuk satu bab.</div>
                            </div>
                            <div 
                              onClick={() => handleInputChange({ target: { value: "Berikan 10 soal pilihan ganda tentang materi Fotosintesis kelas 8 SMP, lengkap dengan kunci jawaban dan pembahasan." } } as any)}
                              className="group cursor-pointer p-4 rounded-2xl border border-indigo-500/20 bg-white/60 dark:bg-slate-800/60 hover:bg-indigo-500/5 hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-md"
                            >
                              <div className="font-bold text-indigo-600 mb-1 group-hover:text-indigo-500 transition-colors">🎯 Buat Soal Ujian</div>
                              <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">Buat soal pilihan ganda atau essay beserta kunci jawaban.</div>
                            </div>
                            <div 
                              onClick={() => handleInputChange({ target: { value: "Bantu saya menyusun kata sambutan untuk acara pembagian rapor semester ganjil kepada wali murid." } } as any)}
                              className="group cursor-pointer p-4 rounded-2xl border border-emerald-500/20 bg-white/60 dark:bg-slate-800/60 hover:bg-emerald-500/5 hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md"
                            >
                              <div className="font-bold text-emerald-600 mb-1 group-hover:text-emerald-500 transition-colors">🎤 Teks Sambutan</div>
                              <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">Draft pidato untuk acara perpisahan atau pertemuan wali murid.</div>
                            </div>
                            <div 
                              onClick={() => handleInputChange({ target: { value: "Buatkan ringkasan materi pelajaran Sejarah tentang Proklamasi Kemerdekaan RI agar mudah dipahami siswa." } } as any)}
                              className="group cursor-pointer p-4 rounded-2xl border border-amber-500/20 bg-white/60 dark:bg-slate-800/60 hover:bg-amber-500/5 hover:border-amber-500/50 transition-all shadow-sm hover:shadow-md"
                            >
                              <div className="font-bold text-amber-600 mb-1 group-hover:text-amber-500 transition-colors">📚 Ringkasan Materi</div>
                              <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">Buat rangkuman materi pelajaran yang ringkas dan padat.</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {messages.map((m) => (
                          <div key={m.id} className={`flex gap-4 max-w-[90%] md:max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                             <div className={`shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center shadow-sm ${m.role === 'user' ? 'bg-gradient-to-br from-primary to-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-border text-primary'}`}>
                                {m.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                             </div>
                             <div className={`p-4 sm:p-5 rounded-3xl text-[15px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-white dark:bg-slate-800 rounded-tl-sm border border-border/50'}`}>
                                {m.role === 'user' ? (
                                  <div className="whitespace-pre-wrap">{m.content}</div>
                                ) : (
                                  <div className="prose prose-sm md:prose-base dark:prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50 max-w-none">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                  </div>
                                )}
                             </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex gap-4 max-w-[85%]">
                             <div className="shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800 border border-border text-primary shadow-sm">
                                <Bot className="h-5 w-5" />
                             </div>
                             <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 rounded-tl-sm border border-border/50 shadow-sm flex items-center gap-2">
                                <span className="h-2 w-2 bg-primary/40 rounded-full animate-bounce"></span>
                                <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="h-2 w-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                             </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} className="h-8" />
                      </div>
                    )}
                 </ScrollArea>
               </CardContent>
               
               {/* Floating Input Area */}
               <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pt-12">
                 <form onSubmit={handleSubmit} className="flex w-full items-center gap-2 max-w-4xl mx-auto bg-background border border-primary/20 shadow-xl shadow-primary/5 rounded-[2rem] p-1.5 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                   <Input 
                     value={input} 
                     onChange={handleInputChange} 
                     placeholder="Ketik pertanyaan atau tugas Anda di sini..." 
                     className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-[15px] px-4 py-6"
                     disabled={isLoading || totalTokens < 50}
                   />
                   <Button type="submit" disabled={isLoading || !input.trim() || totalTokens < 50} className="rounded-full shrink-0 h-12 w-12 bg-primary hover:bg-primary/90 text-white shadow-md">
                     <Send className="h-5 w-5 ml-0.5" />
                   </Button>
                 </form>
               </div>
             </Card>
          </TabsContent>

          <TabsContent value="topup" className="m-0">
             <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm glass">
                   <CardHeader>
                      <CardTitle>Beli Token AI Pribadi</CardTitle>
                      <CardDescription>Pilih jumlah token yang ingin Anda beli. Token pribadi tidak akan hangus di akhir bulan.</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-3">
                         {aiPackages?.map(pkg => {
                           const isSelected = selectedPackageId === pkg.id;
                           return (
                             <div 
                               key={pkg.id}
                               onClick={() => setSelectedPackageId(pkg.id)}
                               className={`relative cursor-pointer rounded-2xl p-5 text-center transition-all duration-300 ${isSelected ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl shadow-amber-500/30 scale-[1.02] text-white ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-background' : 'bg-white dark:bg-slate-800 border border-border/50 hover:border-amber-400/50 hover:shadow-md'}`}
                             >
                                {isSelected && (
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-200 shadow-sm flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Dipilih
                                  </div>
                                )}
                                <div className={`font-semibold text-sm mb-1 ${isSelected ? 'text-amber-50' : 'text-slate-600 dark:text-slate-400'}`}>{pkg.name}</div>
                                <div className={`text-2xl font-black mb-1 ${isSelected ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
                                  {pkg.tokens.toLocaleString("id-ID")}
                                </div>
                                <div className={`text-xs font-medium ${isSelected ? 'text-amber-100' : 'text-muted-foreground'}`}>Token AI</div>
                             </div>
                           )
                         })}
                         {aiPackages?.length === 0 && (
                            <div className="col-span-2 text-center p-8 text-sm text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/20">
                               Belum ada paket token tersedia saat ini.
                            </div>
                         )}
                      </div>
                      
                      {selectedPackageId && (
                        <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                           <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Total Pembayaran:</span>
                              <span className="text-xl font-bold text-primary">
                                Rp {aiPackages.find(p => p.id === selectedPackageId)?.price?.toLocaleString("id-ID") || 0}
                              </span>
                           </div>
                           <p className="text-[11px] text-muted-foreground text-right">*Belum termasuk biaya layanan (jika ada)</p>
                        </div>
                      )}
                   </CardContent>
                </Card>

                <Card className="border-0 shadow-sm glass">
                   <CardHeader>
                      <CardTitle>Metode Pembayaran</CardTitle>
                      <CardDescription>Pilih metode pembayaran yang tersedia.</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <ScrollArea className="h-[250px] pr-4">
                         <div className="space-y-3">
                            {paymentChannels?.map((ch: any) => (
                               <label 
                                 key={ch.code}
                                 className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${selectedMethod === ch.code ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:bg-muted/50'}`}
                               >
                                  <div className="flex items-center gap-3">
                                     <Input 
                                       type="radio" 
                                       name="payment_method" 
                                       value={ch.code} 
                                       checked={selectedMethod === ch.code}
                                       onChange={(e) => setSelectedMethod(e.target.value)}
                                       className="h-4 w-4 text-primary focus:ring-primary"
                                     />
                                     <div>
                                        <div className="font-semibold text-sm">{ch.name}</div>
                                     </div>
                                  </div>
                                  <div className="h-8 w-12 bg-white rounded flex items-center justify-center p-1 border">
                                     <img src={ch.icon_url} alt={ch.name} className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" />
                                  </div>
                               </label>
                            ))}
                            {paymentChannels?.length === 0 && (
                               <label 
                                 className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${selectedMethod === 'MANUAL_TRANSFER' ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:bg-muted/50'}`}
                               >
                                  <div className="flex items-center gap-3">
                                     <Input 
                                       type="radio" 
                                       name="payment_method" 
                                       value="MANUAL_TRANSFER" 
                                       checked={selectedMethod === 'MANUAL_TRANSFER'}
                                       onChange={(e) => setSelectedMethod(e.target.value)}
                                       className="h-4 w-4 text-primary focus:ring-primary"
                                     />
                                     <div>
                                        <div className="font-semibold text-sm">Transfer Manual</div>
                                        <div className="text-xs text-muted-foreground">{manualPayment?.bank}</div>
                                     </div>
                                  </div>
                                  <div className="h-8 w-12 bg-muted/50 rounded flex items-center justify-center p-1 border text-[10px] font-bold text-muted-foreground">
                                     MANUAL
                                  </div>
                               </label>
                            )}
                         </div>
                      </ScrollArea>
                   </CardContent>
                   <CardFooter className="bg-muted/20 border-t border-border/50 pt-4">
                      <Button 
                        onClick={handleTopup} 
                        className="w-full" 
                        size="lg" 
                        disabled={isLoadingTopup || !selectedMethod || !selectedPackageId}
                      >
                         {isLoadingTopup ? "Memproses..." : "Bayar Sekarang"}
                      </Button>
                   </CardFooter>
                 </Card>
              </div>
           </TabsContent>

           <TabsContent value="history" className="m-0">
             <GtkAiUsageHistory />
           </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
