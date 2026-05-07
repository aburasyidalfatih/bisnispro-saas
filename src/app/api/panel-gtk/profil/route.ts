import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentTenant = session.user.tenants?.[0]
    if (!currentTenant) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 })
    }

    const body = await req.json()
    const { name, role, email, phone, subject, education, bio } = body

    // Cek apakah staff data milik user yang sedang login
    const existingStaff = await db.staff.findFirst({
      where: {
        tenantId: currentTenant.id,
        userId: session.user.id
      }
    })

    if (!existingStaff) {
      return NextResponse.json({ error: "Profil Staff tidak ditemukan untuk user ini" }, { status: 404 })
    }

    // Update staff record
    const updatedStaff = await db.staff.update({
      where: { id: existingStaff.id },
      data: {
        name,
        role,
        email,
        phone,
        subject,
        education,
        bio
      }
    })

    // Opsional: Jika ingin mengupdate juga nama & email di tabel User agar tersinkronisasi
    if (name || email || phone) {
      await db.user.update({
        where: { id: session.user.id },
        data: {
          name: name || undefined,
          phone: phone || undefined,
        }
      })
    }

    return NextResponse.json(updatedStaff)
  } catch (error: any) {
    console.error("Error updating GTK profile:", error)
    return NextResponse.json(
      { error: "Gagal memperbarui profil", details: error.message },
      { status: 500 }
    )
  }
}
