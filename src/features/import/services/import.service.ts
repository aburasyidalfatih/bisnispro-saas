import { db } from "@/lib/db"
import bcrypt from "bcryptjs"



export interface ImportUserDTO {
  tenantId: string
  users: Array<Record<string, any>>
}

export type ImportResultDTO = {
  success: boolean
  count?: number
  error?: string
}

export class ImportService {


  static async importUsers(data: ImportUserDTO): Promise<ImportResultDTO> {
    try {
      const { tenantId, users } = data
      
      if (!users || users.length === 0) {
        return { success: false, error: "Data user kosong" }
      }

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
           // Mencegah penanggung jawab (owner) atau admin di-downgrade menjadi guru
           if (existingTu.role === "owner" || existingTu.role === "admin") {
              console.log(`Skipping role update for ${email} because they are already ${existingTu.role}`)
              continue
           }
           await db.tenantUser.update({
              where: { id: existingTu.id },
              data: { role }
           })
           successCount++
        }
      }

      return { success: true, count: successCount }
    } catch (error) {
      console.error("Failed to import users:", error)
      return { success: false, error: "Gagal mengimpor data user" }
    }
  }
}
