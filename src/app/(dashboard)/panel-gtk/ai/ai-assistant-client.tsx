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
        <Card className="shadow-sm border-0 glass">
          <CardHeader className="pb-3 bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              Sisa Token Anda
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              {totalTokens.toLocaleString("id-ID")}
            </div>
            <div className="space-y-1 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Token Pribadi</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{userTokens.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Token Sekolah</span>
                <span className="font-semibold text-primary">{tenantTokens.toLocaleString("id-ID")}</span>
              </div>
            </div>
            {totalTokens < 1000 && (
              <div className="mt-4 p-3 bg-red-500/10 text-red-600 rounded-lg text-xs font-medium border border-red-500/20">
                Sisa token Anda menipis. Segera lakukan top-up agar bisa terus menggunakan AI.
              </div>
            )}
            <Button className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700" onClick={() => setActiveTab("topup")}>
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
                    <button 
                      key={s.id} 
                      onClick={() => loadSession(s)}
                      className={`w-full text-left p-3 hover:bg-muted/50 transition-colors text-sm ${activeSessionId === s.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                    >
                      <div className="font-medium line-clamp-1">{s.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(s.updatedAt), "dd MMM, HH:mm", { locale: id })}
                      </div>
                    </button>
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
             <Card className="border-0 shadow-sm glass h-[calc(100vh-220px)] flex flex-col">
               <CardHeader className="border-b border-border/50 bg-muted/20 py-3">
                 <div className="flex items-center gap-3">
                   <div className="bg-primary/20 p-2 rounded-full">
                     <Bot className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                     <CardTitle className="text-base">Asisten Guru Pintar</CardTitle>
                     <CardDescription className="text-xs">Didukung oleh AI Generatif</CardDescription>
                   </div>
                 </div>
               </CardHeader>
               
               <CardContent className="flex-1 p-0 overflow-hidden relative">
                 <ScrollArea className="h-full w-full p-4 sm:p-6">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-muted-foreground py-20">
                        <div className="bg-primary/10 p-4 rounded-full">
                          <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <div className="max-w-md">
                          <h3 className="text-lg font-bold text-foreground">Halo! Ada yang bisa saya bantu?</h3>
                          <p className="text-sm mt-2">Coba tanyakan:</p>
                          <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <span className="text-xs bg-muted px-3 py-1.5 rounded-full cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => handleInputChange({ target: { value: "Buatkan contoh RPP Matematika kelas 7" } } as any)}>Buatkan RPP Matematika</span>
                            <span className="text-xs bg-muted px-3 py-1.5 rounded-full cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => handleInputChange({ target: { value: "Berikan 5 soal pilihan ganda tentang Fotosintesis" } } as any)}>Buat Soal Pilihan Ganda</span>
                            <span className="text-xs bg-muted px-3 py-1.5 rounded-full cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => handleInputChange({ target: { value: "Bantu saya menyusun kata sambutan acara perpisahan" } } as any)}>Teks Kata Sambutan</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {messages.map((m) => (
                          <div key={m.id} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                             <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                             </div>
                             <div className={`p-3 sm:p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted/50 rounded-tl-sm border border-border/50'}`}>
                                <div className="whitespace-pre-wrap">{m.content}</div>
                             </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex gap-3 max-w-[85%]">
                             <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-muted text-foreground">
                                <Bot className="h-4 w-4" />
                             </div>
                             <div className="p-4 rounded-2xl bg-muted/50 rounded-tl-sm border border-border/50 flex items-center gap-1.5">
                                <span className="h-2 w-2 bg-primary/40 rounded-full animate-bounce"></span>
                                <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="h-2 w-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                             </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                 </ScrollArea>
               </CardContent>
               
               <CardFooter className="p-3 bg-background border-t border-border/50">
                 <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                   <Input 
                     value={input} 
                     onChange={handleInputChange} 
                     placeholder="Ketik pertanyaan atau perintah Anda..." 
                     className="flex-1 rounded-full bg-muted/30 focus-visible:ring-primary/20"
                     disabled={isLoading || totalTokens < 50}
                   />
                   <Button type="submit" size="icon" disabled={isLoading || !input.trim() || totalTokens < 50} className="rounded-full shrink-0 h-10 w-10">
                     <Send className="h-4 w-4" />
                   </Button>
                 </form>
               </CardFooter>
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
                         {aiPackages?.map(pkg => (
                           <div 
                             key={pkg.id}
                             onClick={() => setSelectedPackageId(pkg.id)}
                             className={`cursor-pointer border rounded-xl p-4 text-center transition-all ${selectedPackageId === pkg.id ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50' : 'border-border hover:border-amber-500/30 hover:bg-amber-500/5'}`}
                           >
                              <div className="font-semibold text-sm mb-1">{pkg.name}</div>
                              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{pkg.tokens.toLocaleString("id-ID")}</div>
                              <div className="text-xs text-muted-foreground mt-1">Token AI</div>
                           </div>
                         ))}
                         {aiPackages?.length === 0 && (
                            <div className="col-span-2 text-center p-4 text-sm text-muted-foreground border rounded-xl">
                               Belum ada paket token tersedia.
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
                                     <input 
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
                                     <img src={ch.icon_url} alt={ch.name} className="max-h-full max-w-full object-contain" />
                                  </div>
                               </label>
                            ))}
                            {paymentChannels?.length === 0 && (
                               <label 
                                 className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${selectedMethod === 'MANUAL_TRANSFER' ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:bg-muted/50'}`}
                               >
                                  <div className="flex items-center gap-3">
                                     <input 
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
