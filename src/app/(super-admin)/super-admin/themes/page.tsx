import { db } from "@/lib/db"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Palette, Download, Trash2, CalendarDays } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { ThemeUploadModal } from "./_components/theme-upload-modal"
import Image from "next/image"

export default async function SuperAdminThemesPage() {
  const themes = await db.customTheme.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { tenants: true }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Theme Engine" 
          description="Kelola tema kustom berbasis Handlebars untuk sekolah." 
        />
        <ThemeUploadModal />
      </div>

      {themes.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Palette className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Belum ada Tema Kustom</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Platform saat ini menggunakan tema bawaan React (Aurora, Modern, Default). Upload file .zip dari freelancer untuk menambahkan tema kustom baru.
            </p>
            <ThemeUploadModal trigger={<Button><Plus className="mr-2 h-4 w-4" /> Upload Tema Pertama</Button>} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <Card key={theme.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative bg-muted border-b">
                {theme.thumbnail ? (
                  <Image src={theme.thumbnail} alt={theme.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-300">
                    <Palette className="h-12 w-12 mb-2" />
                    <span className="text-sm font-medium uppercase tracking-widest">No Preview</span>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-black border shadow-sm">
                    v{theme.version}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-3">
                <CardTitle>{theme.name}</CardTitle>
                <CardDescription>
                  {theme.author ? `by ${theme.author}` : "Developer Tidak Diketahui"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Diupload</span>
                  <span>{format(theme.createdAt, "dd MMM yyyy", { locale: id })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sekolah Pengguna</span>
                  <Badge variant="outline" className="font-bold">{theme._count.tenants}</Badge>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 pt-3 border-t flex justify-between">
                <Button variant="outline" size="sm" className="text-xs">
                  <Download className="h-3 w-3 mr-1.5" /> Download ZIP
                </Button>
                <Button variant="destructive" size="sm" className="text-xs" disabled={theme._count.tenants > 0}>
                  <Trash2 className="h-3 w-3 mr-1.5" /> Hapus
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
