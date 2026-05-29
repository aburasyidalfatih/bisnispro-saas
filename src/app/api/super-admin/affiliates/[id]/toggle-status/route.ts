import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const affiliate = await db.affiliateProfile.findUnique({
      where: { id: params.id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: "Afiliasi tidak ditemukan" }, { status: 404 })
    }

    await db.affiliateProfile.update({
      where: { id: params.id },
      data: { isActive: !affiliate.isActive }
    })

    return NextResponse.json({
      success: true,
      message: `Afiliasi berhasil di${!affiliate.isActive ? 'aktifkan' : 'blokir'}`,
    })
  } catch (error) {
    return NextResponse.json({ error: "Gagal merubah status" }, { status: 500 })
  }
}
