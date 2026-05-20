import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const { getPaymentsForSuperAdmin } = await import("@/features/super-admin/services/super-admin.service")
    const result = await getPaymentsForSuperAdmin(status)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
