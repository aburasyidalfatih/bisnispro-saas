import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const logId = searchParams.get("logId")

    if (logId) {
      // Perbarui log bahwa email telah dibuka
      await db.dripLog.updateMany({
        where: { 
          id: logId,
          isOpened: false // Hanya update jika belum pernah dibuka untuk mencatat waktu pertama kali
        },
        data: { 
          isOpened: true,
          openedAt: new Date()
        }
      }).catch(() => {}) // Abaikan error jika logId tidak valid
    }

    // Kembalikan gambar transparan 1x1 pixel (GIF)
    const pixel = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")
    
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch (error) {
    // Selalu kembalikan 200 dengan pixel kosong agar tidak memunculkan gambar rusak di email
    const pixel = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")
    return new NextResponse(pixel, { headers: { "Content-Type": "image/gif" } })
  }
}
