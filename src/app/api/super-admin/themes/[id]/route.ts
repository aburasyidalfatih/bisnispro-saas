import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { isSystem } = await request.json()

    if (isSystem) {
      // Dapatkan setting lama
      const setting = await db.platformSetting.findUnique({ where: { key: "deleted_system_themes" } })
      let deletedThemes = setting ? JSON.parse(setting.value) : []
      
      const themeName = id.replace("sys-", "")
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
