import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    // Use aggregate queries instead of loading all files into memory
    const [r2Stats, localStats] = await Promise.all([
      db.fileUpload.aggregate({
        where: { path: { startsWith: "http" } },
        _count: true,
        _sum: { size: true },
      }),
      db.fileUpload.aggregate({
        where: { NOT: { path: { startsWith: "http" } } },
        _count: true,
        _sum: { size: true },
      }),
    ])

    return NextResponse.json({
      r2Count: r2Stats._count,
      r2Size: r2Stats._sum.size || 0,
      localCount: localStats._count,
      localSize: localStats._sum.size || 0,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
