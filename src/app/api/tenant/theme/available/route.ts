import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const customThemes = await db.customTheme.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        author: true,
        thumbnail: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ customThemes })
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
