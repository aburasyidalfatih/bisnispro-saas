import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenants?.[0]?.id

  try {
    const student = await db.student.findFirst({
      where: { userId: session.user.id, tenantId },
      include: {
        walletAccount: {
          include: {
            transactions: {
              orderBy: { createdAt: "desc" },
              take: 50 // Get last 50 transactions
            }
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({
      balance: student.walletAccount?.balance || 0,
      nisn: student.nisn,
      transactions: student.walletAccount?.transactions || []
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
