"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, User, Sparkles, Building2, BrainCircuit, History, CheckCircle2, Loader2, Database } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

import { useRouter } from "next/navigation"

export default function AiAnalystClient({ initialSessions = [] }: { initialSessions?: any[] }) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const router = useRouter()
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/super-admin/ai-analyst",
    body: { sessionId: activeSessionId },
    onResponse: (response) => {
      const newSessionId = response.headers.get('x-session-id')
      if (newSessionId && !activeSessionId) {
        setActiveSessionId(newSessionId)
      }
    },
    onFinish: () => {
      // Refresh the route to seamlessly update the sidebar history
      router.refresh()
    },
    onError: (err) => {
      alert("Gagal mengirim pesan: " + err.message)
    }
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadSession = (session: any) => {
    setActiveSessionId(session.id)
    setMessages(session.messages)
  }

  const startNewChat = () => {
    setActiveSessionId(null)
    setMessages([])
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            AI Business Analyst
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Asisten C-Level virtual untuk menganalisis data bisnis, omset, dan metrik operasional secara real-time.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar History */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-0 glass h-[calc(100vh-220px)] flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Riwayat Analisis
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={startNewChat}>+ Baru</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full w-full">
                <div className="divide-y divide-border/50">
                  {initialSessions.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      Belum ada riwayat chat
                    </div>
                  ) : (
                    initialSessions.map((s) => (
                      <Button 
                        key={s.id} 
                        onClick={() => loadSession(s)}
                        variant="ghost"
                        className={`w-full justify-start text-left p-3 hover:bg-muted/50 rounded-none h-auto transition-colors text-sm ${activeSessionId === s.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                      >
                        <div className="w-full">
                          <div className="font-medium line-clamp-1 w-full text-foreground whitespace-normal break-words">{s.title}</div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {format(new Date(s.updatedAt), "dd MMM, HH:mm", { locale: id })}
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="border shadow-sm bg-background/50 backdrop-blur-xl h-[calc(100vh-220px)] flex flex-col overflow-hidden relative">
            {/* Top decorative gradient */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40"></div>
            
            <CardHeader className="border-b border-border/40 bg-background/80 backdrop-blur-md py-4 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-2.5 rounded-xl border border-primary/20 shadow-inner">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Data Copilot</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1.5 mt-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Online • Didukung oleh Text-to-SQL
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-hidden relative bg-gradient-to-b from-muted/10 to-background">
              <ScrollArea className="h-full w-full p-4 sm:p-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 text-muted-foreground py-10 sm:py-20 animate-in fade-in zoom-in duration-500">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-background border border-primary/20 p-5 rounded-full shadow-lg">
                        <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="max-w-xl px-4">
                      <h3 className="text-2xl font-bold text-foreground tracking-tight">Halo, Super Admin! 👋</h3>
                      <p className="text-sm mt-3 text-muted-foreground leading-relaxed">
                        Saya adalah **AI Business Analyst** virtual Anda. Saya terhubung langsung ke *database* SchoolPro dan siap menyajikan data secara *real-time*.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 text-left">
                        <div 
                          className="text-xs bg-background/60 backdrop-blur-sm p-4 rounded-2xl cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all border shadow-sm group flex flex-col gap-2"
                          onClick={() => handleInputChange({ target: { value: "Tolong hitung perkiraan MRR dari tenant yang berstatus AKTIF saat ini." } } as any)}
                        >
                          <div className="flex items-center gap-2 text-foreground font-medium">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">💰</div>
                            Keuangan
                          </div>
                          <span className="text-muted-foreground leading-snug">"Tolong hitung perkiraan MRR dari tenant yang berstatus AKTIF saat ini."</span>
                        </div>

                        <div 
                          className="text-xs bg-background/60 backdrop-blur-sm p-4 rounded-2xl cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all border shadow-sm group flex flex-col gap-2"
                          onClick={() => handleInputChange({ target: { value: "Ada berapa tenant yang mendaftar bulan ini tapi belum membayar tagihan?" } } as any)}
                        >
                          <div className="flex items-center gap-2 text-foreground font-medium">
                            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">🏢</div>
                            Tenant & Sekolah
                          </div>
                          <span className="text-muted-foreground leading-snug">"Berapa tenant yang mendaftar bulan ini tapi belum bayar tagihan?"</span>
                        </div>

                        <div 
                          className="text-xs bg-background/60 backdrop-blur-sm p-4 rounded-2xl cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all border shadow-sm group flex flex-col gap-2 sm:col-span-2"
                          onClick={() => handleInputChange({ target: { value: "Tampilkan jam berapa traffic halaman paling ramai kemarin beserta jumlah PageView-nya." } } as any)}
                        >
                          <div className="flex items-center gap-2 text-foreground font-medium">
                            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">📈</div>
                            Analitik Sistem
                          </div>
                          <span className="text-muted-foreground leading-snug">"Tampilkan jam berapa traffic halaman paling ramai kemarin beserta jumlah PageView-nya."</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages
                      .filter(m => !(m.role === 'assistant' && !m.content && (!m.toolInvocations || m.toolInvocations.length === 0)))
                      .map((m) => (
                      <div key={m.id} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                          <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                            {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          </div>
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed overflow-hidden ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted/50 rounded-tl-sm border border-border/50'}`}>
                            {m.content && (
                              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:text-foreground prose-a:text-primary">
                                <ReactMarkdown>{m.content}</ReactMarkdown>
                              </div>
                            )}
                            
                            {/* Display tool invocations */}
                            {m.toolInvocations?.map((toolInvocation) => (
                              <div key={toolInvocation.toolCallId} className={cn("p-3 bg-background border rounded-xl text-xs flex flex-col gap-2 shadow-sm", m.content ? "mt-4" : "mt-1")}>
                                <div className="flex items-center gap-2 font-medium">
                                  {toolInvocation.state === 'result' ? (
                                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                    </div>
                                  ) : (
                                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Loader2 className="h-3 w-3 text-primary animate-spin" />
                                    </div>
                                  )}
                                  <span className={toolInvocation.state === 'result' ? 'text-foreground' : 'text-primary animate-pulse'}>
                                    {toolInvocation.state === 'result' ? 'Selesai menganalisis database' : 'Sedang mencari data dari database...'}
                                  </span>
                                </div>
                                
                                {toolInvocation.state === 'result' && toolInvocation.result?.results && (
                                  <div className="bg-muted/50 border border-border/50 p-2 rounded-lg text-[10px] text-muted-foreground flex items-center gap-2 ml-7">
                                    <Database className="h-3 w-3" />
                                    Berhasil menarik {Array.isArray(toolInvocation.result.results) ? toolInvocation.result.results.length : 1} baris data
                                    {toolInvocation.result.note && ` (${toolInvocation.result.note})`}
                                  </div>
                                )}
                              </div>
                            ))}
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
                  placeholder="Tanyakan metrik bisnis, tenant, afiliasi, atau operasional..." 
                  className="flex-1 rounded-full bg-muted/30 focus-visible:ring-primary/20"
                  disabled={isLoading}
                />
                <Button variant="ghost" size="icon" type="submit" disabled={isLoading || !input.trim()} className="rounded-full shrink-0 h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
