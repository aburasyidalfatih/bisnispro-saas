import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const files = await db.fileUpload.findMany({
      select: { path: true, size: true }
    })

    let r2Count = 0
    let r2Size = 0
    let localCount = 0
    let localSize = 0

    files.forEach(file => {
      // S3/R2 files have a public URL starting with http
      if (file.path.startsWith("http")) {
        r2Count++
        r2Size += file.size
      } else {
        localCount++
        localSize += file.size
      }
    })

    return NextResponse.json({
      r2Count,
      r2Size,
      localCount,
      localSize,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
