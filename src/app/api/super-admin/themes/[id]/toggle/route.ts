import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { isActive } = await req.json()

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Status tema tidak valid" }, { status: 400 })
    }

    if (id.startsWith("sys-")) {
      return NextResponse.json({ error: "Cannot toggle system theme" }, { status: 400 })
    }

    if (!isActive) {
      const tenantsCount = await db.tenant.count({ where: { customThemeId: id } })
      if (tenantsCount > 0) {
        return NextResponse.json({ error: "Tema tidak bisa dinonaktifkan karena masih digunakan oleh sekolah." }, { status: 400 })
      }
    }

    const updated = await db.customTheme.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json({ success: true, isActive: updated.isActive })
  } catch (error: any) {
    console.error("Theme toggle error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
