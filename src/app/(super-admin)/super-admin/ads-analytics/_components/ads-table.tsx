import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Layers, ChevronUp, ChevronDown, PencilLine, Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { MetaData } from "./types"
import { EmptyState } from "@/components/ui/empty-state"

interface AdsTableProps {
  metaData: MetaData
  actionLoading: string | null
  handleAction: (campaignId: string, action: 'pause' | 'resume', name: string) => void
  handleUpdateBudget: (campaignId: string, name: string, newBudget: string) => void
  fmtRp: (v: number) => string
  fmtNum: (v: number) => string
}

export function AdsTable({ metaData, actionLoading, handleAction, handleUpdateBudget, fmtRp, fmtNum }: AdsTableProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('campaigns')
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null)
  const [newBudget, setNewBudget] = useState('')

  const toggleSection = (s: string) => setExpandedSection(expandedSection === s ? null : s)

  const submitBudget = (c: any) => {
    handleUpdateBudget(c.id, c.name, newBudget)
    setEditBudgetId(null)
    setNewBudget('')
  }

  return (
    <Card className="glass border-0">
      <CardHeader className="cursor-pointer" onClick={() => toggleSection('campaigns')}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" /> Kampanye ({metaData.campaigns.length})
          </CardTitle>
          {expandedSection === 'campaigns' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>
      {expandedSection === 'campaigns' && (
        <CardContent>
          {metaData.campaigns.length === 0 ? (
            <EmptyState icon={Layers} title="Belum Ada Kampanye" description="Tidak ada kampanye." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/30">
                    <TableHead className="px-2 py-2 text-left font-bold text-muted-foreground uppercase">Kampanye</TableHead>
                    <TableHead className="px-2 py-2 text-center font-bold text-muted-foreground uppercase">Status</TableHead>
                    <TableHead className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">Budget/Hari</TableHead>
                    <TableHead className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">Spend</TableHead>
                    <TableHead className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">Impr.</TableHead>
                    <TableHead className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">Clicks</TableHead>
                    <TableHead className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">CPC</TableHead>
                    <TableHead className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">CTR</TableHead>
                    <TableHead className="px-2 py-2 text-right font-bold text-muted-foreground uppercase">Leads</TableHead>
                    <TableHead className="px-2 py-2 text-center font-bold text-muted-foreground uppercase">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metaData.campaigns.map(c => (
                    <TableRow key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <TableCell className="px-2 py-2">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-[9px] text-muted-foreground capitalize">{c.objective?.replace(/_/g, ' ').toLowerCase()}</p>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-center">
                        <Badge variant="outline" className={cn("text-[9px]",
                          c.status === 'ACTIVE' && 'bg-emerald-50 text-emerald-600 border-emerald-200',
                          c.status === 'PAUSED' && 'bg-amber-50 text-amber-600 border-amber-200',
                          !['ACTIVE','PAUSED'].includes(c.status) && 'bg-gray-50 text-gray-500 border-gray-200',
                        )}>{c.status === 'ACTIVE' ? 'Aktif' : c.status === 'PAUSED' ? 'Jeda' : c.status}</Badge>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        {editBudgetId === c.id ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)}
                              className="h-7 w-24 rounded-lg text-xs" placeholder="Budget" />
                            <Button size="sm" className="h-7 px-2 rounded-lg text-[10px]"
                              onClick={() => submitBudget(c)}
                              disabled={actionLoading === c.id}>
                              {actionLoading === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'OK'}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-1 rounded-lg text-[10px]"
                              onClick={() => setEditBudgetId(null)}>✕</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-end">
                            <span>{c.dailyBudget > 0 ? fmtRp(c.dailyBudget) : '-'}</span>
                            {c.status === 'ACTIVE' && (
                              <Button size="icon" variant="ghost" onClick={() => { setEditBudgetId(c.id); setNewBudget(c.dailyBudget.toString()) }}
                                className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <PencilLine className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right font-bold text-rose-600">{c.spend > 0 ? fmtRp(c.spend) : '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-right">{c.impressions > 0 ? fmtNum(c.impressions) : '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-right font-semibold">{c.clicks > 0 ? fmtNum(c.clicks) : '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-right">{c.cpc > 0 ? fmtRp(c.cpc) : '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-right">{c.ctr > 0 ? `${c.ctr.toFixed(2)}%` : '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-right font-bold text-emerald-600">{c.leads > 0 ? c.leads : '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-center">
                        {(c.status === 'ACTIVE' || c.status === 'PAUSED') && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg"
                            onClick={() => handleAction(c.id, c.status === 'ACTIVE' ? 'pause' : 'resume', c.name)}
                            disabled={actionLoading === c.id}>
                            {actionLoading === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                              c.status === 'ACTIVE' ? <Pause className="h-3.5 w-3.5 text-amber-500" /> : <Play className="h-3.5 w-3.5 text-emerald-500" />}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Mobile campaign cards */}
              <div className="md:hidden divide-y divide-border/40">
                {metaData.campaigns.map(c => (
                  <div key={c.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{c.name}</p>
                        <p className="text-[9px] text-muted-foreground capitalize">{c.objective?.replace(/_/g, ' ').toLowerCase()}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={cn("text-[9px]",
                          c.status === 'ACTIVE' && 'bg-emerald-50 text-emerald-600 border-emerald-200',
                          c.status === 'PAUSED' && 'bg-amber-50 text-amber-600 border-amber-200',
                          !['ACTIVE','PAUSED'].includes(c.status) && 'bg-gray-50 text-gray-500 border-gray-200',
                        )}>{c.status === 'ACTIVE' ? 'Aktif' : c.status === 'PAUSED' ? 'Jeda' : c.status}</Badge>
                        {(c.status === 'ACTIVE' || c.status === 'PAUSED') && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg"
                            onClick={() => handleAction(c.id, c.status === 'ACTIVE' ? 'pause' : 'resume', c.name)}
                            disabled={actionLoading === c.id}>
                            {actionLoading === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                              c.status === 'ACTIVE' ? <Pause className="h-3.5 w-3.5 text-amber-500" /> : <Play className="h-3.5 w-3.5 text-emerald-500" />}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-muted-foreground block text-[9px]">Spend</span><span className="font-bold text-rose-600">{c.spend > 0 ? fmtRp(c.spend) : '-'}</span></div>
                      <div><span className="text-muted-foreground block text-[9px]">Clicks</span><span className="font-bold">{c.clicks > 0 ? fmtNum(c.clicks) : '-'}</span></div>
                      <div><span className="text-muted-foreground block text-[9px]">CTR</span><span className="font-bold">{c.ctr > 0 ? `${c.ctr.toFixed(2)}%` : '-'}</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-muted-foreground block text-[9px]">CPC</span><span>{c.cpc > 0 ? fmtRp(c.cpc) : '-'}</span></div>
                      <div><span className="text-muted-foreground block text-[9px]">Leads</span><span className="font-bold text-emerald-600">{c.leads > 0 ? c.leads : '-'}</span></div>
                      <div><span className="text-muted-foreground block text-[9px]">Budget</span><span>{c.dailyBudget > 0 ? fmtRp(c.dailyBudget) : '-'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
