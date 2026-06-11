import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

function parseDeletedSystemThemes(value?: string | null) {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const isSystem = Boolean(body?.isSystem)

    if (id.startsWith("sys-")) {
      if (!isSystem) {
        return NextResponse.json({ error: "Invalid system theme request" }, { status: 400 })
      }

      const themeName = id.replace("sys-", "")
      if (themeName === "default") {
        return NextResponse.json({ error: "Tema default sistem tidak bisa dihapus." }, { status: 400 })
      }

      if (themeName !== "modern") {
        return NextResponse.json({ error: "Tema sistem tidak ditemukan." }, { status: 404 })
      }

      const tenantsCount = await db.tenant.count({ where: { template: themeName } })
      if (tenantsCount > 0) {
        return NextResponse.json({ error: "Tema sistem tidak bisa dihapus karena masih digunakan oleh sekolah." }, { status: 400 })
      }

      const setting = await db.platformSetting.findUnique({ where: { key: "deleted_system_themes" } })
      const deletedThemes = parseDeletedSystemThemes(setting?.value)
      
      if (!deletedThemes.includes(themeName)) {
        deletedThemes.push(themeName)
      }

      await db.platformSetting.upsert({
        where: { key: "deleted_system_themes" },
        update: { value: JSON.stringify(deletedThemes) },
        create: { key: "deleted_system_themes", value: JSON.stringify(deletedThemes) }
      })
      
      return NextResponse.json({ success: true })
    }

    if (isSystem) {
      return NextResponse.json({ error: "Invalid custom theme request" }, { status: 400 })
    }

    // Cek apakah masih digunakan oleh tenant
    const tenantsCount = await db.tenant.count({ where: { customThemeId: id } })
    if (tenantsCount > 0) {
      return NextResponse.json({ error: "Tema tidak bisa dihapus karena masih digunakan oleh sekolah." }, { status: 400 })
    }

    await db.customTheme.delete({ where: { id } })
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Delete theme error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
