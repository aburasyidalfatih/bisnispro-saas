import React from"react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from"@/components/ui/dialog"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { Users, Plus, Loader2, MessageSquare } from"lucide-react"
import { format } from"date-fns"
import { id } from"date-fns/locale"
import { Message } from"./types"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"

interface InternalMessagesProps {
  messages: Message[]
  loadingInternal: boolean
  showComposeModal: boolean
  setShowComposeModal: (show: boolean) => void
  composeForm: { receiverId: string; subject: string; body: string }
  setComposeForm: React.Dispatch<React.SetStateAction<{ receiverId: string; subject: string; body: string }>>
  loadingUsers: boolean
  tenantUsers: any[]
  submitComposeMessage: () => Promise<void>
  submittingCompose: boolean
}

export function InternalMessages({
  messages,
  loadingInternal,
  showComposeModal,
  setShowComposeModal,
  composeForm,
  setComposeForm,
  loadingUsers,
  tenantUsers,
  submitComposeMessage,
  submittingCompose
}: InternalMessagesProps) {
  return (
    <Card className="glass border-0 min-h-[400px]">
      <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Pesan Internal</CardTitle>
            <CardDescription>Komunikasi antar guru dan staf</CardDescription>
          </div>
        </div>
        <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" /> Tulis Pesan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tulis Pesan Internal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Kirim Ke</Label>
                <Select 
                  value={composeForm.receiverId} 
                  onValueChange={v => setComposeForm(p => ({...p, receiverId: v}))}
                  disabled={loadingUsers}
                >
                  <SelectTrigger className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <SelectValue placeholder="-- Pilih Penerima --" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subjek (Opsional)</Label>
                <Input value={composeForm.subject} onChange={e => setComposeForm(p => ({...p, subject: e.target.value}))} placeholder="Contoh: Rapat Koordinasi" />
              </div>
              <div className="space-y-2">
                <Label>Pesan</Label>
                <Textarea 
                  value={composeForm.body} 
                  onChange={e => setComposeForm(p => ({...p, body: e.target.value}))}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Tulis pesan..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowComposeModal(false)}>Batal</Button>
              <Button onClick={submitComposeMessage} disabled={submittingCompose}>
                {submittingCompose ?"Mengirim..." :"Kirim Pesan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {loadingInternal ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState 
              icon={MessageSquare} 
              title="Kotak masuk kosong" 
              description="Belum ada pesan internal dari staf atau guru lainnya." 
              className="py-12 border-0 bg-transparent"
            />
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {msg.sender.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {msg.sender.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(msg.createdAt),"dd MMM yyyy, HH:mm", { locale: id })}
                      </p>
                    </div>
                  </div>
                </div>
                {msg.subject && (
                  <p className="font-semibold text-sm mb-1 mt-3">{msg.subject}</p>
                )}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
