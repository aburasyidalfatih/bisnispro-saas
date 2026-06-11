"use client"

import { useState, useEffect } from"react"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Label } from"@/components/ui/label"
import { Switch } from"@/components/ui/switch"
import { useToast } from"@/hooks/use-toast"
import { Plus, Trash2, Edit, Loader2, ArrowUp, ArrowDown, ChevronRight } from"lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from"@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"

interface MenuItem {
  id: string
  label: string
  url: string
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
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  
  const [formData, setFormData] = useState({
    label:"",
    url:"",
    isActive: true,
    parentId:"root"
  })

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      // Tambahkan cache: 'no-store' agar tidak membaca dari browser/Next.js cache
      const res = await fetch("/api/admin/website/menu", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setMenus(data)
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
        isActive: menu.isActive,
        parentId: menu.parentId ||"root"
      })
    } else {
      setEditingMenu(null)
      setFormData({
        label:"",
        url:"/",
        isActive: true,
        parentId: parentId ||"root"
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.label || !formData.url) {
      toast({ title:"Validasi Gagal", description:"Label dan URL wajib diisi.", variant:"destructive" })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        ...formData,
        parentId: formData.parentId ==="root" ? null : formData.parentId
      }
      
      const method = editingMenu ?"PATCH" :"POST"
      const url = editingMenu ? `/api/admin/website/menu/${editingMenu.id}` :"/api/admin/website/menu"
      
      const res = await fetch(url, {
        method,
        headers: {"Content-Type":"application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast({ title:"Berhasil", description:"Menu berhasil disimpan." })
        setIsModalOpen(false)
        fetchMenus()
      } else {
        const err = await res.json()
        toast({ title:"Gagal", description: err.error ||"Gagal menyimpan menu.", variant:"destructive" })
      }
    } catch (e) {
      toast({ title:"Gagal", description:"Terjadi kesalahan koneksi.", variant:"destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, isSystem: boolean) => {
    if (isSystem) {
      toast({ title:"Ditolak", description:"Menu sistem tidak bisa dihapus.", variant:"destructive" })
      return
    }
    
    if (confirm("Yakin ingin menghapus menu ini beserta sub-menunya?")) {
      try {
        const res = await fetch(`/api/admin/website/menu/${id}`, { method:"DELETE" })
        if (res.ok) {
          toast({ title:"Terhapus", description:"Menu berhasil dihapus." })
          fetchMenus()
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleMove = async (item: MenuItem, direction:"up" |"down", list: MenuItem[]) => {
    const currentIndex = list.findIndex(m => m.id === item.id)
    if (direction ==="up" && currentIndex === 0) return
    if (direction ==="down" && currentIndex === list.length - 1) return

    const newIndex = direction ==="up" ? currentIndex - 1 : currentIndex + 1
    const newList = [...list]
    
    // Swap order property
    const tempOrder = newList[currentIndex].order
    newList[currentIndex].order = newList[newIndex].order
    newList[newIndex].order = tempOrder
    
    // Swap position in array
    const temp = newList[currentIndex]
    newList[currentIndex] = newList[newIndex]
    newList[newIndex] = temp

    // Update state optimistically
    if (item.parentId) {
      // Update child list
      const updateChildren = (menus: MenuItem[]): MenuItem[] => {
        return menus.map(m => {
          if (m.id === item.parentId) {
            return { ...m, children: newList }
          }
          if (m.children) {
            return { ...m, children: updateChildren(m.children) }
          }
          return m
        })
      }
      setMenus(updateChildren(menus))
    } else {
      setMenus(newList)
    }

    // Persist to DB
    const updates = newList.map((m, idx) => ({
      id: m.id,
      order: idx, // Ensure sequential order
      parentId: item.parentId || null
    }))
    
    fetch("/api/admin/website/menu/reorder", {
      method:"POST",
      headers: {"Content-Type":"application/json" },
      body: JSON.stringify({ items: updates })
    })
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  const renderMenuList = (items: MenuItem[], level = 0) => {
    return items.map((menu, index) => (
      <div key={menu.id} className="w-full">
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 px-4 rounded-xl border bg-card mb-2 hover:border-primary/50 transition-colors ${level > 0 ? 'ml-8 relative before:content-[""] before:absolute before:-left-4 before:top-1/2 before:-translate-y-1/2 before:w-3 before:h-px before:bg-border' : ''}`}>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {level === 0 && (
              <div className="flex flex-col gap-0.5 mr-2">
                <Button 
                  variant="ghost" size="icon"
                  onClick={() => handleMove(menu,"up", items)}
                  disabled={index === 0}
                  className="h-6 w-6 rounded-md text-muted-foreground hover:text-primary disabled:opacity-30"
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" size="icon"
                  onClick={() => handleMove(menu,"down", items)}
                  disabled={index === items.length - 1}
                  className="h-6 w-6 rounded-md text-muted-foreground hover:text-primary disabled:opacity-30"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex flex-col">
              <span className="font-semibold text-sm flex items-center gap-2">
                {menu.label}
                {!menu.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Sembunyi</span>}
                {menu.isSystem && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Bawaan</span>}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{menu.url}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
            {level === 0 && (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleOpenModal(undefined, menu.id)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Submenu
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleOpenModal(menu)}>
              <Edit className="h-4 w-4" />
            </Button>
            {!menu.isSystem && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(menu.id, menu.isSystem)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Render children recursively */}
        {menu.children && menu.children.length > 0 && (
          <div className="w-full">
            {renderMenuList(menu.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground hidden sm:block">Seret ke atas/bawah untuk mengubah urutan (Tingkat Utama).</p>
        <Button onClick={() => handleOpenModal()} size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Tambah Menu Utama
        </Button>
      </div>

      <div className="flex flex-col w-full">
        {menus.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
            <p className="text-muted-foreground text-sm">Belum ada menu navigasi.</p>
          </div>
        ) : (
          renderMenuList(menus)
        )}
      </div>

      {/* Modal Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMenu ?"Edit Menu" :"Tambah Menu"}</DialogTitle>
            <DialogDescription>
              Atur label dan tautan yang dituju saat menu ini diklik.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Menu / Label</Label>
              <Input 
                placeholder="Contoh: Profil Sekolah" 
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
                disabled={editingMenu?.isSystem && editingMenu?.url ==="/"}
              />
              <p className="text-xs text-muted-foreground">Gunakan"/" untuk beranda, atau awali dengan"/" untuk halaman internal (contoh: /fasilitas).</p>
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
