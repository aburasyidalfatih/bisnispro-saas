import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const logId = searchParams.get("logId")
    const url = searchParams.get("url")

    // Default fallback url jika url tidak ada atau tidak valid
    const redirectUrl = url ? decodeURIComponent(url) : process.env.NEXT_PUBLIC_APP_URL || "https://schoolpro.id"

    if (logId) {
      // Perbarui log bahwa tautan telah diklik
      await db.dripLog.updateMany({
        where: { 
          id: logId,
          isClicked: false // Hanya update jika belum pernah diklik
        },
        data: { 
          isClicked: true,
          clickedAt: new Date(),
          isOpened: true, // Asumsikan jika diklik pasti sudah dibuka (berjaga-jaga jika klien nge-block gambar)
          openedAt: new Date()
        }
      }).catch(() => {})
    }

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || "https://schoolpro.id")
  }
}
