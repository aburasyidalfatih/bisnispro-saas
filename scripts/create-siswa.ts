import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: "demo" }
  })

  if (!tenant) {
    console.log("Tenant demo tidak ditemukan!")
    return
  }

  const hashedPassword = await bcrypt.hash("admin123", 10)

  // 1. Buat User Siswa
  const user = await prisma.user.upsert({
    where: { email: "siswa@demo.com" },
    update: { password: hashedPassword },
    create: {
      name: "Siswa Demo CBT",
      email: "siswa@demo.com",
      password: hashedPassword,
    }
  })

  // 2. Hubungkan User ke Tenant sebagai siswa
  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: user.id
      }
    },
    update: { role: "siswa" },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: "siswa"
    }
  })

  // 3. Buat Data Induk Siswa di tabel Student
  await prisma.student.upsert({
    where: { nis: "123456789" },
    update: { userId: user.id },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      name: "Siswa Demo CBT",
      nis: "123456789",
      nisn: "0012345678",
      gender: "L",
      isActive: true
    }
  })

  console.log("✅ Berhasil membuat akun siswa demo!")
  console.log("Email: siswa@demo.com")
  console.log("Password: admin123")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
