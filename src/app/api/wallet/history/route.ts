import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const url = new URL(req.url)
    const walletId = url.searchParams.get("walletId")
    const page = parseInt(url.searchParams.get("page") || "1")

    const { getWalletHistory } = await import("@/features/finance/services/wallet.service")
    const result = await getWalletHistory(session.user.id, walletId, page)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Wallet tidak ditemukan" }, { status: 404 })
  }
}
