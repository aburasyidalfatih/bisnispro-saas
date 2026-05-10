import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

interface ImportStudentDTO {
  tenantId: string;
  students: any[];
}

interface ImportUserDTO {
  tenantId: string;
  users: any[];
}

export class ImportService {
  static async importStudents(data: ImportStudentDTO) {
    const { tenantId, students } = data

    const mappedStudents = students.map((row: any) => ({
      tenantId,
      name: row["Nama Lengkap"],
      nis: row["NIS"] || null,
      nisn: row["NISN"] || null,
      email: row["Email (Opsional)"] || null,
      gender: row["Gender (L/P)"]?.toUpperCase() === "P" ? "P" : "L", // default L
      isActive: true
    }))

    const result = await db.student.createMany({
      data: mappedStudents,
      skipDuplicates: true 
    })

    return { success: true, count: result.count }
  }

  static async importUsers(data: ImportUserDTO) {
    const { tenantId, users } = data
    let successCount = 0
    const defaultPassword = await bcrypt.hash("admin123", 12)

    for (const row of users) {
      const email = row["Email"]?.trim()
      if (!email) continue

      const name = row["Nama Lengkap"] || "User Tanpa Nama"
      const phone = row["No HP (Opsional)"] || null
      let role = row["Role (guru/admin/staff)"]?.toLowerCase() || "guru"
      if (!["guru", "admin", "staff"].includes(role)) {
        role = "guru"
      }

      let user = await db.user.findUnique({ where: { email } })

      if (!user) {
         user = await db.user.create({
            data: {
               name,
               email,
               phone,
               password: defaultPassword, 
               isActive: true
            }
         })
      }

      const existingTu = await db.tenantUser.findUnique({
         where: { tenantId_userId: { tenantId, userId: user.id } }
      })

      if (!existingTu) {
         await db.tenantUser.create({
            data: {
               tenantId,
               userId: user.id,
               role
            }
         })
         successCount++
      } else if (existingTu.role !== role) {
         await db.tenantUser.update({
            where: { id: existingTu.id },
            data: { role }
         })
         successCount++
      }
    }

    return { success: true, count: successCount }
  }
}
