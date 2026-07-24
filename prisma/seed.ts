import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding BisnisPro database...")

  // Wipe existing core user/tenant data to make seed idempotent
  await prisma.tenantUser.deleteMany({})
  await prisma.tenant.deleteMany({})
  await prisma.user.deleteMany({})

  // ==================== SUBSCRIPTION PLANS ====================
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Paket Gratis",
      slug: "free",
      description: "Fitur dasar untuk website bisnis & UMKM. Cocok untuk mulai go digital.",
      price: 0,
      interval: "MONTHLY",
      maxTeamMembers: 3,
      maxStorage: 100,
      monthlyAiTokens: 50,
      isActive: true,
      features: JSON.stringify(["Website Company Profile", "Modul Berita & Layanan", "Galeri Foto", "Pusat Unduhan (Max 100MB)"]),
    },
  })

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      name: "Paket Profesional",
      slug: "pro",
      description: "Fitur lengkap untuk pertumbuhan bisnis dan integrasi AI.",
      price: 150000,
      interval: "MONTHLY",
      maxTeamMembers: 20,
      maxStorage: 1024,
      monthlyAiTokens: 500,
      isPopular: true,
      isActive: true,
      features: JSON.stringify(["Semua fitur Gratis", "Manajemen Tim & Portofolio", "Asisten AI Bisnis", "Custom Domain & Subdomain", "Laporan Analitik"]),
    },
  })

  const hashedPassword = await bcrypt.hash("admin123", 12)

  // ==================== SUPER ADMIN ====================
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@bisnispro.id" },
    update: { isSuperAdmin: true },
    create: {
      name: "Super Admin",
      email: "admin@bisnispro.id",
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
      name: "Pemilik Bisnis (Admin)",
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
      name: "Bisnis Pro Demo",
      slug: "demo",
      description: "Perusahaan Penyedia Solusi Bisnis Digital",
      tagline: "Inovasi, Kualitas, Digital",
      about: "Didirikan pada tahun 2020, kami adalah penyedia solusi bisnis digital terpercaya.",
      address: "Jl. Bisnis No. 1, Jakarta",
      phone: "081234567890",
      email: "info@demo.bisnispro.test",
      plan: proPlan.slug,
      planId: proPlan.id,
      settings: {
        establishedYear: "2020",
        visi: "Menjadi mitra digitalisasi bisnis terbaik di Indonesia",
        misi: "1. Mengembangkan produk berkualitas\n2. Memberikan layanan terbaik",
      }
    },
  })

  // HUBUNGKAN ADMIN KE TENANT
  await prisma.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: demoTenant.id, userId: tenantAdmin.id } },
    update: { role: "owner" },
    create: { tenantId: demoTenant.id, userId: tenantAdmin.id, role: "owner" },
  })

  // ==================== STAFF USER ====================
  const staffUser = await prisma.user.upsert({
    where: { email: "staff@demo.com" },
    update: {},
    create: { name: "Budi Santoso", email: "staff@demo.com", password: hashedPassword, emailVerified: new Date() },
  })
  
  await prisma.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: demoTenant.id, userId: staffUser.id } },
    update: { role: "admin" },
    create: { tenantId: demoTenant.id, userId: staffUser.id, role: "admin" },
  })

  console.log("✅ Seed Data Bisnis Selesai!")
  console.log("")
  console.log("🏢 URL Tenant: http://demo.bisnispro.test:3002")
  console.log("")
  console.log("👑 Super Admin (Akses semua data platform):")
  console.log("   📧 admin@bisnispro.id | 🔑 admin123")
  console.log("")
  console.log("👨‍💼 Pemilik Bisnis / Admin Tenant:")
  console.log("   📧 admin@demo.com | 🔑 admin123")
  console.log("")
  console.log("👨‍💻 Staff / Admin Tim:")
  console.log("   📧 staff@demo.com | 🔑 admin123")
  console.log("")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

