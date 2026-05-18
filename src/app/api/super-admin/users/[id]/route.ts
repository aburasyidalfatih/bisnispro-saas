import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  try {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        affiliateProfile: true,
        tenants: {
          include: { tenant: true }
        }
      }
    })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  if (session.user.id === id) {
    return NextResponse.json({ error: "Tidak dapat menghapus akun Anda sendiri" }, { status: 400 })
  }

  try {
    await db.user.delete({
      where: { id }
    })
    return NextResponse.json({ message: "Pengguna berhasil dihapus" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Gagal menghapus pengguna" }, { status: 500 })
  }
}
