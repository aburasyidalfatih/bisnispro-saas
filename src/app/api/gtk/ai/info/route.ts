import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getPaymentChannels } from "@/features/finance/services/payment.service"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { aiTokens: true }
    })

    const paymentChannels = await getPaymentChannels("NOT_FOUND")

    const aiPackages = await db.aiTokenPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    })

    const platformSettings = await db.platformSetting.findMany({
      where: { key: { in: ["MANUAL_PAYMENT_BANK", "MANUAL_PAYMENT_NUMBER", "MANUAL_PAYMENT_NAME", "MANUAL_PAYMENT_WA"] } },
      select: { key: true, value: true }
    })
    
    const manualPayment = {
      bank: platformSettings.find(s => s.key === "MANUAL_PAYMENT_BANK")?.value || "Bank BCA",
      number: platformSettings.find(s => s.key === "MANUAL_PAYMENT_NUMBER")?.value || "1234 5678 90",
      name: platformSettings.find(s => s.key === "MANUAL_PAYMENT_NAME")?.value || "PT SchoolPro Indonesia",
      waNumber: platformSettings.find(s => s.key === "MANUAL_PAYMENT_WA")?.value || "6281234567890",
    }

    return NextResponse.json({
      userTokens: user?.aiTokens || 0,
      paymentChannels,
      aiPackages,
      manualPayment
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
