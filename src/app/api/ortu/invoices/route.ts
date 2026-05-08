import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// Ambil semua tagihan anak-anak dari orang tua yang login
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Ambil semua studentId yang milik orang tua ini
  const parents = await db.studentParent.findMany({
    where: { userId: session.user.id },
    select: { studentId: true, student: { select: { tenantId: true } } },
  })

  if (parents.length === 0) return NextResponse.json([])

  const studentIds = parents.map(p => p.studentId)

  const invoices = await db.invoice.findMany({
    where: {
      studentId: { in: studentIds },
      deletedAt: null,
    },
    include: {
      student: { select: { id: true, name: true, classroom: { select: { name: true } } } },
      billingType: { select: { name: true } },
    },
    orderBy: [
      { status: "asc" }, // UNPAID/PARTIAL dulu
      { dueDate: "asc" },
    ],
  })

  return NextResponse.json(invoices)
}
