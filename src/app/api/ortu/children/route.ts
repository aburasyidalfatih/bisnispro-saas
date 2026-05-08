import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

// GET: Daftar anak milik orang tua ini
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const children = await db.studentParent.findMany({
    where: { userId: session.user.id },
    include: {
      student: {
        include: {
          classroom: { select: { id: true, name: true } },
          walletAccount: { select: { id: true, balance: true } },
        },
      },
    },
  })

  return NextResponse.json(children.map(c => c.student))
}
