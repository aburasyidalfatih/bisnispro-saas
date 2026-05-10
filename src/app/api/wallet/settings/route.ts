import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { pin, dailyLimit } = await req.json()
    const student = await db.student.findFirst({
      where: { userId: session.user.id } // Assume parent/student uses same user/student logic or parent can access it via studentParent
    })

    // Actually parent manages student's wallet via relation
    // Let's find student where parent is the user
    const parentRelation = await db.studentParent.findFirst({
      where: { userId: session.user.id },
      include: { student: { include: { walletAccount: true } } }
    })

    if (!parentRelation || !parentRelation.student.walletAccount) {
      return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 })
    }

    const walletId = parentRelation.student.walletAccount.id

    await db.walletAccount.update({
      where: { id: walletId },
      data: {
        pin: pin && pin.length === 6 ? pin : undefined,
        dailyLimit: dailyLimit !== undefined ? Number(dailyLimit) : undefined
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Wallet settings error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const parentRelation = await db.studentParent.findFirst({
      where: { userId: session.user.id },
      include: { student: { include: { walletAccount: true } } }
    })

    if (!parentRelation || !parentRelation.student.walletAccount) {
      return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 })
    }

    const wallet = parentRelation.student.walletAccount

    return NextResponse.json({
      hasPin: !!wallet.pin,
      dailyLimit: wallet.dailyLimit || 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
