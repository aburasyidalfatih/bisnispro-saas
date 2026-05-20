import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: "Kode diskon wajib diisi" }, { status: 400 })
    }

    const { validateDiscountCode } = await import("@/features/finance/services/wallet.service")
    const result = await validateDiscountCode(code)
    return NextResponse.json(result)
  } catch (error: any) {
    const status = error.message?.includes("tidak ditemukan") ? 404 : 400
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status })
  }
}
