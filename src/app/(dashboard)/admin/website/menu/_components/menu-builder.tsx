"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Edit, Loader2, ArrowUp, ArrowDown, MoveRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPicker } from "@/components/ui/icon-picker"

interface MenuItem {
  id: string
  label: string
  url: string
  icon?: string | null
  order: number
  isActive: boolean
  isSystem: boolean
  parentId: string | null
  children?: MenuItem[]
}

export function MenuBuilder() {
  const { toast } = useToast()
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showLoginButton, setShowLoginButton] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  
  const [formData, setFormData] = useState({
    label: "",
    url: "",
    icon: "none",
    isActive: true,
    parentId: "root"
  })

  useEffect(() => {
    fetchMenus()
  }, [])

  // Fix radix UI body lock bug
  useEffect(() => {
    if (!isModalOpen) {
      setTimeout(() => {
        document.body.style.pointerEvents = ""
      }, 100)
    }
  }, [isModalOpen])

  const fetchMenus = async () => {
    try {
      const res = await fetch("/api/admin/website/menu", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setMenus(data.menus || data)
        if (data.settings && data.settings.showLoginButton !== undefined) {
          setShowLoginButton(data.settings.showLoginButton)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (menu?: MenuItem, parentId?: string) => {
    if (menu) {
      setEditingMenu(menu)
      setFormData({
        label: menu.label,
        url: menu.url,
        icon: menu.icon || "none",
        isActive: menu.isActive,
        parentId: menu.parentId || "root"
      })
    } else {
      setEditingMenu(null)
      setFormData({
        label: "",
        url: "/",
        icon: "none",
        isActive: true,
        parentId: parentId || "root"
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.label || !formData.url) {
      toast({ title: "Validasi Gagal", description: "Label dan URL wajib diisi.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        ...formData,
        icon: formData.icon === "none" ? null : formData.icon,
        parentId: formData.parentId === "root" ? null : formData.parentId
      }
      
      const method = editingMenu ? "PATCH" : "POST"
      const url = editingMenu ? `/api/admin/website/menu/${editingMenu.id}` : "/api/admin/website/menu"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast({ title: "Berhasil", description: "Menu berhasil disimpan." })
        setIsModalOpen(false)
        fetchMenus()
      } else {
        const err = await res.json()
        toast({ title: "Gagal", description: err.error || "Gagal menyimpan menu.", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Gagal", description: "Terjadi kesalahan koneksi.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, isSystem: boolean) => {
    if (confirm("Yakin ingin menghapus menu ini beserta sub-menunya?")) {
      try {
        const res = await fetch(`/api/admin/website/menu/${id}`, { method: "DELETE" })
        if (res.ok) {
          toast({ title: "Terhapus", description: "Menu berhasil dihapus." })
          fetchMenus()
        } else {
          const err = await res.json()
          toast({ title: "Gagal", description: err.error || "Gagal menghapus menu.", variant: "destructive" })
        }
      } catch (e) {
        toast({ title: "Gagal", description: "Terjadi kesalahan koneksi.", variant: "destructive" })
      }
    }
  }

  const handleMoveRoot = async (currentIndex: number, direction: "up" | "down") => {
    if (direction === "up" && currentIndex === 0) return
    if (direction === "down" && currentIndex === menus.length - 1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    const newList = [...menus]
    
    const tempOrder = newList[currentIndex].order
    newList[currentIndex].order = newList[newIndex].order
    newList[newIndex].order = tempOrder
    
    const temp = newList[currentIndex]
    newList[currentIndex] = newList[newIndex]
    newList[newIndex] = temp

    setMenus(newList)

    const updates = newList.map((m, idx) => ({
      id: m.id,
      order: idx,
      parentId: null
    }))
    
    fetch("/api/admin/website/menu/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: updates })
    })
  }

  const handleMoveChild = async (parentId: string, childIndex: number, direction: "up" | "down") => {
    const parentMenu = menus.find(m => m.id === parentId)
    if (!parentMenu || !parentMenu.children) return
    
    const childrenList = [...parentMenu.children]
    if (direction === "up" && childIndex === 0) return
    if (direction === "down" && childIndex === childrenList.length - 1) return

    const newIndex = direction === "up" ? childIndex - 1 : childIndex + 1
    
    const tempOrder = childrenList[childIndex].order
    childrenList[childIndex].order = childrenList[newIndex].order
    childrenList[newIndex].order = tempOrder
    
    const temp = childrenList[childIndex]
    childrenList[childIndex] = childrenList[newIndex]
    childrenList[newIndex] = temp

    const updatedMenus = menus.map(m => m.id === parentId ? { ...m, children: childrenList } : m)
    setMenus(updatedMenus)

    const updates = childrenList.map((m, idx) => ({
      id: m.id,
      order: idx,
      parentId: parentId
    }))
    
    fetch("/api/admin/website/menu/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: updates })
    })
  }

  const handleToggleLoginButton = async (checked: boolean) => {
    setShowLoginButton(checked)
    try {
      const res = await fetch("/api/admin/website/menu/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showLoginButton: checked })
      })
      if (!res.ok) throw new Error("Gagal menyimpan pengaturan")
      toast({ title: "Berhasil", description: "Pengaturan tombol login disimpan." })
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" })
      setShowLoginButton(!checked) // revert
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border">
        <div>
          <h3 className="font-semibold text-sm">Tampilkan Tombol Login</h3>
          <p className="text-xs text-muted-foreground mt-1">Tampilkan tombol masuk ke dasbor di header website publik.</p>
        </div>
        <Switch checked={showLoginButton} onCheckedChange={handleToggleLoginButton} />
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Struktur Menu</h2>
        <Button onClick={() => handleOpenModal()} className="rounded-xl" size="sm">
          <Plus className="h-4 w-4 mr-2" /> Tambah Menu
        </Button>
      </div>

      <div className="flex flex-col w-full space-y-3">
        {menus.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
            <p className="text-muted-foreground text-sm">Belum ada menu navigasi.</p>
          </div>
        ) : (
          menus.map((menu, rootIdx) => (
            <div key={menu.id} className="w-full border rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 px-4 bg-slate-50 border-b">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex flex-col gap-0.5 mr-2">
                    <Button 
                      variant="ghost" size="icon"
                      onClick={() => handleMoveRoot(rootIdx, "up")}
                      disabled={rootIdx === 0}
                      className="h-6 w-6 rounded-md text-slate-400 hover:text-slate-800 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" size="icon"
                      onClick={() => handleMoveRoot(rootIdx, "down")}
                      disabled={rootIdx === menus.length - 1}
                      className="h-6 w-6 rounded-md text-slate-400 hover:text-slate-800 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-semibold text-sm flex items-center gap-2 text-slate-900">
                      {menu.label}
                      {!menu.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Sembunyi</span>}
                      {menu.isSystem && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Bawaan</span>}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{menu.url}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                  <Button variant="outline" size="sm" className="h-8 text-xs bg-white" onClick={() => handleOpenModal(undefined, menu.id)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Submenu
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => handleOpenModal(menu)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={() => handleDelete(menu.id, menu.isSystem)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {menu.children && menu.children.length > 0 && (
                <div className="bg-white px-4 py-2 flex flex-col gap-1">
                  {menu.children.map((child, childIdx) => (
                    <div key={child.id} className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-lg group transition-colors">
                      <div className="flex items-center gap-3">
                        <MoveRight className="h-4 w-4 text-slate-300" />
                        
                        <div className="flex flex-col gap-0 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" size="icon"
                            onClick={() => handleMoveChild(menu.id, childIdx, "up")}
                            disabled={childIdx === 0}
                            className="h-5 w-5 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" size="icon"
                            onClick={() => handleMoveChild(menu.id, childIdx, "down")}
                            disabled={childIdx === menu.children!.length - 1}
                            className="h-5 w-5 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            {child.label}
                            {!child.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Sembunyi</span>}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{child.url}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={() => handleOpenModal(child, menu.id)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={() => handleDelete(child.id, child.isSystem)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMenu ? "Edit Menu" : "Tambah Menu"}</DialogTitle>
            <DialogDescription>
              Atur label dan tautan yang dituju saat menu ini diklik.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Menu / Label</Label>
              <Input 
                placeholder="Contoh: Profil Perusahaan" 
                value={formData.label}
                onChange={e => setFormData({...formData, label: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>URL Tujuan</Label>
              <Input 
                placeholder="Contoh: /profil atau https://google.com" 
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
                disabled={editingMenu?.isSystem && editingMenu?.url === "/"}
              />
              <p className="text-xs text-muted-foreground">Gunakan "/" untuk beranda, atau awali dengan "/" untuk halaman internal (contoh: /aset).</p>
            </div>

            <div className="space-y-2">
              <Label>Induk Menu (Parent)</Label>
              <Select 
                value={formData.parentId}
                onValueChange={v => setFormData({...formData, parentId: v})}
                disabled={!!editingMenu?.children?.length || (editingMenu?.isSystem && !editingMenu.parentId)}
              >
                <SelectTrigger className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <SelectValue placeholder="Pilih Induk Menu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">-- Menu Utama (Root) --</SelectItem>
                  {menus.filter(m => m.id !== editingMenu?.id).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ikon Menu (Opsional)</Label>
              <IconPicker 
                value={formData.icon} 
                onChange={(v) => setFormData({...formData, icon: v})} 
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 mt-2">
              <div className="space-y-0.5">
                <Label>Status Aktif</Label>
                <p className="text-xs text-muted-foreground">Tampilkan menu ini di publik</p>
              </div>
              <Switch 
                checked={formData.isActive}
                onCheckedChange={v => setFormData({...formData, isActive: v})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
