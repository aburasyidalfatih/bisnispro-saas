import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Palette, Download, CalendarDays, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { ThemeUploadModal } from "./_components/theme-upload-modal"
import Image from "next/image"
import { ThemeActionButtons } from "./_components/theme-action-buttons"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function SuperAdminThemesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.isSuperAdmin) redirect("/admin")

  const [dbThemes, defaultCount, modernCount, deletedThemesSetting] = await Promise.all([
    db.customTheme.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        _count: {
          select: { tenants: true }
        }
      }
    }),
    db.tenant.count({ where: { template: "default" } }),
    db.tenant.count({ where: { template: "modern" } }),
    db.platformSetting.findUnique({ where: { key: "deleted_system_themes" } }),
  ])

  let deletedThemes: string[] = []
  if (deletedThemesSetting?.value) {
    try {
      const parsed = JSON.parse(deletedThemesSetting.value)
      deletedThemes = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []
    } catch {
      deletedThemes = []
    }
  }

  const systemThemes = [
    {
      id: "sys-default",
      name: "Tema Default",
      author: "BisnisPro Official",
      version: "1.0.0",
      thumbnail: null,
      isSystem: true,
      isDeletable: false,
      createdAt: new Date("2024-01-01"),
      _count: { tenants: defaultCount },
      isActive: true
    }
  ]

  if (!deletedThemes.includes("modern")) {
    systemThemes.push({
      id: "sys-modern",
      name: "Tema Corporat",
      author: "BisnisPro Official",
      version: "1.0.0",
      thumbnail: null,
      isSystem: true,
      isDeletable: true,
      createdAt: new Date("2024-02-01"),
      _count: { tenants: modernCount },
      isActive: true
    })
  }

  // Gabungkan tema sistem dan tema kustom
  const themes = [...systemThemes, ...dbThemes.map(t => ({ ...t, isSystem: false, isDeletable: true }))]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Theme Engine</h1>
          <p className="text-muted-foreground mt-1">Kelola tema bawaan dan tema kustom berbasis Handlebars untuk perusahaan.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white" asChild>
            <Link href="/api/super-admin/themes/export?theme=sys-default" download>
              <Download className="mr-2 h-4 w-4" /> Export Template Standar
            </Link>
          </Button>
          <ThemeUploadModal />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <Card key={theme.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video relative bg-muted border-b">
              {theme.thumbnail ? (
                <Image src={theme.thumbnail} alt={theme.name} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-300">
                  <Palette className="h-12 w-12 mb-2" />
                  <span className="text-sm font-medium uppercase tracking-widest">
                    {theme.isSystem ? "Built-in Theme" : "No Preview"}
                  </span>
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                {theme.isSystem && (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground border-transparent shadow-sm">
                    System
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-black border shadow-sm">
                  v{theme.version}
                </Badge>
              </div>
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                {theme.name}
                {!theme.isDeletable && <Lock className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
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
                <span>Perusahaan Pengguna</span>
                <Badge variant="outline" className="font-bold">{theme._count.tenants}</Badge>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 pt-3 border-t flex justify-between">
              <ThemeActionButtons 
                themeId={theme.id} 
                isSystem={theme.isSystem} 
                isDeletable={theme.isDeletable}
                tenantsCount={theme._count?.tenants || 0}
                isActive={theme.isActive}
              />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
