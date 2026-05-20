import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

/**
 * GET: Retrieve broadcast history for tenant (delegates to broadcast.service)
 */
export async function GET(req: Request) {
  const session = await auth()
  
  const tenantId = session?.user?.tenants?.[0]?.id
  const role = session?.user?.tenants?.[0]?.role
  const plan = (session?.user as any)?.tenants?.[0]?.plan || "free"
  
  if (!tenantId || (role !== "owner" && role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (plan === "free") {
    return NextResponse.json({ error: "Fitur Broadcast WhatsApp hanya tersedia untuk paket Premium/Pro." }, { status: 403 })
  }

  try {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "10")
    
    const { getBroadcastHistory } = await import(
      "@/features/notification/services/broadcast.service"
    )

    const result = await getBroadcastHistory(tenantId, page, limit)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil history pesan" }, { status: 500 })
  }
}
