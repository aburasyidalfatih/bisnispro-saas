import React from"react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { Inbox, Check, ChevronDown, ChevronUp, Mail, Trash2 } from"lucide-react"
import { cn } from"@/lib/utils"
import { Submission } from"./types"
import { EmptyState } from "@/components/ui/empty-state"

interface WebsiteMessagesProps {
  submissions: Submission[]
  loadingWebsite: boolean
  unread: number
  markAllRead: () => Promise<void>
  expandedId: string | null
  toggleExpand: (id: string) => void
  deleteSubmission: (id: string) => Promise<void>
}

export function WebsiteMessages({
  submissions, loadingWebsite, unread, markAllRead, expandedId, toggleExpand, deleteSubmission
}: WebsiteMessagesProps) {
  return (
    <Card className="glass border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Inbox className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Pesan Website Publik</CardTitle>
              <CardDescription>
                {unread > 0 ? `${unread} pesan belum dibaca` :"Semua pesan sudah dibaca"}
              </CardDescription>
            </div>
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={markAllRead}>
              <Check className="h-3.5 w-3.5" /> Tandai Semua Dibaca
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loadingWebsite ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Belum Ada Pesan"
            description="Belum ada pesan dari pengunjung website"
          />
        ) : (
          <div className="space-y-2">
            {submissions.map(sub => (
              <div key={sub.id}
                className={cn("rounded-xl border transition-colors",
                  !sub.isRead ?"border-primary/30 bg-primary/5" :"border-border")}>
                <Button
                  variant="ghost"
                  onClick={() => toggleExpand(sub.id)}
                  className="flex w-full items-center justify-start gap-3 p-4 h-auto text-left font-normal hover:bg-transparent">
                  <div className={cn("h-2 w-2 rounded-full shrink-0", !sub.isRead ?"bg-primary" :"bg-transparent")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm truncate", !sub.isRead &&"font-semibold")}>{sub.name}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{sub.email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {sub.subject ? `${sub.subject}: ` :""}{sub.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(sub.createdAt).toLocaleDateString("id-ID", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                    </span>
                    {expandedId === sub.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </Button>

                {expandedId === sub.id && (
                  <div className="px-4 pb-4 border-t pt-3 space-y-3">
                    <div className="grid sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Nama</p>
                        <p className="font-medium">{sub.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <a href={`mailto:${sub.email}`} className="font-medium text-primary hover:underline">{sub.email}</a>
                      </div>
                      {sub.phone && (
                        <div>
                          <p className="text-xs text-muted-foreground">Telepon</p>
                          <a href={`tel:${sub.phone}`} className="font-medium text-primary hover:underline">{sub.phone}</a>
                        </div>
                      )}
                    </div>
                    {sub.subject && (
                      <div>
                        <p className="text-xs text-muted-foreground">Subjek</p>
                        <p className="text-sm font-medium">{sub.subject}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Pesan</p>
                      <p className="text-sm bg-muted/40 rounded-xl p-3 whitespace-pre-wrap">{sub.message}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Diterima: {new Date(sub.createdAt).toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                      </p>
                      <div className="flex gap-2">
                        <a href={`mailto:${sub.email}?subject=Re: ${sub.subject ||"Pesan Anda"}`}
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                          <Mail className="h-3.5 w-3.5" /> Balas via Email
                        </a>
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive gap-1">
                              <Trash2 className="h-3.5 w-3.5" /> Hapus
                            </Button>
                          }
                          title="Hapus pesan ini?"
                          description="Pesan akan dihapus secara permanen."
                          confirmText="Ya, hapus"
                          onConfirm={() => deleteSubmission(sub.id)}
                        />
                      </div>
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
