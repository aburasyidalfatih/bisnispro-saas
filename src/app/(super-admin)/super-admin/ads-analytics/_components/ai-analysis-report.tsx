import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BrainCircuit, Sparkles, Loader2, ChevronDown, ChevronUp, FileText, Calendar } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"
import { AiReport } from "./types"

interface AiAnalysisReportProps {
  aiReports: AiReport[]
  aiGenerating: boolean
  showAiReport: string | null
  setShowAiReport: (id: string | null) => void
  handleGenerateAi: () => void
}

export function AiAnalysisReport({ aiReports, aiGenerating, showAiReport, setShowAiReport, handleGenerateAi }: AiAnalysisReportProps) {
  return (
    <Card className="glass border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-violet-500/5 via-blue-500/5 to-emerald-500/5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-violet-500" /> Analisa AI Mendalam
            </CardTitle>
            <CardDescription>AI menganalisa data Meta Ads + data internal SchoolPro untuk rekomendasi optimasi biaya.</CardDescription>
          </div>
          <Button onClick={handleGenerateAi} disabled={aiGenerating} className="rounded-xl btn-gradient text-white">
            {aiGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Menganalisa...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Analisa</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {aiReports.length === 0 ? (
          <div className="text-center py-12">
            <BrainCircuit className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium mb-1">Belum ada laporan AI</p>
            <p className="text-xs text-muted-foreground mb-4">Klik "Generate Analisa" untuk membuat laporan pertama, atau tunggu laporan otomatis setiap Senin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Report List */}
            {aiReports.map(r => (
              <div key={r.date} className={cn("border rounded-xl overflow-hidden transition-all", showAiReport === r.date && "ring-1 ring-violet-500/30")}>
                <button onClick={() => setShowAiReport(showAiReport === r.date ? null : r.date)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                      <FileText className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Laporan {new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(r.generatedAt).toLocaleString('id-ID')}
                        <span>·</span>
                        Spend: Rp {Math.round(r.dataSummary.totalSpend).toLocaleString('id-ID')}
                        <span>·</span>
                        {r.dataSummary.totalClicks} clicks
                      </p>
                    </div>
                  </div>
                  {showAiReport === r.date ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showAiReport === r.date && (
                  <div className="border-t p-4 bg-card">
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-sm prose-headings:font-bold prose-p:text-xs prose-li:text-xs prose-strong:text-foreground">
                      <ReactMarkdown>{r.analysis}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
