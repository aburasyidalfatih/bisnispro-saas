import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { exportTheme } from "@/features/themes/services/export.service"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const themeId = searchParams.get("theme")
    
    if (!themeId) {
      return NextResponse.json({ error: "Theme ID is required" }, { status: 400 })
    }

    const { buffer, filename } = await exportTheme(themeId)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      }
    })

  } catch (error: any) {
    console.error("Theme export error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: error.message === "Tema tidak ditemukan" ? 404 : 500 })
  }
}
