import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const walletId = url.searchParams.get("walletId")
  const page = parseInt(url.searchParams.get("page") || "1")
  const take = 20

  // Kalau walletId tidak disediakan, ambil wallet milik user ini
  let wallet: any
  if (walletId) {
    wallet = await db.walletAccount.findUnique({ where: { id: walletId } })
  } else {
    const parent = await db.studentParent.findFirst({
      where: { userId: session.user.id },
      include: { student: { include: { walletAccount: true } } },
    })
    wallet = parent?.student?.walletAccount
  }

  if (!wallet) return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 404 })

  const [transactions, total] = await Promise.all([
    db.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    db.walletTransaction.count({ where: { walletId: wallet.id } }),
  ])

  return NextResponse.json({
    wallet: { id: wallet.id, balance: wallet.balance },
    data: transactions,
    meta: { total, page, totalPages: Math.ceil(total / take) },
  })
}
