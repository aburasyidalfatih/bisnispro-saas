import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding SchoolPro database...")

  // Wipe existing data to make seed idempotent
  await prisma.attendanceRecord.deleteMany({})
  await prisma.walletTransaction.deleteMany({})
  await prisma.walletAccount.deleteMany({})
  await prisma.studentParent.deleteMany({})
  await prisma.student.deleteMany({})
  await prisma.schedule.deleteMany({})
  await prisma.subject.deleteMany({})
  await prisma.classroom.deleteMany({})
  await prisma.staff.deleteMany({})
  await prisma.tenantUser.deleteMany({})
  await prisma.tenant.deleteMany({})
  await prisma.user.deleteMany({})

  // ==================== SUBSCRIPTION PLANS ====================
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Paket Dasar (Gratis)",
      slug: "free",
      description: "Fitur dasar untuk website sekolah. Cocok untuk mulai go digital.",
      price: 0,
      interval: "MONTHLY",
      maxStudents: 0, 
      maxStorage: 100, 
      isActive: true,
      features: JSON.stringify(["Website Company Profile Dasar", "Modul Berita & Pengumuman", "Galeri Foto", "Pusat Unduhan (Max 100MB)"]),
    },
  })

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      name: "Paket Profesional",
      slug: "pro",
      description: "Fitur lengkap termasuk sistem manajemen akademik siswa.",
      price: 150000,
      interval: "MONTHLY",
      maxStudents: 500,
      maxStorage: 1024,
      isPopular: true,
      isActive: true,
      features: JSON.stringify(["Semua fitur Dasar", "Sistem Manajemen Siswa & GTK", "E-Rapor & Jurnal", "Wallet Tabungan Siswa", "PPDB Online"]),
    },
  })

  const hashedPassword = await bcrypt.hash("admin123", 12)

  // ==================== SUPER ADMIN ====================
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@schoolpro.id" },
    update: { isSuperAdmin: true },
    create: {
      name: "Super Admin",
      email: "admin@schoolpro.id",
      password: hashedPassword,
      isSuperAdmin: true,
      emailVerified: new Date(),
    },
  })

  // ==================== TENANT ADMIN ====================
  const tenantAdmin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      name: "Kepala Sekolah (Admin)",
      email: "admin@demo.com",
      password: hashedPassword,
      isSuperAdmin: false,
      emailVerified: new Date(),
    },
  })

  // ==================== DEMO TENANT ====================
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "SMA N 1 SchoolPro",
      slug: "demo",
      description: "Sekolah Unggulan Berbasis Teknologi",
      tagline: "Cerdas, Berakhlak, Digital",
      about: "Didirikan pada tahun 2000, kami adalah pelopor sekolah digital pertama.",
      address: "Jl. Pendidikan No. 1, Jakarta",
      phone: "021-12345678",
      email: "info@demo.schoolpro.test",
      plan: proPlan.slug,
      planId: proPlan.id,
      studentQuota: proPlan.maxStudents,
      settings: {
        establishedYear: "2000",
        npsn: "12345678",
        akreditasi: "A",
        sambutanKepsek: "Selamat datang di sekolah inovatif kami.",
        visi: "Menjadi sekolah berbasis teknologi terbaik di Indonesia",
        misi: "1. Mengembangkan kurikulum adaptif\n2. Melatih karakter unggul",
      }
    },
  })

  // HUBUNGKAN ADMIN
  await prisma.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: demoTenant.id, userId: tenantAdmin.id } },
    update: { role: "owner" },
    create: { tenantId: demoTenant.id, userId: tenantAdmin.id, role: "owner" },
  })

  // ==================== GTK (GURU) ====================
  const guruUser = await prisma.user.upsert({
    where: { email: "guru@demo.com" },
    update: {},
    create: { name: "Budi Santoso, S.Pd", email: "guru@demo.com", password: hashedPassword, emailVerified: new Date() },
  })
  
  await prisma.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: demoTenant.id, userId: guruUser.id } },
    update: { role: "guru" },
    create: { tenantId: demoTenant.id, userId: guruUser.id, role: "guru" },
  })

  const staff = await prisma.staff.create({
    data: {
      tenantId: demoTenant.id,
      userId: guruUser.id,
      name: "Budi Santoso, S.Pd",
      role: "Guru Matematika",
      email: "guru@demo.com",
      subject: "Matematika"
    }
  })

  // ==================== KELAS & MAPEL ====================
  const kelas10A = await prisma.classroom.create({
    data: { tenantId: demoTenant.id, name: "10 IPA 1", capacity: 30, level: "10" }
  })

  const mtk = await prisma.subject.create({
    data: { tenantId: demoTenant.id, code: "MTK-10", name: "Matematika" }
  })

  // JADWAL MENGAJAR GURU BUDI
  await prisma.schedule.create({
    data: {
      tenantId: demoTenant.id,
      classroomId: kelas10A.id,
      subjectId: mtk.id,
      staffId: staff.id,
      dayOfWeek: new Date().getDay(), // Hari ini
      startTime: "07:00",
      endTime: "08:30"
    }
  })

  // ==================== ORANG TUA & SISWA ====================
  const ortuUser = await prisma.user.upsert({
    where: { email: "ortu@demo.com" },
    update: {},
    create: { name: "Bapak Ahmad", email: "ortu@demo.com", password: hashedPassword, emailVerified: new Date() },
  })
  await prisma.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: demoTenant.id, userId: ortuUser.id } },
    update: { role: "orangtua" },
    create: { tenantId: demoTenant.id, userId: ortuUser.id, role: "orangtua" },
  })

  const siswa = await prisma.student.create({
    data: {
      tenantId: demoTenant.id,
      name: "Rudi Haryanto",
      nis: "1001",
      nisn: "0051234567",
      gender: "L",
      classroomId: kelas10A.id,
    }
  })

  // Hubungkan anak dengan orang tua
  await prisma.studentParent.create({
    data: { studentId: siswa.id, userId: ortuUser.id, relation: "Ayah" }
  })

  // ==================== DOMPET TABUNGAN (WALLET) ====================
  const wallet = await prisma.walletAccount.create({
    data: {
      tenantId: demoTenant.id,
      studentId: siswa.id,
      balance: 150000, // Rp 150.000 saldo awal
      pin: await bcrypt.hash("123456", 10),
    }
  })

  await prisma.walletTransaction.createMany({
    data: [
      {
        tenantId: demoTenant.id,
        walletId: wallet.id,
        amount: 200000,
        balanceBefore: 0,
        balanceAfter: 200000,
        type: "DEPOSIT",
        status: "SUCCESS",
        referenceId: "TOPUP-001",
        description: "Setor Tabungan Awal"
      },
      {
        tenantId: demoTenant.id,
        walletId: wallet.id,
        amount: 50000,
        balanceBefore: 200000,
        balanceAfter: 150000,
        type: "PAYMENT",
        status: "SUCCESS",
        referenceId: "PAY-001",
        description: "Pembayaran Buku LKS"
      }
    ]
  })

  // ==================== ABSENSI ====================
  const session = await prisma.attendanceSession.create({
    data: {
      tenantId: demoTenant.id,
      classroomId: kelas10A.id,
      date: new Date(),
      createdBy: guruUser.id,
    }
  })

  await prisma.attendanceRecord.create({
    data: {
      id: "demo-att-001",
      tenantId: demoTenant.id,
      studentId: siswa.id,
      sessionId: session.id,
      status: "HADIR",
      notes: "Hadir Tepat Waktu"
    }
  })

  console.log("✅ Seed Data Sekolah Selesai!")
  console.log("")
  console.log("🏫 URL Tenant: http://demo.schoolpro.test:3002")
  console.log("")
  console.log("👑 Super Admin (Akses semua data platform):")
  console.log("   📧 admin@schoolpro.id | 🔑 admin123")
  console.log("")
  console.log("👨‍💼 Kepala Sekolah / Admin Tenant:")
  console.log("   📧 admin@demo.com | 🔑 admin123")
  console.log("")
  console.log("👨‍🏫 Guru (Akses Absen, Nilai, Poin, Jurnal):")
  console.log("   📧 guru@demo.com | 🔑 admin123")
  console.log("")
  console.log("👨‍👩‍👦 Orang Tua (Akses Tabungan, Tagihan, Absen Anak):")
  console.log("   📧 ortu@demo.com | 🔑 admin123")
  console.log("")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
