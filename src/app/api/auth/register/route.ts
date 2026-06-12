import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import { registerSchema } from "@/features/auth/schemas/auth.schema"
import { parseBody } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Rate limit: 10 requests per minute per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous"
    const { success } = await rateLimit(`auth:register:${ip}`, 10, 60_000)
    if (!success) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 })
    }

    const parsed = await parseBody(req, registerSchema)
    if (parsed.error) return parsed.error
    const { name, password, tenantName, tenantSlug } = parsed.data
    const email = parsed.data.email.toLowerCase()

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Jika tenantSlug ada, berarti user mendaftar di subdomain tenant (sebagai orang tua)
    if (tenantSlug) {
      const existingTenant = await db.tenant.findUnique({ where: { slug: tenantSlug } })
      if (!existingTenant) {
        return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 })
      }

      const result = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { name, email, password: hashedPassword },
        })

        await tx.tenantUser.create({
          data: { tenantId: existingTenant.id, userId: user.id, role: "orangtua" },
        })

        await tx.notificationSetting.createMany({
          data: [
            { userId: user.id, channel: "inapp", enabled: true },
            { userId: user.id, channel: "email", enabled: true },
            { userId: user.id, channel: "whatsapp", enabled: false },
          ],
        })

        return { user, tenant: existingTenant }
      })

      return NextResponse.json({
        message: "Registrasi berhasil",
        tenantSlug: result.tenant.slug,
      })
    }

    // Jika tenantSlug tidak ada (Mendaftar di domain utama / buat lembaga baru)
    if (!tenantName) {
      return NextResponse.json({ error: "Nama lembaga harus diisi" }, { status: 400 })
    }

    let slug = generateSlug(tenantName)

    // Pastikan slug unik
    const existingTenantBySlug = await db.tenant.findUnique({ where: { slug } })
    if (existingTenantBySlug) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    // Buat user, tenant, dan relasi dalam satu transaksi
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, password: hashedPassword },
      })

      // Lookup Free plan untuk bonus token awal & planId
      const freePlan = await tx.subscriptionPlan.findUnique({
        where: { slug: "free" },
        select: { id: true, monthlyAiTokens: true },
      })

      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug,
          plan: "free",
          planId: freePlan?.id || undefined,
          aiTokens: freePlan?.monthlyAiTokens || 0, // Bonus token awal
        },
      })

      await tx.tenantUser.create({
        data: { tenantId: tenant.id, userId: user.id, role: "owner" },
      })

      // Buat default notification settings
      await tx.notificationSetting.createMany({
        data: [
          { userId: user.id, channel: "inapp", enabled: true },
          { userId: user.id, channel: "email", enabled: true },
          { userId: user.id, channel: "whatsapp", enabled: false },
        ],
      })

      // Buat default website menus (syncing with reset logic)
      const beranda = await tx.websiteMenu.create({ data: { tenantId: tenant.id, label: "Beranda", url: "/", isSystem: true, order: 0 } })
      const profil = await tx.websiteMenu.create({ data: { tenantId: tenant.id, label: "Profil Sekolah", url: "/profil", isSystem: false, order: 1 } })
      const informasi = await tx.websiteMenu.create({ data: { tenantId: tenant.id, label: "Informasi", url: "/berita", isSystem: false, order: 2 } })
      const galeri = await tx.websiteMenu.create({ data: { tenantId: tenant.id, label: "Galeri", url: "/gallery", isSystem: false, order: 3 } })
      const ppdb = await tx.websiteMenu.create({ data: { tenantId: tenant.id, label: "PPDB", url: "/ppdb", isSystem: false, order: 4 } })
      await tx.websiteMenu.create({ data: { tenantId: tenant.id, label: "Kontak", url: "/contact", isSystem: false, order: 5 } })

      await tx.websiteMenu.createMany({ data: [
        { tenantId: tenant.id, label: "Profil Lembaga", url: "/profil", parentId: profil.id, order: 0 },
        { tenantId: tenant.id, label: "Guru & Staf (GTK)", url: "/gtk", parentId: profil.id, order: 1 },
        { tenantId: tenant.id, label: "Fasilitas Sekolah", url: "/fasilitas", parentId: profil.id, order: 2 },
        { tenantId: tenant.id, label: "Program Unggulan", url: "/program", parentId: profil.id, order: 3 },
        { tenantId: tenant.id, label: "Ekstrakurikuler", url: "/ekstrakurikuler", parentId: profil.id, order: 4 },
      ]})

      await tx.websiteMenu.createMany({ data: [
        { tenantId: tenant.id, label: "Pengumuman", url: "/pengumuman", parentId: informasi.id, order: 0 },
        { tenantId: tenant.id, label: "Berita & Artikel", url: "/berita", parentId: informasi.id, order: 1 },
        { tenantId: tenant.id, label: "Agenda & Acara", url: "/agenda", parentId: informasi.id, order: 2 },
        { tenantId: tenant.id, label: "Pusat Unduhan", url: "/unduhan", parentId: informasi.id, order: 3 },
      ]})

      await tx.websiteMenu.createMany({ data: [
        { tenantId: tenant.id, label: "Galeri Foto", url: "/gallery", parentId: galeri.id, order: 0 },
        { tenantId: tenant.id, label: "Prestasi Siswa", url: "/prestasi", parentId: galeri.id, order: 1 },
        { tenantId: tenant.id, label: "Alumni Success", url: "/alumni", parentId: galeri.id, order: 2 },
      ]})

      const { notifyAllSuperAdmins } = await import("@/features/super-admin/services/super-admin-notification.service")
      notifyAllSuperAdmins({
        title: "Pendaftar Tenant Baru",
        message: `Sekolah/Lembaga "${tenant.name}" baru saja mendaftar.`,
        type: "success",
        metadata: { tenantId: tenant.id, slug: tenant.slug, ownerEmail: user.email }
      }).catch(err => console.error("Gagal mengirim notifikasi super admin:", err))

      return { user, tenant }
    })

    return NextResponse.json({
      message: "Registrasi berhasil",
      tenantSlug: result.tenant.slug,
    })
  } catch (error) {
    logger.error("Register failed", error, { path: "/api/auth/register" })
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
