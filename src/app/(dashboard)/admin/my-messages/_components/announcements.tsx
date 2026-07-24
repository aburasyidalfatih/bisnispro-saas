import React from"react"
import DOMPurify from"isomorphic-dompurify"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { ConfirmDialog } from"@/components/shared/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from"@/components/ui/dialog"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { MessageSquare, Plus, Loader2, Pencil, Trash2 } from"lucide-react"
import { format } from"date-fns"
import { id as localeId } from"date-fns/locale"
import { Textarea } from "@/components/ui/textarea"

interface AnnouncementsProps {
  announcements: any[]
  loadingAnnouncements: boolean
  showAddModal: boolean
  setShowAddModal: (show: boolean) => void
  addForm: { title: string; content: string; target: string }
  setAddForm: React.Dispatch<React.SetStateAction<{ title: string; content: string; target: string }>>
  submitAnnouncement: () => Promise<void>
  submittingAnnounce: boolean
  showEditModal: boolean
  setShowEditModal: (show: boolean) => void
  editForm: { id: string; title: string; content: string; target: string }
  setEditForm: React.Dispatch<React.SetStateAction<{ id: string; title: string; content: string; target: string }>>
  submitEditAnnouncement: () => Promise<void>
  submittingEdit: boolean
  openEditModal: (post: any) => void
  deleteAnnouncement: (id: string) => Promise<void>
}

export function Announcements({
  announcements, loadingAnnouncements, showAddModal, setShowAddModal,
  addForm, setAddForm, submitAnnouncement, submittingAnnounce,
  showEditModal, setShowEditModal, editForm, setEditForm,
  submitEditAnnouncement, submittingEdit, openEditModal, deleteAnnouncement
}: AnnouncementsProps) {
  return (
    <Card className="glass border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Papan Pengumuman</CardTitle>
              <CardDescription>
                Pesan siaran untuk dibaca oleh target civitas akademika
              </CardDescription>
            </div>
          </div>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 rounded-xl">
                <Plus className="h-4 w-4" /> Tambah Pengumuman
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Pengumuman Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tujuan Pengumuman</Label>
                  <Select 
                    value={addForm.target} 
                    onValueChange={v => setAddForm(p => ({...p, target: v}))}
                  >
                    <SelectTrigger className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <SelectValue placeholder="Pilih Tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENGUMUMAN_SEMUA">Semua Civitas (GTK, Ortu, Klien)</SelectItem>
                      <SelectItem value="PENGUMUMAN_GTK">Khusus Staf & Staf (GTK)</SelectItem>
                      <SelectItem value="PENGUMUMAN_ORTU">Khusus Orangtua Wali</SelectItem>
                      <SelectItem value="PENGUMUMAN_SISWA">Khusus Klien</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Judul Pengumuman</Label>
                  <Input value={addForm.title} onChange={e => setAddForm(p => ({...p, title: e.target.value}))} placeholder="Contoh: Libur Nasional..." />
                </div>
                <div className="space-y-2">
                  <Label>Isi Pengumuman</Label>
                  <Textarea 
                    value={addForm.content} 
                    onChange={e => setAddForm(p => ({...p, content: e.target.value}))}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Tulis detail pengumuman..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Batal</Button>
                <Button onClick={submitAnnouncement} disabled={submittingAnnounce}>
                  {submittingAnnounce ?"Menyimpan..." :"Terbitkan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Pengumuman</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tujuan Pengumuman</Label>
                  <Select 
                    value={editForm.target} 
                    onValueChange={v => setEditForm(p => ({...p, target: v}))}
                  >
                    <SelectTrigger className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <SelectValue placeholder="Pilih Tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENGUMUMAN_SEMUA">Semua Civitas (GTK, Ortu, Klien)</SelectItem>
                      <SelectItem value="PENGUMUMAN_GTK">Khusus Staf & Staf (GTK)</SelectItem>
                      <SelectItem value="PENGUMUMAN_ORTU">Khusus Orangtua Wali</SelectItem>
                      <SelectItem value="PENGUMUMAN_SISWA">Khusus Klien</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Judul Pengumuman</Label>
                  <Input value={editForm.title} onChange={e => setEditForm(p => ({...p, title: e.target.value}))} placeholder="Contoh: Libur Nasional..." />
                </div>
                <div className="space-y-2">
                  <Label>Isi Pengumuman</Label>
                  <Textarea 
                    value={editForm.content} 
                    onChange={e => setEditForm(p => ({...p, content: e.target.value}))}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Tulis detail pengumuman..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditModal(false)}>Batal</Button>
                <Button onClick={submitEditAnnouncement} disabled={submittingEdit}>
                  {submittingEdit ?"Menyimpan..." :"Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loadingAnnouncements ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Belum ada pengumuman yang diterbitkan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((post) => (
              <div key={post.id} className="p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {post.author?.name?.charAt(0) ||"A"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{post.author?.name ||"Admin Perusahaan"}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(post.createdAt),"dd MMM yyyy, HH:mm", { locale: localeId })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {post.type ==="PENGUMUMAN_SEMUA" ?"TARGET: SEMUA" :
                       post.type ==="PENGUMUMAN_GTK" ?"TARGET: GTK" :
                       post.type ==="PENGUMUMAN_ORTU" ?"TARGET: ORANGTUA" :
                       post.type ==="PENGUMUMAN_SISWA" ?"TARGET: SISWA" :"PENGUMUMAN"}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditModal(post)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                      title="Hapus pengumuman ini?"
                      description="Pengumuman akan dihapus secara permanen dari sistem."
                      confirmText="Ya, hapus"
                      onConfirm={() => deleteAnnouncement(post.id)}
                    />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2 mt-3 text-primary">{post.title}</h3>
                <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content ||"", { ADD_TAGS: ["iframe", "video", "source"], ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "controls"] }) }} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
