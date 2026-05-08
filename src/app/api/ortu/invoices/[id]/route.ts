import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// GET: Detail tagihan tertentu untuk ortu
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Pastikan tagihan ini milik salah satu anak ortu
  const parent = await db.studentParent.findFirst({
    where: {
      userId: session.user.id,
      student: { invoices: { some: { id } } },
    },
  })
  if (!parent) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })

  const invoice = await db.invoice.findFirst({
    where: { id, deletedAt: null },
    include: {
      student: {
        include: {
          classroom: true,
          walletAccount: { select: { id: true, balance: true } },
        },
      },
      billingType: true,
      payments: { orderBy: { createdAt: "desc" } },
      installments: { orderBy: { dueDate: "asc" } },
    },
  })
  if (!invoice) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 })
  return NextResponse.json(invoice)
}
