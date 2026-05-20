import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { getWalletSettings } = await import("@/features/finance/services/wallet.service")
    const result = await getWalletSettings(session.user.id)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { pin, dailyLimit } = await req.json()
    const { updateWalletSettings } = await import("@/features/finance/services/wallet.service")
    const result = await updateWalletSettings(session.user.id, pin, dailyLimit)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan" }, { status: 500 })
  }
}
