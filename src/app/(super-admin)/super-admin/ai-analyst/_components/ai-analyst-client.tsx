"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, User, Sparkles, Building2, BrainCircuit, History, CheckCircle2, Loader2, Database, PanelLeft, Image as ImageIcon, FolderOpen, FileCode, Globe, Brain } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

import { useRouter } from "next/navigation"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f43f5e', '#06b6d4', '#84cc16'];

export default function AiAnalystClient({ initialSessions = [] }: { initialSessions?: any[] }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessions.length > 0 ? initialSessions[0].id : null)
  const router = useRouter()
  
  const [inputValue, setInputValue] = useState("")
  const { messages, sendMessage, isLoading, setMessages } = useChat({
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

  const customHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return
    
    sendMessage({ role: "user", parts: [{ type: 'text', text: inputValue }] })
    setInputValue("")
  }

  const handleManualInput = (val: string) => {
    sendMessage({ role: "user", parts: [{ type: 'text', text: val }] })
  }

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
    setIsMobileSidebarOpen(false)
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden lg:flex hover:bg-muted" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Sidebar"
          >
            <PanelLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
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
        <Button 
          variant="outline" 
          className="lg:hidden w-full sm:w-auto shadow-sm" 
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        >
          <History className="h-4 w-4 mr-2" />
          {isMobileSidebarOpen ? "Tutup Riwayat" : "Lihat Riwayat"}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[500px]">
        {/* Sidebar History */}
        <div className={`w-full ${isSidebarOpen ? 'lg:w-1/4 lg:block' : 'lg:hidden'} ${isMobileSidebarOpen ? 'block' : 'hidden'} space-y-6 h-full transition-all duration-300`}>
          <Card className="shadow-sm border-0 glass h-full flex flex-col">
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
                        onClick={() => { loadSession(s); setIsMobileSidebarOpen(false); }}
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
        <div className={`w-full ${isSidebarOpen ? 'lg:w-3/4' : 'lg:w-full'} ${isMobileSidebarOpen ? 'hidden lg:block' : 'block'} h-full transition-all duration-300`}>
          <Card className="border shadow-sm bg-background/50 backdrop-blur-xl h-full flex flex-col overflow-hidden relative">
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
                        Saya adalah <strong>AI Business Analyst</strong> virtual Anda. Saya terhubung langsung ke <em>database</em> SchoolPro dan siap menyajikan data secara <em>real-time</em>.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 text-left">
                        <div 
                          className="text-xs bg-background/60 backdrop-blur-sm p-4 rounded-2xl cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all border shadow-sm group flex flex-col gap-2"
                          onClick={() => handleManualInput("Tolong hitung perkiraan pendapatan dari tenant yang berstatus AKTIF saat ini.")}
                        >
                          <div className="flex items-center gap-2 text-foreground font-medium">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Sparkles className="h-4 w-4" /></div>
                            Keuangan
                          </div>
                          <span className="text-muted-foreground leading-snug">"Tolong hitung perkiraan pendapatan dari tenant yang berstatus AKTIF saat ini."</span>
                        </div>

                        <div 
                          className="text-xs bg-background/60 backdrop-blur-sm p-4 rounded-2xl cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all border shadow-sm group flex flex-col gap-2"
                          onClick={() => handleManualInput("Ada berapa tenant yang mendaftar bulan ini tapi belum membayar tagihan?")}
                        >
                          <div className="flex items-center gap-2 text-foreground font-medium">
                            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors"><Building2 className="h-4 w-4" /></div>
                            Tenant & Sekolah
                          </div>
                          <span className="text-muted-foreground leading-snug">"Berapa tenant yang mendaftar bulan ini tapi belum bayar tagihan?"</span>
                        </div>

                        <div 
                          className="text-xs bg-background/60 backdrop-blur-sm p-4 rounded-2xl cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all border shadow-sm group flex flex-col gap-2 sm:col-span-2"
                          onClick={() => handleManualInput("Tampilkan jam berapa traffic sistem paling ramai kemarin berdasarkan data.")}
                        >
                          <div className="flex items-center gap-2 text-foreground font-medium">
                            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors"><History className="h-4 w-4" /></div>
                            Analitik Sistem
                          </div>
                          <span className="text-muted-foreground leading-snug">"Tampilkan jam berapa traffic sistem paling ramai kemarin berdasarkan data."</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages
                      .map(m => {
                        // AI SDK v5/v6 UIMessage adapter
                        if ((m as any).parts !== undefined) {
                          const textContent = (m as any).parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\\n');
                          const toolInvocations = (m as any).parts.filter((p: any) => p.type.startsWith('tool-')).map((p: any) => {
                            const toolName = p.type.replace('tool-', '');
                            return {
                              toolCallId: p.toolCallId || Math.random().toString(),
                              toolName: toolName,
                              args: p.input,
                              result: p.output,
                              state: p.output !== undefined ? 'result' : 'call'
                            };
                          });
                          return {
                            ...m,
                            content: textContent,
                            toolInvocations: toolInvocations.length > 0 ? toolInvocations : undefined
                          };
                        }
                        return m;
                      })
                      .filter(m => !(m.role === 'assistant' && !m.content && (!m.toolInvocations || m.toolInvocations.length === 0)))
                      .map((m) => (
                      <div key={m.id} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                          <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                            {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          </div>
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed overflow-hidden ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted/50 rounded-tl-sm border border-border/50'}`}>
                            {m.content && (
                              <div className="overflow-x-auto max-w-full">
                                {m.role === 'user' ? (
                                  <div className="whitespace-pre-wrap">{m.content}</div>
                                ) : (
                                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:text-foreground prose-a:text-primary prose-table:min-w-full prose-td:px-3 prose-td:py-2 prose-th:px-3 prose-th:py-2 prose-th:bg-muted/50">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Display tool invocations */}
                            {m.toolInvocations?.map((toolInvocation) => (
                               <div key={toolInvocation.toolCallId} className="w-full mt-4">
                                  {toolInvocation.toolName === 'execute_postgres_query' && (
                                    <div className={cn("p-3.5 bg-[#0D1117] border border-[#30363D] rounded-xl text-xs flex flex-col gap-3 shadow-inner text-[#C9D1D9] font-mono overflow-hidden")}>
                                      <div className="flex items-center gap-2.5">
                                        {toolInvocation.state === 'result' ? (
                                          <div className="h-5 w-5 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                          </div>
                                        ) : (
                                          <div className="h-5 w-5 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                            <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />
                                          </div>
                                        )}
                                        <span className={toolInvocation.state === 'result' ? 'text-[#8B949E]' : 'text-blue-400 animate-pulse'}>
                                          {toolInvocation.state === 'result' ? '> execution_completed' : '> executing_postgres_query...'}
                                        </span>
                                      </div>
                                      
                                      {toolInvocation.state === 'result' && toolInvocation.result?.results && (
                                        <div className="bg-[#161B22] border border-[#30363D] p-3 rounded-lg text-[11px] text-[#8B949E] flex items-start gap-2.5 ml-7">
                                          <Database className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#8B949E]" />
                                          <div>
                                            <div className="font-semibold text-[#C9D1D9] mb-1">DATA_RETRIEVED_SUCCESSFULLY</div>
                                            Total records: <span className="text-emerald-400 font-bold">{Array.isArray(toolInvocation.result.results) ? toolInvocation.result.results.length : 1}</span> rows
                                            {toolInvocation.result.note && ` | Warning: ${toolInvocation.result.note}`}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {toolInvocation.toolName === 'save_to_memory' && (
                                    <div className={cn("p-3.5 bg-[#0D1117] border border-[#30363D] rounded-xl text-xs flex flex-col gap-3 shadow-inner text-[#C9D1D9] font-mono overflow-hidden")}>
                                      <div className="flex items-center gap-2.5">
                                        {toolInvocation.state === 'result' ? (
                                          <div className="h-5 w-5 rounded-md bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                                            <CheckCircle2 className="h-3 w-3 text-purple-400" />
                                          </div>
                                        ) : (
                                          <div className="h-5 w-5 rounded-md bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                                            <Loader2 className="h-3 w-3 text-purple-400 animate-spin" />
                                          </div>
                                        )}
                                        <span className={toolInvocation.state === 'result' ? 'text-[#8B949E]' : 'text-purple-400 animate-pulse'}>
                                          {toolInvocation.state === 'result' ? '> long_term_memory_updated' : '> saving_to_vector_db...'}
                                        </span>
                                      </div>
                                      
                                      {toolInvocation.state === 'result' && toolInvocation.result?.success && (
                                        <div className="bg-[#161B22] border border-[#30363D] p-3 rounded-lg text-[11px] text-[#8B949E] flex items-start gap-2.5 ml-7">
                                          <Brain className="h-3.5 w-3.5 shrink-0 mt-0.5 text-purple-400" />
                                          <div>
                                            <div className="font-semibold text-[#C9D1D9] mb-1">MEMORY_COMMITTED</div>
                                            Data tersimpan secara permanen untuk referensi di masa depan.
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {toolInvocation.toolName === 'list_directory' && (
                                    <div className={cn("p-3.5 bg-[#0D1117] border border-[#30363D] rounded-xl text-xs flex flex-col gap-3 shadow-inner text-[#C9D1D9] font-mono overflow-hidden")}>
                                      <div className="flex items-center gap-2.5">
                                        {toolInvocation.state === 'result' ? (
                                          <div className="h-5 w-5 rounded-md bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 shrink-0">
                                            <CheckCircle2 className="h-3 w-3 text-yellow-400" />
                                          </div>
                                        ) : (
                                          <div className="h-5 w-5 rounded-md bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 shrink-0">
                                            <Loader2 className="h-3 w-3 text-yellow-400 animate-spin" />
                                          </div>
                                        )}
                                        <span className={toolInvocation.state === 'result' ? 'text-[#8B949E]' : 'text-yellow-400 animate-pulse'}>
                                          {toolInvocation.state === 'result' ? `> directory_scanned: ${toolInvocation.args.dirPath || '/'}` : `> scanning_directory: ${toolInvocation.args.dirPath || '/'}...`}
                                        </span>
                                      </div>
                                      
                                      {toolInvocation.state === 'result' && toolInvocation.result?.contents && (
                                        <div className="bg-[#161B22] border border-[#30363D] p-3 rounded-lg text-[11px] text-[#8B949E] flex items-start gap-2.5 ml-7">
                                          <FolderOpen className="h-3.5 w-3.5 shrink-0 mt-0.5 text-yellow-400" />
                                          <div>
                                            <div className="font-semibold text-[#C9D1D9] mb-1">DIR_CONTENTS</div>
                                            Ditemukan <span className="text-yellow-400 font-bold">{toolInvocation.result.contents.length}</span> item.
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {toolInvocation.toolName === 'read_source_code' && (
                                    <div className={cn("p-3.5 bg-[#0D1117] border border-[#30363D] rounded-xl text-xs flex flex-col gap-3 shadow-inner text-[#C9D1D9] font-mono overflow-hidden")}>
                                      <div className="flex items-center gap-2.5">
                                        {toolInvocation.state === 'result' ? (
                                          <div className="h-5 w-5 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                            <CheckCircle2 className="h-3 w-3 text-blue-400" />
                                          </div>
                                        ) : (
                                          <div className="h-5 w-5 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                            <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />
                                          </div>
                                        )}
                                        <span className={toolInvocation.state === 'result' ? 'text-[#8B949E]' : 'text-blue-400 animate-pulse'}>
                                          {toolInvocation.state === 'result' ? `> file_read: ${toolInvocation.args.filePath}` : `> reading_file: ${toolInvocation.args.filePath}...`}
                                        </span>
                                      </div>
                                      
                                      {toolInvocation.state === 'result' && toolInvocation.result?.content && (
                                        <div className="bg-[#161B22] border border-[#30363D] p-3 rounded-lg text-[11px] text-[#8B949E] flex items-start gap-2.5 ml-7">
                                          <FileCode className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-400" />
                                          <div>
                                            <div className="font-semibold text-[#C9D1D9] mb-1">FILE_CONTENTS_LOADED</div>
                                            Ukuran: <span className="text-blue-400 font-bold">{toolInvocation.result.content.length}</span> karakter.
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {toolInvocation.toolName === 'search_web' && (
                                    <div className={cn("p-3.5 bg-[#0D1117] border border-[#30363D] rounded-xl text-xs flex flex-col gap-3 shadow-inner text-[#C9D1D9] font-mono overflow-hidden")}>
                                      <div className="flex items-center gap-2.5">
                                        {toolInvocation.state === 'result' ? (
                                          <div className="h-5 w-5 rounded-md bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
                                            <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                                          </div>
                                        ) : (
                                          <div className="h-5 w-5 rounded-md bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
                                            <Loader2 className="h-3 w-3 text-cyan-400 animate-spin" />
                                          </div>
                                        )}
                                        <span className={toolInvocation.state === 'result' ? 'text-[#8B949E]' : 'text-cyan-400 animate-pulse'}>
                                          {toolInvocation.state === 'result' ? `> web_search_completed: "${toolInvocation.args.query}"` : `> searching_web_for: "${toolInvocation.args.query}"...`}
                                        </span>
                                      </div>
                                      
                                      {toolInvocation.state === 'result' && toolInvocation.result?.results && (
                                        <div className="bg-[#161B22] border border-[#30363D] p-3 rounded-lg text-[11px] text-[#8B949E] flex items-start gap-2.5 ml-7">
                                          <Globe className="h-3.5 w-3.5 shrink-0 mt-0.5 text-cyan-400" />
                                          <div>
                                            <div className="font-semibold text-[#C9D1D9] mb-1">INTERNET_RESULTS</div>
                                            Ditemukan <span className="text-cyan-400 font-bold">{toolInvocation.result.results.length}</span> sumber referensi.
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {toolInvocation.toolName === 'render_bar_chart' && toolInvocation.state === 'result' && (
                                    <Card className="mt-2 border border-border/50 bg-card/50 shadow-sm overflow-hidden">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold">{toolInvocation.args.title}</CardTitle>
                                        <CardDescription className="text-xs">{toolInvocation.args.description}</CardDescription>
                                      </CardHeader>
                                      <CardContent className="h-[250px] pt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={toolInvocation.args.data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                            <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                            <RechartsTooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </CardContent>
                                    </Card>
                                  )}

                                  {toolInvocation.toolName === 'render_pie_chart' && toolInvocation.state === 'result' && (
                                    <Card className="mt-2 border border-border/50 bg-card/50 shadow-sm overflow-hidden">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold">{toolInvocation.args.title}</CardTitle>
                                        <CardDescription className="text-xs">{toolInvocation.args.description}</CardDescription>
                                      </CardHeader>
                                      <CardContent className="h-[250px] pt-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <PieChart>
                                            <Pie data={toolInvocation.args.data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                              {toolInvocation.args.data.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                              ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                          </PieChart>
                                        </ResponsiveContainer>
                                      </CardContent>
                                    </Card>
                                  )}

                                  {toolInvocation.toolName === 'generate_marketing_image' && (
                                    <div className={cn("p-3.5 bg-[#0D1117] border border-[#30363D] rounded-xl text-xs flex flex-col gap-3 shadow-inner text-[#C9D1D9] font-mono overflow-hidden")}>
                                      <div className="flex items-center gap-2.5">
                                        {toolInvocation.state === 'result' && toolInvocation.result?.success ? (
                                          <div className="h-5 w-5 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                          </div>
                                        ) : toolInvocation.state === 'result' && toolInvocation.result?.error ? (
                                          <div className="h-5 w-5 rounded-md bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                                            <span className="text-red-400 font-bold">X</span>
                                          </div>
                                        ) : (
                                          <div className="h-5 w-5 rounded-md bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                                            <Loader2 className="h-3 w-3 text-purple-400 animate-spin" />
                                          </div>
                                        )}
                                        <span className={toolInvocation.state === 'result' ? (toolInvocation.result?.error ? 'text-red-400' : 'text-[#8B949E]') : 'text-purple-400 animate-pulse'}>
                                          {toolInvocation.state === 'result' ? (toolInvocation.result?.error ? '> execution_failed' : '> image_generation_completed') : '> generating_image_with_ai...'}
                                        </span>
                                      </div>
                                      
                                      {toolInvocation.state === 'result' && toolInvocation.result?.success && (
                                        <div className="bg-[#161B22] border border-[#30363D] p-3 rounded-lg flex flex-col items-start gap-3 ml-7">
                                          <div className="flex items-center gap-2 text-[11px] text-[#8B949E]">
                                            <ImageIcon className="h-3.5 w-3.5 text-[#8B949E]" />
                                            <span className="font-semibold text-[#C9D1D9]">IMAGE_READY</span>
                                          </div>
                                          <div className="w-full relative rounded-md overflow-hidden border border-[#30363D]">
                                            <img src={toolInvocation.result.imageUrl} alt="Generated Asset" className="w-full h-auto object-cover" />
                                          </div>
                                          <div className="flex gap-2 w-full mt-1">
                                            <Button variant="outline" size="sm" className="w-full h-8 text-xs bg-transparent border-[#30363D] text-[#C9D1D9] hover:bg-[#30363D]" onClick={() => window.open(toolInvocation.result.imageUrl, '_blank')}>
                                              View Full Size
                                            </Button>
                                          </div>
                                        </div>
                                      )}

                                      {toolInvocation.state === 'result' && toolInvocation.result?.error && (
                                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-[11px] text-red-400 ml-7">
                                          {toolInvocation.result.error}
                                        </div>
                                      )}
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
              <form onSubmit={customHandleSubmit} className="flex w-full items-center space-x-2">
                <Input 
                  value={inputValue} 
                  onChange={(e) => setInputValue(e.target.value)} 
                  placeholder="Tanyakan metrik bisnis, tenant, afiliasi, atau operasional..." 
                  className="flex-1 rounded-full bg-muted/30 focus-visible:ring-primary/20"
                  disabled={isLoading}
                />
                <Button variant="ghost" size="icon" type="submit" disabled={isLoading || !inputValue.trim()} className="rounded-full shrink-0 h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20">
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
