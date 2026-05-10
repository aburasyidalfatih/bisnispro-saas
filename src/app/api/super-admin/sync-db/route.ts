import { NextResponse } from "next/server"
import { execSync } from "child_process"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = execSync("node node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate")
    return NextResponse.json({ success: true, message: "Database synchronized!", output: result.toString() })
  } catch (error: any) {
    console.error("Sync DB error:", error)
    return NextResponse.json({ error: "Sync failed", details: error?.message || String(error) }, { status: 500 })
  }
}
